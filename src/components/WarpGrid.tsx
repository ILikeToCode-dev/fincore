import { useEffect, useRef } from "react";

export function WarpGrid({ hideBacklight = false }: { hideBacklight?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dots: Array<{ x: number; y: number; originX: number; originY: number; vx: number; vy: number }> = [];

    let mouseX = -1000;
    let mouseY = -1000;

    const spacing = 25; // Grid spacing
    const radius = 220; // Hover warp radius
    const ease = 0.05;   // Spring back speed
    const friction = 0.85; // Velocity decay

    const initDots = () => {
      dots = [];
      const cols = Math.floor(width / spacing) + 2;
      const rows = Math.floor(height / spacing) + 2;
      
      const offsetX = (width - cols * spacing) / 2;
      const offsetY = (height - rows * spacing) / 2;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing + offsetX;
          const y = j * spacing + offsetY;
          dots.push({ x, y, originX: x, originY: y, vx: 0, vy: 0 });
        }
      }
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initDots();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (containerRef.current) {
        containerRef.current.style.setProperty('--mouse-x', `${mouseX}px`);
        containerRef.current.style.setProperty('--mouse-y', `${mouseY}px`);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      mouseX = touch.clientX;
      mouseY = touch.clientY;
      if (containerRef.current) {
        containerRef.current.style.setProperty('--mouse-x', `${mouseX}px`);
        containerRef.current.style.setProperty('--mouse-y', `${mouseY}px`);
      }
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    const handleTouchEnd = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseLeave);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);

    handleResize();

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      
      ctx.beginPath();

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        const dx = mouseX - dot.x;
        const dy = mouseY - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < radius) {
          const force = (radius - dist) / radius;
          const angle = Math.atan2(dy, dx);
          // Push away (warp)
          dot.vx -= Math.cos(angle) * force * 5;
          dot.vy -= Math.sin(angle) * force * 5;
        }

        // Spring back to origin
        dot.vx += (dot.originX - dot.x) * ease;
        dot.vy += (dot.originY - dot.y) * ease;

        dot.vx *= friction;
        dot.vy *= friction;

        dot.x += dot.vx;
        dot.y += dot.vy;

        // Draw dots
        ctx.globalAlpha = 0.5;
        ctx.fillRect(dot.x, dot.y, 1.5, 1.5);
      }
      
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseLeave);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
    >
      {/* Dynamic Backlight */}
      {!hideBacklight && (
        <div 
          className="absolute inset-0 z-0 transition-opacity duration-300 pointer-events-none"
          style={{
            background: 'radial-gradient(circle min(400px, 40vw) at var(--mouse-x, -100%) var(--mouse-y, -100%), var(--color-prim) 0%, transparent 100%)',
            opacity: 0.35,
            mixBlendMode: 'screen'
          }}
        />
      )}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 mix-blend-screen opacity-70"
      />
    </div>
  );
}
