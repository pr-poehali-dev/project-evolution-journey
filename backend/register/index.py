import json
import os
import hashlib
import psycopg2


def resp(status, data):
    return {
        'statusCode': status,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps(data, ensure_ascii=False)
    }


def handler(event: dict, context) -> dict:
    """Регистрация нового пользователя на платформе clodev.ru"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    if event.get('httpMethod') != 'POST':
        return resp(405, {'error': 'Method not allowed'})

    body = json.loads(event.get('body') or '{}')
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

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    cur.execute(
        "SELECT id FROM t_p30709305_project_evolution_jo.users WHERE email = '%s'" % email
    )
    if cur.fetchone():
        cur.close()
        conn.close()
        return resp(409, {'error': 'Пользователь с таким email уже существует'})

    cur.execute(
        "INSERT INTO t_p30709305_project_evolution_jo.users (email, password_hash, plan) VALUES ('%s', '%s', '%s') RETURNING id" % (email, password_hash, plan)
    )
    user_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return resp(201, {'success': True, 'user_id': user_id, 'plan': plan})
