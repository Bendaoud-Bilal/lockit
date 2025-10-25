import React from "react";

/**
 * OtpProgress Component
 * 
 * Displays a countdown progress bar representing the remaining time
 * before an OTP (One-Time Password) expires.
 *
 * @param {number} duration - Total countdown time in seconds (default: 30)
 * @param {number} timeLeft - Current remaining time (synchronized from parent)
 */
const OtpProgress = ({ duration = 30, timeLeft }) => {
  // Calcul du pourcentage restant
  const progress = (timeLeft / duration) * 100;

  // Couleur dynamique selon le temps restant
  const getProgressColor = (p) => {
    if (p > 70) return "bg-green-600";
    if (p > 40) return "bg-yellow-500";
    if (p > 20) return "bg-orange-500";
    return "bg-red-600";
  };

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
