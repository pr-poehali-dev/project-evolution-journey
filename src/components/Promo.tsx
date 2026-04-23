import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";
import { useContent } from "@/hooks/useContent";

export default function Promo() {
  const container = useRef<HTMLDivElement>(null);
  const { t } = useContent();
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-10vh", "10vh"]);

  return (
    <div
      ref={container}
      className="relative flex items-center justify-center h-screen overflow-hidden"
      style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
    >
      <div className="fixed top-[-10vh] left-0 h-[120vh] w-full">
        <motion.div style={{ y }} className="relative w-full h-full">
          <img
            src="https://cdn.poehali.dev/projects/6132a639-1939-42b8-a058-da5b13cc7f8f/files/d33445b1-bf36-4f80-b1df-9f1f9ca7e3e6.jpg"
            alt="Abstract data streams"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </div>

      <div className="absolute inset-0 bg-black/60 z-[1]" />

      <h3 className="absolute top-12 left-6 text-blue-400 uppercase z-10 text-sm md:text-base lg:text-lg tracking-widest">
        Инфраструктура нового поколения
      </h3>

      <div className="absolute bottom-12 left-6 right-6 z-10 flex flex-col sm:flex-row justify-between items-end gap-8">
        <p className="text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl leading-tight font-bold">
          Забудьте про DevOps. Сосредоточьтесь на продукте — мы возьмём инфраструктуру на себя.
        </p>
        <div className="flex flex-col gap-4 shrink-0">
          <div className="text-white text-right">
            <div className="text-3xl font-bold">99.99%</div>
            <div className="text-sm text-neutral-400 uppercase tracking-wide">Uptime SLA</div>
          </div>
          <div className="text-white text-right">
            <div className="text-3xl font-bold">&lt;50мс</div>
            <div className="text-sm text-neutral-400 uppercase tracking-wide">Время отклика</div>
          </div>
          <div className="text-white text-right">
            <div className="text-3xl font-bold">180+</div>
            <div className="text-sm text-neutral-400 uppercase tracking-wide">Edge-регионов</div>
          </div>
        </div>
      </div>
    </div>
  );
}