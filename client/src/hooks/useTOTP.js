import { useEffect, useState, useRef } from "react";
import { generateTOTP } from "../utils/TotpGenerator";
export function useTOTP(secret) {
  const [totp, setTotp] = useState("------");
  const [timeLeft, setTimeLeft] = useState(30);
  const counterRef = useRef(null);

  // totp code generation
  const generateCode = () => {
    try {
      const newCode = generateTOTP(secret);
      setTotp(newCode);
    } catch (err) {
      console.error("Erreur TOTP:", err);
      setTotp("------");
    }
  };

  useEffect(() => {
    if (!secret) return;

    const nowSec = Math.floor(Date.now() / 1000);
    const currentCounter = Math.floor(nowSec / 30);
    counterRef.current = currentCounter;
    generateCode();
    setTimeLeft(30 - (nowSec % 30));

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
}
