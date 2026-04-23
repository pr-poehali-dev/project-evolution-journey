import json
import os
import hashlib
import psycopg2
import random
import string
from datetime import datetime

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
        "SELECT id, domain FROM %s.projects WHERE id = %s AND user_id = %s"
        % (SCHEMA, int(project_id), int(user_id))
    )
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return resp(404, {'error': 'Проект не найден'})
    domain = row[1] or ''
    sha = rand_sha()
    log = 'Cloning repository...\nInstalling dependencies...\nBuilding project...\nOptimizing assets...\nDeploying to edge...\nDone in 31s'
    cur.execute(
        "INSERT INTO %s.deployments (project_id, status, branch, commit_sha, commit_message, url, build_log, duration_seconds, finished_at) "
        "VALUES (%s, 'ready', '%s', '%s', '%s', 'https://%s', '%s', 31, NOW()) RETURNING id"
        % (SCHEMA, int(project_id), branch, sha, msg, domain, log)
    )
    dep_id = cur.fetchone()[0]
    cur.execute("UPDATE %s.projects SET updated_at = NOW() WHERE id = %s" % (SCHEMA, int(project_id)))
    conn.commit(); cur.close(); conn.close()
    return resp(201, {'success': True, 'deployment_id': dep_id, 'status': 'ready'})


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
        if action == 'content':
            return handle_get_content()
        if action == 'projects':
            return handle_get_projects(params)
        if action == 'project':
            return handle_get_project(params)
        return resp(400, {'error': 'Неизвестный action'})

    body = json.loads(event.get('body') or '{}')
    action = action or body.get('action', '')

    routes = {
        'register': handle_register,
        'login': handle_login,
        'admin_login': handle_admin_login,
        'save_content': handle_save_content,
        'billing': handle_get_billing,
        'create_project': handle_create_project,
        'deploy': handle_deploy,
        'delete_project': handle_delete_project,
        'update_env': handle_update_env,
        'add_domain': handle_add_domain,
    }

    if action in routes:
        return routes[action](body)
    return resp(400, {'error': 'Неизвестный action'})
