import { useEffect, useState } from 'react';

export default function CountUp({ value, duration = 1500, decimals = 0, delay = 0 }) {
  const target = Number(value) || 0;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let timeoutId;
    let animationFrameId;

    const startAnimation = () => {
      let startTime = null;

      const step = (timestamp) => {
        if (!isMounted) return;
        if (!startTime) startTime = timestamp;
        
        const progress = timestamp - startTime;
        const t = Math.min(progress / duration, 1);
        
        // Cubic ease-out curve (fast acceleration -> deceleration to stop)
        const ease = 1 - Math.pow(1 - t, 3);
        
        setCurrent(ease * target);

        if (t < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setCurrent(target);
        }
      };

      animationFrameId = requestAnimationFrame(step);
    };

    if (delay > 0) {
      timeoutId = setTimeout(startAnimation, delay);
    } else {
      startAnimation();
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrameId);
    };
  }, [target, duration, delay]);

  const formatted = current.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return <span>{formatted}</span>;
}
