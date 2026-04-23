const features = [
  { icon: "⚡", title: "Мгновенный деплой", desc: "Push в Git — и ваш сайт уже в продакшне. Автоматическая сборка и публикация за секунды." },
  { icon: "🌐", title: "Edge-сеть", desc: "Глобальная CDN с точками присутствия по всему миру. Минимальная задержка для любого пользователя." },
  { icon: "🔄", title: "CI/CD из коробки", desc: "Превью-окружения для каждого PR, автоматические тесты и rollback одной кнопкой." },
  { icon: "📈", title: "Автоскейлинг", desc: "Платформа масштабируется под нагрузку автоматически. Платите только за то, что используете." },
];

export default function Featured() {
  return (
    <div id="features" className="flex flex-col lg:flex-row lg:justify-between lg:items-center min-h-screen px-6 py-12 lg:py-0 bg-white">
      <div className="flex-1 h-[400px] lg:h-[800px] mb-8 lg:mb-0 lg:order-2">
        <img
          src="https://cdn.poehali.dev/projects/6132a639-1939-42b8-a058-da5b13cc7f8f/files/c78f5652-369c-4b7f-a55c-ff8e6405c21d.jpg"
          alt="Deploy platform network"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 text-left lg:h-[800px] flex flex-col justify-center lg:mr-12 lg:order-1">
        <h3 className="uppercase mb-4 text-sm tracking-wide text-neutral-500">Возможности платформы</h3>
        <p className="text-2xl lg:text-4xl mb-10 text-neutral-900 leading-tight font-bold">
          Всё, что нужно для запуска — уже включено.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          {features.map((f) => (
            <div key={f.title} className="border border-neutral-200 p-4 hover:border-neutral-900 transition-colors duration-300">
              <div className="text-2xl mb-2">{f.icon}</div>
              <h4 className="font-semibold text-neutral-900 mb-1 text-sm uppercase tracking-wide">{f.title}</h4>
              <p className="text-neutral-600 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
        <a href="#signup" className="bg-black text-white border border-black px-6 py-3 text-sm transition-all duration-300 hover:bg-white hover:text-black cursor-pointer w-fit uppercase tracking-wide">
          Попробовать бесплатно
        </a>
      </div>
    </div>
  );
}