import React, { useState, useEffect } from "react";

/**
 * OtpProgress Component
 * 
 * Displays a countdown progress bar representing the remaining time
 * before an OTP (One-Time Password) expires. It shows both the visual
 * progress and the remaining seconds beside it.
 *
 * @param {number} duration - Total countdown time in seconds (default: 30)
 */
const OtpProgress = ({ duration = 30 }) => {
  const [progress, setProgress] = useState(100);
  const [timeLeft, setTimeLeft] = useState(duration);

  // Color of the progress bar depending on remaining time
  const getProgressColor = (progress) => {
    if (progress > 70) return "bg-green-600";
    if (progress > 40) return "bg-yellow-500";
    if (progress > 20) return "bg-orange-500";
    return "bg-red-600";
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) return 100;
        return prev - 100 / duration;
      });

      setTimeLeft((prev) => {
        if (prev <= 1) return duration;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [duration]);

  return (
    <div className="flex items-center gap-2 w-full">
      {/* Progress Bar */}
      <div className="flex-1 bg-gray-200 rounded-full h-1 overflow-hidden">
        <div
          className={`h-1 rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={Math.floor(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="OTP expiration progress"
        />
      </div>

      {/* Countdown Text */}
      <span className="text-xs font-semibold text-gray-600 w-6 text-right">
        {Math.floor(timeLeft)}s
      </span>
    </div>
  );
};

export default OtpProgress;
