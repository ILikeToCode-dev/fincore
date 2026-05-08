import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { ArrowRight, Terminal } from "lucide-react";
import { useEffect } from "react";
import { WarpGrid } from "./WarpGrid";

interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] relative overflow-hidden text-white font-ui selection:bg-purple-500/30">
      
      {/* Warping Dots Grid (includes its own backlight) */}
      <WarpGrid />

      {/* Aurora Video Background */}
      <div className="absolute inset-x-0 bottom-0 top-auto h-full w-full pointer-events-none z-0 overflow-hidden">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute bottom-0 left-0 w-full h-full object-cover opacity-60 mix-blend-screen"
          style={{ 
            objectPosition: 'center bottom', 
            maskImage: 'linear-gradient(to top, black 0%, transparent 100%)', 
            WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 100%)' 
          }}
        >
          <source src="/aura.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Header element to mimic the screenshot's 'Stitch' header */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20">
        <div className="flex items-center gap-2 font-data">
          <Terminal className="w-5 h-5 text-purple-400" />
          <span className="font-bold text-lg tracking-tight">Fin_Core</span>
          <span className="px-2 py-[2px] rounded-full border border-white/20 text-[10px] uppercase tracking-widest text-white/70">Terminal</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onStart} className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors backdrop-blur-md cursor-pointer">
            Dashboard
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-[1px]">
            <div className="w-full h-full rounded-full bg-black" />
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl w-full flex flex-col items-center text-center px-4">
        
        <motion.div
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-12"
        >
          <h1 className="text-4xl sm:text-5xl md:text-8xl font-medium tracking-tight leading-[1.1] mb-4 sm:mb-6 drop-shadow-2xl">
            Simulate money at <br />
            the speed of light
          </h1>
          <p className="text-sm sm:text-base md:text-xl text-white/60 font-light max-w-lg sm:max-w-2xl mx-auto tracking-wide">
            Transform financial assumptions into accurate projections for the purchasing power of your savings, instantly.
          </p>
        </motion.div>

        {/* Big CTA directly to Dashboard */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.3 }}
        >
          <button 
            onClick={onStart}
            className="group relative px-6 py-3 sm:px-8 sm:py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all overflow-hidden backdrop-blur-md cursor-pointer"
          >
            <span className="relative z-10 flex items-center gap-2 sm:gap-3 font-data text-sm sm:text-lg tracking-wider text-white">
              Initialize Dashboard <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </button>
        </motion.div>

      </div>
    </div>
  );
}
