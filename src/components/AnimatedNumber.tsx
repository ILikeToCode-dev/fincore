import { useEffect, useRef } from "react";
import { useMotionValue, useSpring } from "motion/react";

interface AnimatedNumberProps {
  value: number;
  format?: (val: number) => string;
  className?: string;
}

export function AnimatedNumber({ value, format = (v) => v.toString(), className }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(value);
  const springValue = useSpring(motionValue, {
    mass: 1,
    stiffness: 100,
    damping: 20,
  });

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = format(latest);
      }
    });
  }, [springValue, format]);

  return <span ref={ref} className={className}>{format(value)}</span>;
}
