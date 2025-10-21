import { useState, useEffect, useCallback } from "react";
import { Copy, RefreshCw, Check } from "lucide-react";

//Available character sets for password generation

const CHARACTER_SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+[]{}|;:,.<>?",
  similar: "O0oIl1",
};

 //Default generation options configuration

const DEFAULT_OPTIONS = {
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeSimilar: false,
};


 //Password length constraints
const PASSWORD_LENGTH = {
  MIN: 4,
  MAX: 32,
  DEFAULT: 8,
};


 //Password strength levels

const STRENGTH_LEVELS = {
  WEAK: { label: "Weak", color: "text-red-500", threshold: 2 },
  MEDIUM: { label: "Medium", color: "text-yellow-500", threshold: 4 },
  STRONG: { label: "Strong", color: "text-green-500", threshold: 6 },
  VERY_STRONG: { label: "Very Strong", color: "text-emerald-600", threshold: 7 },
};

 //Calculates password strength based on options and length
const calculatePasswordStrength = (options, length) => {
  let score = 0;

  // Points for character diversity
  if (options.uppercase) score += 1;
  if (options.lowercase) score += 1;
  if (options.numbers) score += 1;
  if (options.symbols) score += 1;

  // Points for length
  if (length >= 8) score += 1;
  if (length >= 12) score += 2;
  if (length >= 16) score += 3;

  // Bonus for strong combination
  if (score >= 6 && length >= 12) score += 1;

  // Cap maximum score
  score = Math.min(score, 7);

  // Determine strength level
  if (score <= STRENGTH_LEVELS.WEAK.threshold) {
    return STRENGTH_LEVELS.WEAK;
  } else if (score <= STRENGTH_LEVELS.MEDIUM.threshold) {
    return STRENGTH_LEVELS.MEDIUM;
  } else if (score <= STRENGTH_LEVELS.STRONG.threshold) {
    return STRENGTH_LEVELS.STRONG;
  }
  return STRENGTH_LEVELS.VERY_STRONG;
};


 //Generates a random password based on provided options

const generateRandomPassword = (length, options) => {
  let availableChars = "";

  // Build available character set
  if (options.uppercase) availableChars += CHARACTER_SETS.uppercase;
  if (options.lowercase) availableChars += CHARACTER_SETS.lowercase;
  if (options.numbers) availableChars += CHARACTER_SETS.numbers;
  if (options.symbols) availableChars += CHARACTER_SETS.symbols;

  // Exclude similar characters if requested
  if (options.excludeSimilar) {
    availableChars = availableChars
      .split("")
      .filter((char) => !CHARACTER_SETS.similar.includes(char))
      .join("");
  }

  // Check if characters are available
  if (!availableChars) {
    return "";
  }

  // Generate password
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * availableChars.length);
    password += availableChars.charAt(randomIndex);
  }

  return password;
};


 //counts the number of active character options (excludes excludeSimilar)
const countActiveCharacterOptions = (options) => {
  return Object.entries(options).filter(
    ([key, value]) => key !== "excludeSimilar" && value
  ).length;
};

 //Formats option labels for display
const formatOptionLabel = (key) => {
  if (key === "excludeSimilar") {
    return "Exclude similar characters";
  }
  return key.charAt(0).toUpperCase() + key.slice(1);
};


 //Main password generator component

export default function PasswordGenerator() {
  const [length, setLength] = useState(PASSWORD_LENGTH.DEFAULT);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [strengthInfo, setStrengthInfo] = useState(STRENGTH_LEVELS.MEDIUM);
  const [options, setOptions] = useState(DEFAULT_OPTIONS);


    //Generates a new password and updates strength indicator
   
  const generatePassword = useCallback(() => {
    const newPassword = generateRandomPassword(length, options);
    setPassword(newPassword);

    const strength = calculatePasswordStrength(options, length);
    setStrengthInfo(strength);
  }, [length, options]);

   //Copies password to clipboard

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch (error) {
      console.error("Failed to copy password:", error);
    }
  };

  
   //Handles generation option change
  const handleOptionChange = (key) => {
    const activeCount = countActiveCharacterOptions(options);

    // Prevent unchecking the last character option
    if (activeCount === 1 && options[key] && key !== "excludeSimilar") {
      return;
    }

    setOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  
   //Handles password length change
  
  const handleLengthChange = (event) => {
    setLength(Number(event.target.value));
  };

  /**
   * Generates a new password on component mount
   * and whenever options or length change
   */
  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl w-full max-w-md mx-auto space-y-5 shadow-lg">
      {/* Password display and actions */}
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
            aria-label="Copy password to clipboard"
            title="Copy to clipboard"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
          <button
            onClick={generatePassword}
            className="flex items-center justify-center bg-black border p-2 rounded-lg hover:bg-gray-900 transition"
            aria-label="Generate new password"
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
          aria-label="Password length slider"
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
              aria-label={formatOptionLabel(key)}
            />
            <span className="truncate">{formatOptionLabel(key)}</span>
          </label>
        ))}
      </div>
    </div>
  );
}