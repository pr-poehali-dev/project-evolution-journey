const plans = [
  {
    name: "Старт",
    price: "Бесплатно",
    period: "3 дня",
    description: "Попробуйте платформу без ограничений",
    features: [
      "Все функции платформы",
      "Мгновенный деплой",
      "Edge-сеть",
      "CI/CD из коробки",
      "Поддержка по email",
    ],
    cta: "Начать бесплатно",
    highlight: false,
  },
  {
    name: "Pro",
    price: "500 ₽",
    period: "в месяц",
    description: "Для серьёзных проектов и команд",
    features: [
      "Всё из тарифа Старт",
      "Неограниченные деплои",
      "Кастомные домены",
      "Автоскейлинг",
      "Приоритетная поддержка 24/7",
    ],
    cta: "Подключить Pro",
    highlight: true,
  },
];

export default function Pricing() {
  return (
    <div id="pricing" className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-6 py-24">
      <p className="uppercase tracking-widest text-blue-400 text-sm mb-4 font-medium">Тарифы</p>
      <h2 className="text-4xl md:text-6xl font-bold text-white text-center mb-4 tracking-tight">
        Просто и понятно
      </h2>
      <p className="text-neutral-400 text-lg text-center mb-16 max-w-xl">
        Начните бесплатно — без карты. Переходите на Pro, когда будете готовы.
      </p>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`flex-1 flex flex-col p-8 border transition-all duration-300 ${
              plan.highlight
                ? "border-blue-400 bg-blue-400/5"
                : "border-neutral-700 bg-neutral-900"
            }`}
          >
            {plan.highlight && (
              <span className="uppercase text-blue-400 text-xs tracking-widest font-semibold mb-4">
                Популярный выбор
              </span>
            )}
            <h3 className="text-white text-xl font-bold uppercase tracking-wide mb-2">
              {plan.name}
            </h3>
            <p className="text-neutral-400 text-sm mb-6">{plan.description}</p>

            <div className="mb-8">
              <span className="text-white text-5xl font-bold">{plan.price}</span>
              <span className="text-neutral-400 text-sm ml-2">{plan.period}</span>
            </div>

            <ul className="flex flex-col gap-3 mb-10 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-neutral-300 text-sm">
                  <span className="text-blue-400 mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <a
              href="#signup"
              className={`text-center py-3 px-6 uppercase text-sm tracking-wide font-medium transition-colors duration-300 ${
                plan.highlight
                  ? "bg-blue-400 text-black hover:bg-white"
                  : "bg-white text-black hover:bg-blue-400 hover:text-white"
              }`}
            >
              {plan.cta}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
