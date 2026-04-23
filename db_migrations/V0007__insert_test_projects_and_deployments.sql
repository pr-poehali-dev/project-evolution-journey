-- Тестовые проекты для пользователя test@test (id=2)
INSERT INTO t_p30709305_project_evolution_jo.projects (user_id, name, repo_url, framework, domain, env_vars, created_at, updated_at) VALUES
(2, 'my-landing', 'https://github.com/testuser/my-landing', 'react', 'my-landing-abc.clodev.ru', '{"NODE_ENV":"production","VITE_API_URL":"https://api.my-landing.ru"}', NOW() - INTERVAL '30 days', NOW() - INTERVAL '2 days'),
(2, 'shop-frontend', 'https://github.com/testuser/shop-frontend', 'nextjs', 'shop-frontend-xyz.clodev.ru', '{"NODE_ENV":"production","NEXT_PUBLIC_API":"https://api.myshop.ru","NEXT_PUBLIC_GA":"G-XXXXXXX"}', NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 day'),
(2, 'admin-panel', 'https://github.com/testuser/admin-panel', 'vue', 'admin-panel-def.clodev.ru', '{"NODE_ENV":"production","VITE_API_BASE":"https://api.myshop.ru/admin"}', NOW() - INTERVAL '7 days', NOW() - INTERVAL '3 hours');

-- Деплои для my-landing (project id = currval после вставок)
WITH p AS (SELECT id FROM t_p30709305_project_evolution_jo.projects WHERE user_id = 2 AND name = 'my-landing')
INSERT INTO t_p30709305_project_evolution_jo.deployments (project_id, status, branch, commit_sha, commit_message, url, build_log, duration_seconds, created_at, finished_at)
SELECT p.id, status, branch, commit_sha, commit_message, url, build_log, duration_seconds, created_at, finished_at FROM p,
(VALUES
  ('ready',    'main', 'a1b2c3d', 'feat: обновил hero-секцию и добавил анимации',       'https://my-landing-abc.clodev.ru', E'> Installing dependencies\n> Running vite build\n✓ Built in 12.4s\n✓ Deployed successfully', 34, NOW() - INTERVAL '2 days',    NOW() - INTERVAL '2 days' + INTERVAL '34 seconds'),
  ('ready',    'main', 'e4f5g6h', 'fix: исправил мобильную верстку',                    'https://my-landing-abc.clodev.ru', E'> Installing dependencies\n> Running vite build\n✓ Built in 11.8s\n✓ Deployed successfully', 31, NOW() - INTERVAL '5 days',    NOW() - INTERVAL '5 days' + INTERVAL '31 seconds'),
  ('error',    'main', 'i7j8k9l', 'feat: добавил форму обратной связи',                 'https://my-landing-abc.clodev.ru', E'> Installing dependencies\n> Running vite build\n✗ Error: Cannot find module ''@/components/ContactForm''\n  at build step 3/5', 18, NOW() - INTERVAL '8 days',    NOW() - INTERVAL '8 days' + INTERVAL '18 seconds'),
  ('ready',    'main', 'm1n2o3p', 'chore: обновил зависимости',                         'https://my-landing-abc.clodev.ru', E'> Installing dependencies\n> Running vite build\n✓ Built in 13.1s\n✓ Deployed successfully', 38, NOW() - INTERVAL '12 days',   NOW() - INTERVAL '12 days' + INTERVAL '38 seconds'),
  ('ready',    'dev',  'q4r5s6t', 'feat: первый деплой',                                'https://my-landing-abc.clodev.ru', E'> Installing dependencies\n> Running vite build\n✓ Built in 14.2s\n✓ Deployed successfully', 42, NOW() - INTERVAL '30 days',   NOW() - INTERVAL '30 days' + INTERVAL '42 seconds')
) AS v(status, branch, commit_sha, commit_message, url, build_log, duration_seconds, created_at, finished_at);

-- Деплои для shop-frontend
WITH p AS (SELECT id FROM t_p30709305_project_evolution_jo.projects WHERE user_id = 2 AND name = 'shop-frontend')
INSERT INTO t_p30709305_project_evolution_jo.deployments (project_id, status, branch, commit_sha, commit_message, url, build_log, duration_seconds, created_at, finished_at)
SELECT p.id, status, branch, commit_sha, commit_message, url, build_log, duration_seconds, created_at, finished_at FROM p,
(VALUES
  ('ready',    'main', 'u7v8w9x', 'feat: добавил корзину и оформление заказа',          'https://shop-frontend-xyz.clodev.ru', E'> Installing dependencies\n> Running next build\n✓ Compiled successfully\n✓ Built in 58.3s\n✓ Deployed', 71, NOW() - INTERVAL '1 day',     NOW() - INTERVAL '1 day' + INTERVAL '71 seconds'),
  ('building', 'main', 'y1z2a3b', 'fix: фикс цен с учётом скидок',                     'https://shop-frontend-xyz.clodev.ru', E'> Installing dependencies\n> Running next build\n...', 0,  NOW() - INTERVAL '10 minutes', NULL),
  ('ready',    'main', 'c4d5e6f', 'feat: страница каталога с фильтрами',                'https://shop-frontend-xyz.clodev.ru', E'> Installing dependencies\n> Running next build\n✓ Compiled successfully\n✓ Built in 61.2s\n✓ Deployed', 74, NOW() - INTERVAL '4 days',    NOW() - INTERVAL '4 days' + INTERVAL '74 seconds'),
  ('error',    'main', 'g7h8i9j', 'feat: интеграция с платёжной системой',              'https://shop-frontend-xyz.clodev.ru', E'> Installing dependencies\n> Running next build\n✗ Type error: Property ''amount'' does not exist on type ''PaymentIntent''\n  src/lib/stripe.ts:42:18', 29, NOW() - INTERVAL '6 days',    NOW() - INTERVAL '6 days' + INTERVAL '29 seconds'),
  ('ready',    'main', 'k1l2m3n', 'init: начало проекта интернет-магазина',             'https://shop-frontend-xyz.clodev.ru', E'> Installing dependencies\n> Running next build\n✓ Compiled successfully\n✓ Built in 55.7s\n✓ Deployed', 68, NOW() - INTERVAL '15 days',   NOW() - INTERVAL '15 days' + INTERVAL '68 seconds')
) AS v(status, branch, commit_sha, commit_message, url, build_log, duration_seconds, created_at, finished_at);

-- Деплои для admin-panel
WITH p AS (SELECT id FROM t_p30709305_project_evolution_jo.projects WHERE user_id = 2 AND name = 'admin-panel')
INSERT INTO t_p30709305_project_evolution_jo.deployments (project_id, status, branch, commit_sha, commit_message, url, build_log, duration_seconds, created_at, finished_at)
SELECT p.id, status, branch, commit_sha, commit_message, url, build_log, duration_seconds, created_at, finished_at FROM p,
(VALUES
  ('ready',    'main', 'o4p5q6r', 'feat: дашборд с графиками продаж',                  'https://admin-panel-def.clodev.ru', E'> Installing dependencies\n> Running vite build\n✓ Built in 22.1s\n✓ Deployed successfully', 45, NOW() - INTERVAL '3 hours',   NOW() - INTERVAL '3 hours' + INTERVAL '45 seconds'),
  ('ready',    'main', 's7t8u9v', 'feat: управление товарами и категориями',            'https://admin-panel-def.clodev.ru', E'> Installing dependencies\n> Running vite build\n✓ Built in 19.8s\n✓ Deployed successfully', 41, NOW() - INTERVAL '2 days',    NOW() - INTERVAL '2 days' + INTERVAL '41 seconds'),
  ('ready',    'dev',  'w1x2y3z', 'init: создал проект на Vue 3 + Vite',               'https://admin-panel-def.clodev.ru', E'> Installing dependencies\n> Running vite build\n✓ Built in 18.3s\n✓ Deployed successfully', 39, NOW() - INTERVAL '7 days',    NOW() - INTERVAL '7 days' + INTERVAL '39 seconds')
) AS v(status, branch, commit_sha, commit_message, url, build_log, duration_seconds, created_at, finished_at);