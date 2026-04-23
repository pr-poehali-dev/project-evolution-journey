CREATE TABLE t_p30709305_project_evolution_jo.site_content (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  label VARCHAR(200) NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO t_p30709305_project_evolution_jo.site_content (key, value, label) VALUES
  ('hero_title', 'ДЕПЛОЙ БЕЗ ГРАНИЦ', 'Hero — Заголовок'),
  ('hero_subtitle', 'Платформа для развёртывания', 'Hero — Подзаголовок'),
  ('hero_description', 'Разворачивайте приложения за секунды. CI/CD, автоскейлинг, edge-сеть — всё готово к работе из коробки.', 'Hero — Описание'),
  ('featured_title', 'Всё, что нужно для запуска — уже включено.', 'Преимущества — Заголовок'),
  ('featured_subtitle', 'Возможности платформы', 'Преимущества — Подзаголовок'),
  ('promo_title', 'Забудьте про DevOps. Сосредоточьтесь на продукте — мы возьмём инфраструктуру на себя.', 'Промо — Текст'),
  ('promo_label', 'Инфраструктура нового поколения', 'Промо — Лейбл'),
  ('pricing_title', 'Просто и понятно', 'Тарифы — Заголовок'),
  ('pricing_description', 'Начните бесплатно — без карты. Переходите на Pro, когда будете готовы.', 'Тарифы — Описание');