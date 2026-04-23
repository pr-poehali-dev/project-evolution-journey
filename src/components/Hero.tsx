import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";
import { useContent } from "@/hooks/useContent";

export default function Hero() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0vh", "50vh"]);
  const { t } = useContent();

  return (
    <div
      ref={container}
      className="relative flex items-center justify-center h-screen overflow-hidden"
    >
      <motion.div
        style={{ y }}
        className="absolute inset-0 w-full h-full"
      >
        <img
          src="https://cdn.poehali.dev/projects/6132a639-1939-42b8-a058-da5b13cc7f8f/files/b8eb2b8f-8ecb-4ffc-a492-e6eb942779f2.jpg"
          alt="Deploy platform"
          className="w-full h-full object-cover"
        />
      </motion.div>

      <div className="absolute inset-0 bg-black/50 z-[1]" />
      <div className="relative z-10 text-center text-white px-6">
        <p className="uppercase tracking-widest text-blue-400 text-sm mb-4 font-medium">{t("hero_subtitle", "Платформа для развёртывания")}</p>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-tight">
          {t("hero_title", "ДЕПЛОЙ БЕЗ ГРАНИЦ")}
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90 mb-10">
          {t("hero_description", "Разворачивайте приложения за секунды. CI/CD, автоскейлинг, edge-сеть — всё готово к работе из коробки.")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#signup" className="bg-white text-black px-8 py-3 font-medium uppercase tracking-wide hover:bg-blue-400 hover:text-white transition-colors duration-300">
            Начать бесплатно
          </a>
          <a href="#features" className="border border-white text-white px-8 py-3 font-medium uppercase tracking-wide hover:bg-white hover:text-black transition-colors duration-300">
            Узнать больше
          </a>
        </div>
      </div>
    </div>
  );
}