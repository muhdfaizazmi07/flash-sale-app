import { useEffect, useState } from "react";

export function useReservationTimer(expiresAt, onExpire) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!expiresAt) {
      return;
    }

    const updateTimer = () => {
      const diff = expiresAt - Date.now();

      if (diff <= 0) {
        setTimeLeft(0);
        onExpire?.();
        return;
      }

      setTimeLeft(diff);
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(timeLeft / 1000 / 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
