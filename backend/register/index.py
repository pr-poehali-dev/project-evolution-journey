import json
import os
import hashlib
import psycopg2
import random
import string
import smtplib
import urllib.request
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta

SCHEMA = 't_p30709305_project_evolution_jo'

FRAMEWORKS = ['nextjs', 'react', 'vue', 'nuxt', 'svelte', 'astro', 'remix', 'other']
STATUSES = ['queued', 'building', 'ready', 'error', 'cancelled']


def resp(status, data):
    return {
        'statusCode': status,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps(data, ensure_ascii=False, default=str)
    }


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def rand_sha():
    return ''.join(random.choices(string.hexdigits[:16], k=7))


# ── AUTH ──────────────────────────────────────────────────────────────────────

def handle_register(body):
    email = (body.get('email') or '').strip().lower()
    password = (body.get('password') or '').strip()
    plan = body.get('plan', 'free')
    if not email or not password:
        return resp(400, {'error': 'Email и пароль обязательны'})
    if len(password) < 8:
        return resp(400, {'error': 'Пароль должен быть не менее 8 символов'})
    if plan not in ('free', 'pro'):
        plan = 'free'
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT id FROM %s.users WHERE email = '%s'" % (SCHEMA, email))
    if cur.fetchone():
        cur.close(); conn.close()
        return resp(409, {'error': 'Пользователь с таким email уже существует'})
    cur.execute(
        "INSERT INTO %s.users (email, password_hash, plan) VALUES ('%s', '%s', '%s') RETURNING id"
        % (SCHEMA, email, password_hash, plan)
    )
    user_id = cur.fetchone()[0]
    conn.commit(); cur.close(); conn.close()
    return resp(201, {'success': True, 'user_id': user_id, 'plan': plan})


def handle_login(body):
    email = (body.get('email') or '').strip().lower()
    password = (body.get('password') or '').strip()
    if not email or not password:
        return resp(400, {'error': 'Email и пароль обязательны'})
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        "SELECT id, plan FROM %s.users WHERE email = '%s' AND password_hash = '%s'"
        % (SCHEMA, email, password_hash)
    )
    row = cur.fetchone(); cur.close(); conn.close()
    if not row:
        return resp(401, {'error': 'Неверный email или пароль'})
    return resp(200, {'success': True, 'user_id': row[0], 'plan': row[1], 'email': email})


# ── PROJECTS ──────────────────────────────────────────────────────────────────

def handle_get_projects(params):
    user_id = params.get('user_id', '')
    if not user_id:
        return resp(400, {'error': 'user_id обязателен'})
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        "SELECT p.id, p.name, p.repo_url, p.framework, p.domain, p.created_at, p.updated_at, "
        "(SELECT status FROM %s.deployments d WHERE d.project_id = p.id ORDER BY d.created_at DESC LIMIT 1) as last_status, "
        "(SELECT created_at FROM %s.deployments d WHERE d.project_id = p.id ORDER BY d.created_at DESC LIMIT 1) as last_deploy "
        "FROM %s.projects p WHERE p.user_id = %s ORDER BY p.updated_at DESC"
        % (SCHEMA, SCHEMA, SCHEMA, int(user_id))
    )
    rows = cur.fetchall(); cur.close(); conn.close()
    projects = [
        {'id': r[0], 'name': r[1], 'repo_url': r[2], 'framework': r[3],
         'domain': r[4], 'created_at': r[5], 'updated_at': r[6],
         'last_status': r[7], 'last_deploy': r[8]}
        for r in rows
    ]
    return resp(200, {'projects': projects})


def handle_create_project(body):
    user_id = body.get('user_id')
    name = (body.get('name') or '').strip()
    if not user_id or not name:
        return resp(400, {'error': 'user_id и name обязательны'})
    repo_url = (body.get('repo_url') or '').strip()
    framework = body.get('framework', 'other')
    if framework not in FRAMEWORKS:
        framework = 'other'
    safe_name = name.replace("'", "''")
    safe_repo = repo_url.replace("'", "''")
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        "INSERT INTO %s.projects (user_id, name, repo_url, framework) VALUES (%s, '%s', '%s', '%s') RETURNING id, created_at"
        % (SCHEMA, int(user_id), safe_name, safe_repo, framework)
    )
    row = cur.fetchone()
    project_id = row[0]
    # Создаём первый деплой автоматически
    domain = '%s.clodev.ru' % name.lower().replace(' ', '-')
    cur.execute(
        "UPDATE %s.projects SET domain = '%s', updated_at = NOW() WHERE id = %s"
        % (SCHEMA, domain, project_id)
    )
    cur.execute(
        "INSERT INTO %s.deployments (project_id, status, branch, commit_sha, commit_message, url, build_log, duration_seconds, finished_at) "
        "VALUES (%s, 'ready', 'main', '%s', 'Initial deployment', 'https://%s', 'Build completed successfully\nDeployed to edge network\nDone in 23s', 23, NOW()) RETURNING id"
        % (SCHEMA, project_id, rand_sha(), domain)
    )
    conn.commit(); cur.close(); conn.close()
    return resp(201, {'success': True, 'project_id': project_id, 'domain': domain})


def handle_get_project(params):
    project_id = params.get('project_id', '')
    user_id = params.get('user_id', '')
    if not project_id or not user_id:
        return resp(400, {'error': 'project_id и user_id обязательны'})
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        "SELECT id, name, repo_url, framework, domain, env_vars, created_at, updated_at "
        "FROM %s.projects WHERE id = %s AND user_id = %s"
        % (SCHEMA, int(project_id), int(user_id))
    )
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return resp(404, {'error': 'Проект не найден'})
    project = {
        'id': row[0], 'name': row[1], 'repo_url': row[2], 'framework': row[3],
        'domain': row[4], 'env_vars': row[5] or {}, 'created_at': row[6], 'updated_at': row[7]
    }
    cur.execute(
        "SELECT id, status, branch, commit_sha, commit_message, url, build_log, duration_seconds, created_at, finished_at "
        "FROM %s.deployments WHERE project_id = %s ORDER BY created_at DESC LIMIT 20"
        % (SCHEMA, int(project_id))
    )
    deps = cur.fetchall()
    cur.execute("SELECT id, domain, verified FROM %s.domains WHERE project_id = %s" % (SCHEMA, int(project_id)))
    doms = cur.fetchall()
    cur.close(); conn.close()
    deployments = [
        {'id': d[0], 'status': d[1], 'branch': d[2], 'commit_sha': d[3],
         'commit_message': d[4], 'url': d[5], 'build_log': d[6],
         'duration_seconds': d[7], 'created_at': d[8], 'finished_at': d[9]}
        for d in deps
    ]
    domains = [{'id': d[0], 'domain': d[1], 'verified': d[2]} for d in doms]
    return resp(200, {'project': project, 'deployments': deployments, 'domains': domains})


def handle_deploy(body):
    project_id = body.get('project_id')
    user_id = body.get('user_id')
    if not project_id or not user_id:
        return resp(400, {'error': 'project_id и user_id обязательны'})
    branch = (body.get('branch') or 'main').replace("'", "")
    msg = (body.get('commit_message') or 'Manual deploy').replace("'", "''")
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        "SELECT p.id, p.name, p.domain, u.email FROM %s.projects p JOIN %s.users u ON u.id = p.user_id WHERE p.id = %s AND p.user_id = %s"
        % (SCHEMA, SCHEMA, int(project_id), int(user_id))
    )
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return resp(404, {'error': 'Проект не найден'})
    proj_name = row[1]; domain = row[2] or ''; user_email = row[3]
    # Preview URL для не-main веток
    if branch != 'main':
        deploy_url = 'https://%s-%s.clodev.ru' % (branch.lower().replace('/', '-'), rand_sha())
    else:
        deploy_url = 'https://%s' % domain
    sha = rand_sha()
    log = 'Cloning repository...\nInstalling dependencies...\nBuilding project...\nOptimizing assets...\nDeploying to edge network...\nDone in 31s'
    cur.execute(
        "INSERT INTO %s.deployments (project_id, status, branch, commit_sha, commit_message, url, build_log, duration_seconds, finished_at) "
        "VALUES (%s, 'ready', '%s', '%s', '%s', '%s', '%s', 31, NOW()) RETURNING id"
        % (SCHEMA, int(project_id), branch, sha, msg, deploy_url, log)
    )
    dep_id = cur.fetchone()[0]
    cur.execute("UPDATE %s.projects SET updated_at = NOW() WHERE id = %s" % (SCHEMA, int(project_id)))
    # Уведомление в БД
    notif_msg = "Деплой проекта %s завершён успешно. Ветка: %s" % (proj_name, branch)
    cur.execute(
        "INSERT INTO %s.notifications (user_id, project_id, type, message) VALUES (%s, %s, 'deploy.ready', '%s')"
        % (SCHEMA, int(user_id), int(project_id), notif_msg.replace("'", "''"))
    )
    conn.commit(); cur.close(); conn.close()
    # Email-уведомление
    send_email(
        user_email,
        '✅ Деплой завершён — %s' % proj_name,
        '''<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#0a0a0a;color:#fff;border-radius:8px">
        <h2 style="color:#60a5fa;margin-bottom:8px">CLODEV</h2>
        <h3 style="margin-bottom:16px">Деплой завершён успешно ✅</h3>
        <p style="color:#9ca3af">Проект: <strong style="color:#fff">%s</strong></p>
        <p style="color:#9ca3af">Ветка: <strong style="color:#fff">%s</strong></p>
        <p style="color:#9ca3af">Commit: <strong style="color:#fff">%s</strong></p>
        <a href="%s" style="display:inline-block;margin-top:20px;padding:10px 24px;background:#60a5fa;color:#000;text-decoration:none;font-weight:600;border-radius:4px">Открыть сайт</a>
        </div>''' % (proj_name, branch, sha, deploy_url)
    )
    # Webhook
    fire_webhooks(int(project_id), 'deploy.ready', {'project': proj_name, 'branch': branch, 'sha': sha, 'url': deploy_url, 'deployment_id': dep_id})
    return resp(201, {'success': True, 'deployment_id': dep_id, 'status': 'ready', 'url': deploy_url})


def handle_delete_project(body):
    project_id = body.get('project_id')
    user_id = body.get('user_id')
    if not project_id or not user_id:
        return resp(400, {'error': 'project_id и user_id обязательны'})
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        "UPDATE %s.projects SET name = '[deleted]', updated_at = NOW() WHERE id = %s AND user_id = %s"
        % (SCHEMA, int(project_id), int(user_id))
    )
    conn.commit(); cur.close(); conn.close()
    return resp(200, {'success': True})


def handle_update_env(body):
    project_id = body.get('project_id')
    user_id = body.get('user_id')
    env_vars = body.get('env_vars', {})
    if not project_id or not user_id:
        return resp(400, {'error': 'project_id и user_id обязательны'})
    safe_env = json.dumps(env_vars, ensure_ascii=False).replace("'", "''")
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        "UPDATE %s.projects SET env_vars = '%s'::jsonb, updated_at = NOW() WHERE id = %s AND user_id = %s"
        % (SCHEMA, safe_env, int(project_id), int(user_id))
    )
    conn.commit(); cur.close(); conn.close()
    return resp(200, {'success': True})


def handle_add_domain(body):
    project_id = body.get('project_id')
    user_id = body.get('user_id')
    domain = (body.get('domain') or '').strip().lower().replace("'", "")
    if not project_id or not user_id or not domain:
        return resp(400, {'error': 'project_id, user_id и domain обязательны'})
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT id FROM %s.projects WHERE id = %s AND user_id = %s" % (SCHEMA, int(project_id), int(user_id)))
    if not cur.fetchone():
        cur.close(); conn.close()
        return resp(404, {'error': 'Проект не найден'})
    cur.execute(
        "INSERT INTO %s.domains (project_id, domain) VALUES (%s, '%s') RETURNING id"
        % (SCHEMA, int(project_id), domain)
    )
    dom_id = cur.fetchone()[0]
    conn.commit(); cur.close(); conn.close()
    return resp(201, {'success': True, 'domain_id': dom_id})


# ── ANALYTICS ────────────────────────────────────────────────────────────────

def handle_get_analytics(params):
    project_id = params.get('project_id', '')
    user_id = params.get('user_id', '')
    if not project_id or not user_id:
        return resp(400, {'error': 'project_id и user_id обязательны'})
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT id FROM %s.projects WHERE id = %s AND user_id = %s" % (SCHEMA, int(project_id), int(user_id)))
    if not cur.fetchone():
        cur.close(); conn.close()
        return resp(404, {'error': 'Проект не найден'})
    # Генерируем фейковые данные за 30 дней если нет реальных
    cur.execute("SELECT COUNT(*) FROM %s.analytics WHERE project_id = %s" % (SCHEMA, int(project_id)))
    count = cur.fetchone()[0]
    if count == 0:
        for i in range(30):
            d = (datetime.now() - timedelta(days=29-i)).strftime('%Y-%m-%d')
            v = random.randint(50, 800)
            uv = int(v * random.uniform(0.5, 0.85))
            bw = round(random.uniform(10, 150), 2)
            rq = v * random.randint(3, 8)
            cur.execute(
                "INSERT INTO %s.analytics (project_id, date, views, unique_visitors, bandwidth_mb, requests) VALUES (%s, '%s', %s, %s, %s, %s) ON CONFLICT DO NOTHING"
                % (SCHEMA, int(project_id), d, v, uv, bw, rq)
            )
        conn.commit()
    cur.execute(
        "SELECT date, views, unique_visitors, bandwidth_mb, requests FROM %s.analytics WHERE project_id = %s ORDER BY date DESC LIMIT 30"
        % (SCHEMA, int(project_id))
    )
    rows = cur.fetchall()
    cur.close(); conn.close()
    data = [{'date': str(r[0]), 'views': r[1], 'unique_visitors': r[2], 'bandwidth_mb': float(r[3]), 'requests': r[4]} for r in rows]
    total_views = sum(r['views'] for r in data)
    total_uv = sum(r['unique_visitors'] for r in data)
    total_bw = round(sum(r['bandwidth_mb'] for r in data), 2)
    total_rq = sum(r['requests'] for r in data)
    return resp(200, {'analytics': data, 'totals': {'views': total_views, 'unique_visitors': total_uv, 'bandwidth_mb': total_bw, 'requests': total_rq}})


# ── TEAM ──────────────────────────────────────────────────────────────────────

def handle_get_team(params):
    user_id = params.get('user_id', '')
    if not user_id:
        return resp(400, {'error': 'user_id обязателен'})
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        "SELECT id, member_email, role, status, created_at FROM %s.team_members WHERE owner_user_id = %s ORDER BY created_at DESC"
        % (SCHEMA, int(user_id))
    )
    rows = cur.fetchall(); cur.close(); conn.close()
    members = [{'id': r[0], 'email': r[1], 'role': r[2], 'status': r[3], 'created_at': r[4].isoformat()} for r in rows]
    return resp(200, {'members': members})


def handle_invite_member(body):
    user_id = body.get('user_id')
    email = (body.get('email') or '').strip().lower()
    role = body.get('role', 'member')
    if not user_id or not email:
        return resp(400, {'error': 'user_id и email обязательны'})
    if role not in ('member', 'viewer', 'admin'):
        role = 'member'
    safe_email = email.replace("'", "")
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        "SELECT id FROM %s.team_members WHERE owner_user_id = %s AND member_email = '%s'"
        % (SCHEMA, int(user_id), safe_email)
    )
    if cur.fetchone():
        cur.close(); conn.close()
        return resp(409, {'error': 'Участник уже приглашён'})
    cur.execute(
        "INSERT INTO %s.team_members (owner_user_id, member_email, role) VALUES (%s, '%s', '%s') RETURNING id"
        % (SCHEMA, int(user_id), safe_email, role)
    )
    member_id = cur.fetchone()[0]
    conn.commit(); cur.close(); conn.close()
    return resp(201, {'success': True, 'member_id': member_id})


def handle_remove_member(body):
    user_id = body.get('user_id')
    member_id = body.get('member_id')
    if not user_id or not member_id:
        return resp(400, {'error': 'user_id и member_id обязательны'})
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        "UPDATE %s.team_members SET status = 'removed' WHERE id = %s AND owner_user_id = %s"
        % (SCHEMA, int(member_id), int(user_id))
    )
    conn.commit(); cur.close(); conn.close()
    return resp(200, {'success': True})


# ── WEBHOOKS ──────────────────────────────────────────────────────────────────

def handle_get_webhooks(params):
    project_id = params.get('project_id', '')
    user_id = params.get('user_id', '')
    if not project_id or not user_id:
        return resp(400, {'error': 'project_id и user_id обязательны'})
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT id FROM %s.projects WHERE id = %s AND user_id = %s" % (SCHEMA, int(project_id), int(user_id)))
    if not cur.fetchone():
        cur.close(); conn.close()
        return resp(404, {'error': 'Проект не найден'})
    cur.execute(
        "SELECT id, url, events, active, created_at FROM %s.webhooks WHERE project_id = %s ORDER BY created_at DESC"
        % (SCHEMA, int(project_id))
    )
    rows = cur.fetchall(); cur.close(); conn.close()
    webhooks = [{'id': r[0], 'url': r[1], 'events': r[2], 'active': r[3], 'created_at': r[4].isoformat()} for r in rows]
    return resp(200, {'webhooks': webhooks})


def handle_add_webhook(body):
    project_id = body.get('project_id')
    user_id = body.get('user_id')
    url = (body.get('url') or '').strip()
    events = (body.get('events') or 'deploy.ready,deploy.error').strip()
    if not project_id or not user_id or not url:
        return resp(400, {'error': 'project_id, user_id и url обязательны'})
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT id FROM %s.projects WHERE id = %s AND user_id = %s" % (SCHEMA, int(project_id), int(user_id)))
    if not cur.fetchone():
        cur.close(); conn.close()
        return resp(404, {'error': 'Проект не найден'})
    safe_url = url.replace("'", "")
    safe_events = events.replace("'", "")
    secret = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
    cur.execute(
        "INSERT INTO %s.webhooks (project_id, url, events, secret) VALUES (%s, '%s', '%s', '%s') RETURNING id"
        % (SCHEMA, int(project_id), safe_url, safe_events, secret)
    )
    wh_id = cur.fetchone()[0]
    conn.commit(); cur.close(); conn.close()
    return resp(201, {'success': True, 'webhook_id': wh_id, 'secret': secret})


def handle_toggle_webhook(body):
    webhook_id = body.get('webhook_id')
    user_id = body.get('user_id')
    active = body.get('active', True)
    if not webhook_id or not user_id:
        return resp(400, {'error': 'webhook_id и user_id обязательны'})
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        "UPDATE %s.webhooks SET active = %s WHERE id = %s AND project_id IN (SELECT id FROM %s.projects WHERE user_id = %s)"
        % (SCHEMA, active, int(webhook_id), SCHEMA, int(user_id))
    )
    conn.commit(); cur.close(); conn.close()
    return resp(200, {'success': True})


# ── NOTIFICATIONS ─────────────────────────────────────────────────────────────

def handle_get_notifications(params):
    user_id = params.get('user_id', '')
    if not user_id:
        return resp(400, {'error': 'user_id обязателен'})
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        "SELECT id, project_id, type, message, read, created_at FROM %s.notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 20"
        % (SCHEMA, int(user_id))
    )
    rows = cur.fetchall(); cur.close(); conn.close()
    notifs = [{'id': r[0], 'project_id': r[1], 'type': r[2], 'message': r[3], 'read': r[4], 'created_at': r[5].isoformat()} for r in rows]
    return resp(200, {'notifications': notifs, 'unread': sum(1 for n in notifs if not n['read'])})


def handle_mark_read(body):
    user_id = body.get('user_id')
    if not user_id:
        return resp(400, {'error': 'user_id обязателен'})
    conn = get_conn(); cur = conn.cursor()
    cur.execute("UPDATE %s.notifications SET read = TRUE WHERE user_id = %s" % (SCHEMA, int(user_id)))
    conn.commit(); cur.close(); conn.close()
    return resp(200, {'success': True})


# ── EMAIL ─────────────────────────────────────────────────────────────────────

def send_email(to_email: str, subject: str, html: str):
    smtp_host = os.environ.get('SMTP_HOST', '')
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_pass = os.environ.get('SMTP_PASSWORD', '')
    if not smtp_host or not smtp_user or not smtp_pass:
        return False
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = f'CLODEV <{smtp_user}>'
    msg['To'] = to_email
    msg.attach(MIMEText(html, 'html'))
    try:
        with smtplib.SMTP_SSL(smtp_host, 465) as server:
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, to_email, msg.as_string())
        return True
    except Exception:
        return False


def fire_webhooks(project_id: int, event: str, payload: dict):
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        "SELECT url FROM %s.webhooks WHERE project_id = %s AND active = TRUE AND events LIKE '%%%s%%'"
        % (SCHEMA, project_id, event)
    )
    rows = cur.fetchall(); cur.close(); conn.close()
    body = json.dumps({'event': event, 'payload': payload}, ensure_ascii=False).encode()
    for row in rows:
        try:
            req = urllib.request.Request(row[0], data=body, headers={'Content-Type': 'application/json'}, method='POST')
            urllib.request.urlopen(req, timeout=5)
        except Exception:
            pass


# ── ADMIN ─────────────────────────────────────────────────────────────────────

def handle_admin_login(body):
    password = (body.get('password') or '').strip()
    admin_password = os.environ.get('ADMIN_PASSWORD', '')
    if not admin_password or password != admin_password:
        return resp(401, {'error': 'Неверный пароль'})
    return resp(200, {'success': True})


def handle_get_content():
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT key, value, label FROM %s.site_content ORDER BY key" % SCHEMA)
    rows = cur.fetchall(); cur.close(); conn.close()
    return resp(200, {'content': {r[0]: {'value': r[1], 'label': r[2]} for r in rows}})


def handle_save_content(body):
    password = (body.get('password') or '').strip()
    if not os.environ.get('ADMIN_PASSWORD') or password != os.environ['ADMIN_PASSWORD']:
        return resp(401, {'error': 'Нет доступа'})
    updates = body.get('updates', {})
    if not updates:
        return resp(400, {'error': 'Нет данных'})
    conn = get_conn(); cur = conn.cursor()
    for key, value in updates.items():
        cur.execute(
            "UPDATE %s.site_content SET value = '%s', updated_at = NOW() WHERE key = '%s'"
            % (SCHEMA, str(value).replace("'", "''"), key.replace("'", ""))
        )
    conn.commit(); cur.close(); conn.close()
    return resp(200, {'success': True})


def handle_get_billing(body):
    password = (body.get('password') or '').strip()
    if not os.environ.get('ADMIN_PASSWORD') or password != os.environ['ADMIN_PASSWORD']:
        return resp(401, {'error': 'Нет доступа'})
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT id, email, plan, created_at FROM %s.users ORDER BY created_at DESC" % SCHEMA)
    rows = cur.fetchall(); cur.close(); conn.close()
    users = [{'id': r[0], 'email': r[1], 'plan': r[2], 'created_at': r[3].isoformat()} for r in rows]
    pro_count = sum(1 for u in users if u['plan'] == 'pro')
    return resp(200, {'users': users, 'stats': {'total': len(users), 'pro': pro_count, 'free': len(users) - pro_count, 'revenue': pro_count * 500}})


# ── ROUTER ────────────────────────────────────────────────────────────────────

def handler(event: dict, context) -> dict:
    """Универсальный API платформы clodev.ru: auth, проекты, деплои, контент, биллинг"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        }, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    if method == 'GET':
        if action == 'content':         return handle_get_content()
        if action == 'projects':        return handle_get_projects(params)
        if action == 'project':         return handle_get_project(params)
        if action == 'analytics':       return handle_get_analytics(params)
        if action == 'team':            return handle_get_team(params)
        if action == 'webhooks':        return handle_get_webhooks(params)
        if action == 'notifications':   return handle_get_notifications(params)
        return resp(400, {'error': 'Неизвестный action'})

    body = json.loads(event.get('body') or '{}')
    action = action or body.get('action', '')

    routes = {
        'register':        handle_register,
        'login':           handle_login,
        'admin_login':     handle_admin_login,
        'save_content':    handle_save_content,
        'billing':         handle_get_billing,
        'create_project':  handle_create_project,
        'deploy':          handle_deploy,
        'delete_project':  handle_delete_project,
        'update_env':      handle_update_env,
        'add_domain':      handle_add_domain,
        'invite_member':   handle_invite_member,
        'remove_member':   handle_remove_member,
        'add_webhook':     handle_add_webhook,
        'toggle_webhook':  handle_toggle_webhook,
        'mark_read':       handle_mark_read,
    }

    if action in routes:
        return routes[action](body)
    return resp(400, {'error': 'Неизвестный action'})