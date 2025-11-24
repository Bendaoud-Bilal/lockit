import { useState, useEffect, useCallback } from "react";
import { Copy, RefreshCw, Check } from "lucide-react";

// Available character sets for password generation
const CHARACTER_SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+[]{}|;:,.<>?",
  similar: "O0oIl1",
};

// Default generation options configuration
const DEFAULT_OPTIONS = {
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeSimilar: false,
};

// Password length constraints
const PASSWORD_LENGTH = {
  MIN: 4,
  MAX: 32,
  DEFAULT: 12,
};

// Password strength levels
const STRENGTH_LEVELS = {
  WEAK: { label: "Weak", color: "text-red-500", threshold: 2 },
  MEDIUM: { label: "Medium", color: "text-yellow-500", threshold: 4 },
  STRONG: { label: "Strong", color: "text-green-500", threshold: 6 },
  VERY_STRONG: { label: "Very Strong", color: "text-emerald-600", threshold: 7 },
};

// Calculates password strength
const calculatePasswordStrength = (options, length) => {
  let score = 0;
  if (options.uppercase) score += 1;
  if (options.lowercase) score += 1;
  if (options.numbers) score += 1;
  if (options.symbols) score += 1;
  if (length >= 8) score += 1;
  if (length >= 12) score += 2;
  if (length >= 16) score += 3;
  if (score >= 6 && length >= 12) score += 1;
  score = Math.min(score, 7);

  if (score <= STRENGTH_LEVELS.WEAK.threshold) return STRENGTH_LEVELS.WEAK;
  if (score <= STRENGTH_LEVELS.MEDIUM.threshold) return STRENGTH_LEVELS.MEDIUM;
  if (score <= STRENGTH_LEVELS.STRONG.threshold) return STRENGTH_LEVELS.STRONG;
  return STRENGTH_LEVELS.VERY_STRONG;
};

// --- Secure random index generation using crypto.getRandomValues ---
const getSecureRandomInt = (max) => {
  if (max <= 0) throw new Error("max must be > 0");
  const array = new Uint32Array(1);
  const limit = Math.floor(0xffffffff / max) * max; // remove bias
  let randomValue;
  do {
    window.crypto.getRandomValues(array);
    randomValue = array[0];
  } while (randomValue >= limit);
  return randomValue % max;
};

// --- Secure password generation ---
const generateRandomPassword = (length, options) => {
  let availableChars = "";

  if (options.uppercase) availableChars += CHARACTER_SETS.uppercase;
  if (options.lowercase) availableChars += CHARACTER_SETS.lowercase;
  if (options.numbers) availableChars += CHARACTER_SETS.numbers;
  if (options.symbols) availableChars += CHARACTER_SETS.symbols;

  if (options.excludeSimilar) {
    availableChars = availableChars
      .split("")
      .filter((c) => !CHARACTER_SETS.similar.includes(c))
      .join("");
  }

  if (!availableChars) return "";

  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = getSecureRandomInt(availableChars.length);
    password += availableChars.charAt(randomIndex);
  }

  return password;
};

// Helper functions
const countActiveCharacterOptions = (options) =>
  Object.entries(options).filter(([k, v]) => k !== "excludeSimilar" && v).length;

const formatOptionLabel = (key) =>
  key === "excludeSimilar"
    ? "Exclude similar characters"
    : key.charAt(0).toUpperCase() + key.slice(1);

// --- React component ---
export default function PasswordGenerator() {
  const [length, setLength] = useState(PASSWORD_LENGTH.DEFAULT);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [strengthInfo, setStrengthInfo] = useState(STRENGTH_LEVELS.MEDIUM);
  const [options, setOptions] = useState(DEFAULT_OPTIONS);

  const generatePassword = useCallback(() => {
    const newPassword = generateRandomPassword(length, options);
    setPassword(newPassword);
    setStrengthInfo(calculatePasswordStrength(options, length));
  }, [length, options]);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch (error) {
      console.error("Failed to copy password:", error);
    }
  };

  const handleOptionChange = (key) => {
    const activeCount = countActiveCharacterOptions(options);
    if (activeCount === 1 && options[key] && key !== "excludeSimilar") return;
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLengthChange = (e) => setLength(Number(e.target.value));

  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl w-full max-w-md mx-auto space-y-5 shadow-lg">
      {/* Password display */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          type="text"
          value={password}
          readOnly
          className="flex-1 bg-gray-100 px-3 py-2 rounded-lg text-sm outline-none text-gray-800"
          aria-label="Generated password"
        />
        <div className="flex gap-2 sm:justify-end">
          <button
            onClick={handleCopyToClipboard}
            className="flex items-center justify-center bg-white border p-2 rounded-lg hover:bg-gray-100 transition"
            title="Copy to clipboard"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
          <button
            onClick={generatePassword}
            className="flex items-center justify-center bg-black border p-2 rounded-lg hover:bg-gray-900 transition"
            title="Generate new password"
          >
            <RefreshCw size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* Strength indicator */}
      <div className="flex items-center text-sm text-gray-700">
        <span>Strength:&nbsp;</span>
        <span className={`${strengthInfo.color} font-medium`}>
          {strengthInfo.label}
        </span>
      </div>

      {/* Length slider */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          Length: <span className="font-semibold text-black">{length}</span>
        </label>
        <input
          type="range"
          min={PASSWORD_LENGTH.MIN}
          max={PASSWORD_LENGTH.MAX}
          value={length}
          onChange={handleLengthChange}
          className="w-full accent-black mt-2"
        />
      </div>

      {/* Generation options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        {Object.keys(options).map((key) => (
          <label key={key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={options[key]}
              onChange={() => handleOptionChange(key)}
              className="accent-black"
            />
            <span>{formatOptionLabel(key)}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
