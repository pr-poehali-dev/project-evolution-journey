import { useState } from "react";

export default function Signup() {
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div id="signup" className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-24">
      <p className="uppercase tracking-widest text-blue-400 text-sm mb-4 font-medium">Регистрация</p>
      <h2 className="text-4xl md:text-6xl font-bold text-neutral-900 text-center mb-4 tracking-tight">
        Начните прямо сейчас
      </h2>
      <p className="text-neutral-500 text-lg text-center mb-12 max-w-xl">
        Создайте аккаунт и разверните первый проект за минуту.
      </p>

      {submitted ? (
        <div className="w-full max-w-md border border-blue-400 bg-blue-400/5 p-10 text-center">
          <div className="text-4xl mb-4">🚀</div>
          <h3 className="text-2xl font-bold text-neutral-900 mb-2">Вы в списке!</h3>
          <p className="text-neutral-500 text-sm">
            Мы отправим письмо на <span className="text-neutral-900 font-medium">{email}</span> как только платформа откроется.
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md flex flex-col gap-5"
        >
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPlan("free")}
              className={`flex-1 py-3 px-4 text-sm uppercase tracking-wide font-medium border transition-colors duration-300 ${
                plan === "free"
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-neutral-600 border-neutral-300 hover:border-neutral-900"
              }`}
            >
              Старт — бесплатно
            </button>
            <button
              type="button"
              onClick={() => setPlan("pro")}
              className={`flex-1 py-3 px-4 text-sm uppercase tracking-wide font-medium border transition-colors duration-300 ${
                plan === "pro"
                  ? "bg-blue-400 text-black border-blue-400"
                  : "bg-white text-neutral-600 border-neutral-300 hover:border-blue-400"
              }`}
            >
              Pro — 500 ₽/мес
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wide text-neutral-500">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="border border-neutral-300 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors duration-300"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wide text-neutral-500">Пароль</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 8 символов"
              minLength={8}
              className="border border-neutral-300 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors duration-300"
            />
          </div>

          <button
            type="submit"
            className="bg-neutral-900 text-white py-3 px-6 uppercase text-sm tracking-wide font-medium hover:bg-blue-400 transition-colors duration-300 mt-2"
          >
            {plan === "free" ? "Начать бесплатно" : "Подключить Pro"}
          </button>

          <p className="text-center text-xs text-neutral-400">
            Регистрируясь, вы соглашаетесь с{" "}
            <a href="#terms" className="underline hover:text-neutral-700 transition-colors">
              условиями использования
            </a>
          </p>
        </form>
      )}
    </div>
  );
}
