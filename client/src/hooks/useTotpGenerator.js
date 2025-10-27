import { useEffect, useRef, useState } from "react";
import { generateTOTP } from "../utils/TotpGenerator";

/**
 * Custom hook for generating and refreshing TOTP codes every 30 seconds.
 * @param {string} secret - The base32 secret key for TOTP generation.
 * @returns {{ totp: string, timeLeft: number }}
 */
export const useTotpGenerator = (secret) => {
  const [totp, setTotp] = useState("------");
  const [timeLeft, setTimeLeft] = useState(30);
  const counterRef = useRef(null);

  const generateCode = () => {
    try {
      const newCode = generateTOTP(secret);
      setTotp(newCode);
    } catch (err) {
      console.error("Erreur lors de la génération du TOTP :", err);
      setTotp("------");
    }
  };

  useEffect(() => {
    if (!secret) {
      setTotp("------");
      return;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const currentCounter = Math.floor(nowSec / 30);
    counterRef.current = currentCounter;

    // Génération initiale du code
    generateCode();
    setTimeLeft(30 - (nowSec % 30));

    // Interval de mise à jour
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const counter = Math.floor(now / 30);
      const remaining = 30 - (now % 30);
      setTimeLeft(remaining);

      if (counter !== counterRef.current) {
        counterRef.current = counter;
        generateCode();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [secret]);

  return { totp, timeLeft };
};
