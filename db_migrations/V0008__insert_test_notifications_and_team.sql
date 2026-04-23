-- Уведомления для test@test (user_id=2)
INSERT INTO t_p30709305_project_evolution_jo.notifications (user_id, project_id, type, message, read, created_at) VALUES
(2, 3, 'deploy_success', 'Деплой shop-frontend успешно завершён — feat: добавил корзину и оформление заказа', false, NOW() - INTERVAL '1 day'),
(2, 3, 'deploy_error',   'Ошибка деплоя shop-frontend — Type error: Property ''amount'' does not exist on type ''PaymentIntent''', false, NOW() - INTERVAL '6 days'),
(2, 2, 'deploy_error',   'Ошибка деплоя my-landing — Cannot find module ''@/components/ContactForm''', false, NOW() - INTERVAL '8 days'),
(2, 2, 'deploy_success', 'Деплой my-landing успешно завершён — feat: обновил hero-секцию и добавил анимации', true,  NOW() - INTERVAL '2 days'),
(2, 4, 'deploy_success', 'Деплой admin-panel успешно завершён — feat: дашборд с графиками продаж', true,  NOW() - INTERVAL '3 hours'),
(2, 3, 'deploy_success', 'Деплой shop-frontend успешно завершён — feat: страница каталога с фильтрами', true,  NOW() - INTERVAL '4 days'),
(2, 2, 'deploy_success', 'Деплой my-landing успешно завершён — chore: обновил зависимости', true,  NOW() - INTERVAL '12 days');

-- Члены команды для test@test (owner_user_id=2)
INSERT INTO t_p30709305_project_evolution_jo.team_members (owner_user_id, member_email, role, status, created_at) VALUES
(2, 'anna.designer@gmail.com',  'viewer',  'active',  NOW() - INTERVAL '20 days'),
(2, 'dev.ivan@yandex.ru',       'editor',  'active',  NOW() - INTERVAL '14 days'),
(2, 'pm.olga@company.ru',       'viewer',  'pending', NOW() - INTERVAL '2 days');