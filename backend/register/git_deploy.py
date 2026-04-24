"""
Git Deploy module — встроен в register функцию.
Клонирует любой Git-репозиторий, определяет фреймворк, собирает, деплоит на S3/CDN.
"""
import json
import os
import subprocess
import shutil
import tempfile
import mimetypes
import boto3
from datetime import datetime

SCHEMA = 't_p30709305_project_evolution_jo'

BUILD_COMMANDS = {
    'nextjs': {'install': 'npm ci --legacy-peer-deps', 'build': 'npm run build', 'out': 'out'},
    'react':  {'install': 'npm ci --legacy-peer-deps', 'build': 'npm run build', 'out': 'dist'},
    'vue':    {'install': 'npm ci --legacy-peer-deps', 'build': 'npm run build', 'out': 'dist'},
    'nuxt':   {'install': 'npm ci --legacy-peer-deps', 'build': 'npm run generate', 'out': '.output/public'},
    'svelte': {'install': 'npm ci --legacy-peer-deps', 'build': 'npm run build', 'out': 'build'},
    'astro':  {'install': 'npm ci --legacy-peer-deps', 'build': 'npm run build', 'out': 'dist'},
    'remix':  {'install': 'npm ci --legacy-peer-deps', 'build': 'npm run build', 'out': 'public/build'},
    'other':  {'install': 'npm ci --legacy-peer-deps', 'build': 'npm run build', 'out': 'dist'},
}


def run_cmd(cmd, cwd=None, env=None, log_lines=None):
    merged = {**os.environ, **(env or {})}
    # cmd может быть строкой (shell=True) или списком (shell=False)
    use_shell = isinstance(cmd, str)
    proc = subprocess.run(cmd, shell=use_shell, cwd=cwd, capture_output=True, text=True, env=merged)
    out = (proc.stdout + proc.stderr).strip()
    if log_lines is not None:
        for line in out.splitlines():
            log_lines.append(line)
    return proc.returncode, out


def git_clone(repo_url, branch, dest_dir, log_lines=None):
    """Клонирует репо безопасно через список аргументов (без shell=True)"""
    # Пробуем с конкретной веткой
    rc, out = run_cmd(
        ['git', 'clone', '--depth', '1', '--branch', branch, repo_url, 'repo'],
        cwd=dest_dir, log_lines=log_lines
    )
    if rc == 0:
        return rc, out
    # Если ветка не найдена — клонируем default
    if log_lines is not None:
        log_lines.append('[warn] ветка "%s" не найдена, клоную default...' % branch)
    # Удаляем неполный клон если есть
    repo_path = os.path.join(dest_dir, 'repo')
    if os.path.exists(repo_path):
        shutil.rmtree(repo_path)
    rc2, out2 = run_cmd(
        ['git', 'clone', '--depth', '1', repo_url, 'repo'],
        cwd=dest_dir, log_lines=log_lines
    )
    return rc2, out2


def detect_framework(repo_dir):
    pkg_path = os.path.join(repo_dir, 'package.json')
    if os.path.exists(pkg_path):
        try:
            pkg = json.load(open(pkg_path))
            deps = {**pkg.get('dependencies', {}), **pkg.get('devDependencies', {})}
            if 'next' in deps: return 'nextjs'
            if 'nuxt' in deps: return 'nuxt'
            if '@sveltejs/kit' in deps or 'svelte' in deps: return 'svelte'
            if 'astro' in deps: return 'astro'
            if '@remix-run/react' in deps: return 'remix'
            if 'vue' in deps: return 'vue'
            if 'react' in deps: return 'react'
        except Exception:
            pass
    return 'other'


def find_dist(repo_dir, hint):
    for c in [hint, 'dist', 'out', 'build', '.output/public', 'public']:
        p = os.path.join(repo_dir, c)
        if os.path.isdir(p):
            return p
    return None


def upload_to_s3(dist_dir, s3_prefix):
    s3 = boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
    fc = tb = 0
    for root, _, files in os.walk(dist_dir):
        for fn in files:
            lp = os.path.join(root, fn)
            rel = os.path.relpath(lp, dist_dir).replace('\\', '/')
            mime = mimetypes.guess_type(fn)[0] or 'application/octet-stream'
            with open(lp, 'rb') as f:
                s3.put_object(Bucket='files', Key='%s/%s' % (s3_prefix, rel), Body=f.read(), ContentType=mime)
            fc += 1; tb += os.path.getsize(lp)
    return fc, tb


def git_deploy(body, conn, resp_fn):
    """Полный деплой из Git. conn — открытое соединение с БД."""
    project_id = body.get('project_id')
    user_id = body.get('user_id')
    repo_url = (body.get('repo_url') or '').strip()
    if not project_id or not user_id or not repo_url:
        return resp_fn(400, {'error': 'project_id, user_id и repo_url обязательны'})

    branch = (body.get('branch') or 'main').strip().replace("'", "")
    custom_build = (body.get('build_cmd') or '').strip()
    custom_out = (body.get('out_dir') or '').strip()
    extra_env = body.get('env_vars') or {}
    forced_fw = (body.get('framework') or '').strip()
    git_token = (body.get('git_token') or '').strip()

    cur = conn.cursor()
    cur.execute(
        "SELECT p.name, p.domain, p.env_vars FROM %s.projects p WHERE p.id = %s AND p.user_id = %s"
        % (SCHEMA, int(project_id), int(user_id))
    )
    proj = cur.fetchone()
    if not proj:
        cur.close()
        return resp_fn(404, {'error': 'Проект не найден'})

    proj_name = proj[0]
    domain = proj[1] or ('%s.clodev.ru' % proj_name.lower().replace(' ', '-'))
    saved_env = proj[2] or {}

    safe_repo = repo_url.replace("'", "''")
    cur.execute(
        "INSERT INTO %s.deployments (project_id, status, branch, commit_sha, commit_message, url, build_log, duration_seconds) "
        "VALUES (%s, 'building', '%s', 'pending', 'Git deploy', 'https://%s', 'Запуск...', 0) RETURNING id"
        % (SCHEMA, int(project_id), branch, domain)
    )
    deploy_id = cur.fetchone()[0]
    cur.execute("UPDATE %s.projects SET repo_url='%s', updated_at=NOW() WHERE id=%s" % (SCHEMA, safe_repo, int(project_id)))
    conn.commit()

    # Нормализуем URL — убираем пробелы и невидимые символы
    repo_url = repo_url.strip().strip('\u00ab\u00bb\u201c\u201d\u2018\u2019')

    log_lines = ['repo: %s' % repo_url, 'branch: %s' % branch]
    t0 = datetime.now()
    tmp = tempfile.mkdtemp()

    try:
        # Строим URL с токеном для авторизации
        if git_token:
            token = git_token.strip()
            if repo_url.startswith('https://'):
                if 'gitlab.com' in repo_url:
                    auth_url = 'https://oauth2:%s@%s' % (token, repo_url[len('https://'):])
                elif 'bitbucket.org' in repo_url:
                    auth_url = 'https://x-token-auth:%s@%s' % (token, repo_url[len('https://'):])
                else:
                    auth_url = 'https://%s@%s' % (token, repo_url[len('https://'):])
            else:
                auth_url = repo_url
        else:
            auth_url = repo_url

        log_lines.append('\n[1/4] Клонирование...')
        rc, out = git_clone(auth_url, branch, tmp, log_lines=log_lines)
        if rc != 0:
            raise RuntimeError('Не удалось клонировать репозиторий:\n' + out[-500:])

        repo_dir = os.path.join(tmp, 'repo')
        _, sha = run_cmd(['git', 'rev-parse', '--short', 'HEAD'], cwd=repo_dir)
        _, msg = run_cmd(['git', 'log', '-1', '--pretty=%B'], cwd=repo_dir)
        sha = (sha or 'unknown')[:7]
        msg = (msg or 'Git deploy').strip()[:200]
        log_lines.append('commit: %s — %s' % (sha, msg))

        fw = forced_fw or detect_framework(repo_dir)
        log_lines.append('[detect] framework: %s' % fw)
        cfg = BUILD_COMMANDS.get(fw, BUILD_COMMANDS['other'])

        log_lines.append('\n[2/4] Установка зависимостей...')
        rc, _ = run_cmd(cfg['install'], cwd=repo_dir, log_lines=log_lines)
        if rc != 0:
            log_lines.append('[retry] trying bun...')
            rc, _ = run_cmd('bun install', cwd=repo_dir, log_lines=log_lines)
            if rc != 0:
                raise RuntimeError('Ошибка установки зависимостей')

        log_lines.append('\n[3/4] Сборка...')
        build_cmd = custom_build or cfg['build']
        log_lines.append('$ ' + build_cmd)
        build_env = {**{k: str(v) for k, v in saved_env.items()},
                     **{k: str(v) for k, v in extra_env.items()},
                     'NODE_ENV': 'production'}
        rc, out = run_cmd(build_cmd, cwd=repo_dir, env=build_env, log_lines=log_lines)
        if rc != 0:
            raise RuntimeError('Ошибка сборки:\n' + out[-1000:])

        log_lines.append('\n[4/4] Загрузка на CDN...')
        dist = find_dist(repo_dir, custom_out or cfg['out'])
        if not dist:
            raise RuntimeError('Папка с билдом не найдена. Ожидалась: %s' % (custom_out or cfg['out']))

        s3_prefix = 'deploys/%s/%s' % (project_id, deploy_id)
        fc, tb = upload_to_s3(dist, s3_prefix)
        cdn = 'https://cdn.poehali.dev/projects/%s/bucket/%s' % (os.environ['AWS_ACCESS_KEY_ID'], s3_prefix)
        deploy_url = cdn + '/index.html'
        log_lines.append('files: %d (%.1f KB)' % (fc, tb / 1024))
        log_lines.append('url: ' + cdn)
        log_lines.append('\n✅ Деплой успешно завершён!')

        duration = int((datetime.now() - t0).total_seconds())
        safe_log = '\n'.join(log_lines).replace("'", "''")

        cur.execute(
            "UPDATE %s.deployments SET status='ready', commit_sha='%s', commit_message='%s', url='%s', "
            "build_log='%s', duration_seconds=%s, finished_at=NOW() WHERE id=%s"
            % (SCHEMA, sha.replace("'",""), msg.replace("'","''"),
               deploy_url.replace("'",""), safe_log, duration, deploy_id)
        )
        cur.execute(
            "UPDATE %s.projects SET framework='%s', domain='%s', updated_at=NOW() WHERE id=%s"
            % (SCHEMA, fw, domain, int(project_id))
        )
        cur.execute(
            "INSERT INTO %s.notifications (user_id, project_id, type, message) "
            "VALUES (%s, %s, 'deploy.ready', 'Git деплой завершён: %s')"
            % (SCHEMA, int(user_id), int(project_id), proj_name.replace("'","''"))
        )
        conn.commit(); cur.close()

        return resp_fn(200, {
            'success': True, 'deploy_id': deploy_id, 'status': 'ready',
            'url': deploy_url, 'cdn_base': cdn, 'framework': fw,
            'files': fc, 'duration_seconds': duration,
            'commit_sha': sha, 'commit_message': msg,
        })

    except Exception as e:
        log_lines.append('\n❌ ERROR: ' + str(e))
        duration = int((datetime.now() - t0).total_seconds())
        safe_log = '\n'.join(log_lines).replace("'", "''")
        cur.execute(
            "UPDATE %s.deployments SET status='error', build_log='%s', duration_seconds=%s, finished_at=NOW() WHERE id=%s"
            % (SCHEMA, safe_log, duration, deploy_id)
        )
        conn.commit(); cur.close()
        return resp_fn(500, {'error': str(e)[:500], 'deploy_id': deploy_id})
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def git_detect(repo_url):
    """Автодетект фреймворка без деплоя — клонируем и читаем package.json"""
    repo_url = repo_url.strip().strip('\u00ab\u00bb\u201c\u201d\u2018\u2019')
    tmp = tempfile.mkdtemp()
    try:
        rc, out = run_cmd(['git', 'clone', '--depth', '1', repo_url, 'repo'], cwd=tmp)
        if rc != 0:
            return None, out[-400:]
        repo_dir = os.path.join(tmp, 'repo')
        fw = detect_framework(repo_dir)
        scripts = {}
        pkg_path = os.path.join(repo_dir, 'package.json')
        if os.path.exists(pkg_path):
            try:
                scripts = json.load(open(pkg_path)).get('scripts', {})
            except Exception:
                pass
        cfg = BUILD_COMMANDS.get(fw, BUILD_COMMANDS['other'])
        return {'framework': fw, 'scripts': scripts,
                'build_cmd': cfg['build'], 'out_dir': cfg['out']}, None
    finally:
        shutil.rmtree(tmp, ignore_errors=True)