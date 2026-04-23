interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  return (
    <header className={`absolute top-0 left-0 right-0 z-10 p-6 ${className ?? ""}`}>
      <div className="flex justify-between items-center">
        <div className="text-white text-lg font-bold tracking-tight">CLO<span className="text-blue-400">DEV</span></div>
        <nav className="flex gap-8 items-center">
          <a
            href="#features"
            className="text-white hover:text-blue-400 transition-colors duration-300 uppercase text-sm"
          >
            Возможности
          </a>
          <a
            href="#pricing"
            className="text-white hover:text-blue-400 transition-colors duration-300 uppercase text-sm"
          >
            Тарифы
          </a>
          <a
            href="#docs"
            className="text-white hover:text-blue-400 transition-colors duration-300 uppercase text-sm"
          >
            Документация
          </a>
          <a
            href="#signup"
            className="bg-white text-black px-4 py-2 text-sm uppercase tracking-wide font-medium hover:bg-blue-400 hover:text-white transition-colors duration-300"
          >
            Начать бесплатно
          </a>
        </nav>
      </div>
    </header>
  );
}