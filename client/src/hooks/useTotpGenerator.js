import { useEffect, useRef, useState } from "react";
import { generateTOTP } from "../utils/TotpGenerator";

/**
 * Génère et synchronise un code TOTP toutes les 30 secondes, parfaitement calé sur le temps global.
 * @param {string} secret - Secret base32
 * @returns {{ totp: string, timeLeft: number }}
 */
export const useTotpGenerator = (secret) => {
  const [totp, setTotp] = useState("--- ---");
  const [timeLeft, setTimeLeft] = useState(30);
  const intervalRef = useRef(null);
  const syncTimeoutRef = useRef(null);

  useEffect(() => {
    if (!secret) {
      setTotp("--- ---");
      return;
    }

   
    const syncToGlobalClock = () => {
      const now = Date.now();
      const nowSec = Math.floor(now / 1000);
      const elapsed = nowSec % 30;
      const remaining = 30 - elapsed;


      setTotp(generateTOTP(secret));
      setTimeLeft(remaining);

      syncTimeoutRef.current = setTimeout(() => {
        setTotp(generateTOTP(secret));
        setTimeLeft(30);

        intervalRef.current = setInterval(() => {
          const drift = Date.now() % 1000; // millisecondes hors phase
          setTotp(generateTOTP(secret));
          setTimeLeft(30);


          if (drift > 5) {
            clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
              setTotp(generateTOTP(secret));
              setTimeLeft(30);
            }, 30000 - drift);
          }
        }, 30000);
      }, remaining * 1000);
    };
    const countdown = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      setTimeLeft(30 - (now % 30));
    }, 1000);

    syncToGlobalClock();

    return () => {
      clearTimeout(syncTimeoutRef.current);
      clearInterval(intervalRef.current);
      clearInterval(countdown);
    };
  }, [secret]);

  return { totp, timeLeft };
};
