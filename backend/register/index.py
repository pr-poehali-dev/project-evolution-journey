import json
import os
import hashlib
import psycopg2

SCHEMA = 't_p30709305_project_evolution_jo'


def resp(status, data):
    return {
        'statusCode': status,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps(data, ensure_ascii=False)
    }


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


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
    conn = get_conn()
    cur = conn.cursor()
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
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, plan FROM %s.users WHERE email = '%s' AND password_hash = '%s'"
        % (SCHEMA, email, password_hash)
    )
    row = cur.fetchone()
    cur.close(); conn.close()
    if not row:
        return resp(401, {'error': 'Неверный email или пароль'})
    return resp(200, {'success': True, 'user_id': row[0], 'plan': row[1], 'email': email})


def handle_admin_login(body):
    password = (body.get('password') or '').strip()
    admin_password = os.environ.get('ADMIN_PASSWORD', '')
    if not admin_password or password != admin_password:
        return resp(401, {'error': 'Неверный пароль'})
    return resp(200, {'success': True})


def handle_get_content():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT key, value, label FROM %s.site_content ORDER BY key" % SCHEMA)
    rows = cur.fetchall()
    cur.close(); conn.close()
    content = {row[0]: {'value': row[1], 'label': row[2]} for row in rows}
    return resp(200, {'content': content})


def handle_save_content(body):
    password = (body.get('password') or '').strip()
    admin_password = os.environ.get('ADMIN_PASSWORD', '')
    if not admin_password or password != admin_password:
        return resp(401, {'error': 'Нет доступа'})
    updates = body.get('updates', {})
    if not updates:
        return resp(400, {'error': 'Нет данных для сохранения'})
    conn = get_conn()
    cur = conn.cursor()
    for key, value in updates.items():
        safe_key = key.replace("'", "")
        safe_value = str(value).replace("'", "''")
        cur.execute(
            "UPDATE %s.site_content SET value = '%s', updated_at = NOW() WHERE key = '%s'"
            % (SCHEMA, safe_value, safe_key)
        )
    conn.commit(); cur.close(); conn.close()
    return resp(200, {'success': True})


def handle_get_billing(body):
    password = (body.get('password') or '').strip()
    admin_password = os.environ.get('ADMIN_PASSWORD', '')
    if not admin_password or password != admin_password:
        return resp(401, {'error': 'Нет доступа'})
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, email, plan, created_at FROM %s.users ORDER BY created_at DESC" % SCHEMA
    )
    rows = cur.fetchall()
    cur.close(); conn.close()
    users = [
        {'id': r[0], 'email': r[1], 'plan': r[2], 'created_at': r[3].isoformat()}
        for r in rows
    ]
    total = len(users)
    pro_count = sum(1 for u in users if u['plan'] == 'pro')
    return resp(200, {
        'users': users,
        'stats': {'total': total, 'pro': pro_count, 'free': total - pro_count, 'revenue': pro_count * 500}
    })


def handler(event: dict, context) -> dict:
    """Универсальный API: регистрация, вход, контент лендинга, биллинг — clodev.ru"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    if method == 'GET' and action == 'content':
        return handle_get_content()

    if method != 'POST':
        return resp(405, {'error': 'Method not allowed'})

    body = json.loads(event.get('body') or '{}')
    action = action or body.get('action', '')

    if action == 'register':
        return handle_register(body)
    elif action == 'login':
        return handle_login(body)
    elif action == 'admin_login':
        return handle_admin_login(body)
    elif action == 'save_content':
        return handle_save_content(body)
    elif action == 'billing':
        return handle_get_billing(body)
    else:
        return resp(400, {'error': 'Неизвестный action'})
