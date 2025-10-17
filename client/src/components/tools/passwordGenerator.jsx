import { useState, useEffect } from "react";
import { Copy, RefreshCw,Check} from "lucide-react";

export default function PasswordGenerator() {
  const [length, setLength] = useState(8);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const[StrengthInfo,setStrengthInfo]=useState({label:"",color:""});


  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeSimilar: false,
  });

  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
  const numberChars = "0123456789";
  const symbolChars = "!@#$%^&*()_+[]{}|;:,.<>?";
  const similarChars = "O0oIl1";

const Getstrength = (password, options, length) => {
  let score = 0;

  if (options.uppercase) score += 1;
  if (options.lowercase) score += 1;
  if (options.numbers) score += 1;
  if (options.symbols) score += 1;

  if (length >= 8) score += 1;
  if (length >= 12) score += 2;
  if (length >= 16) score += 3;

  if (score >= 6 && length >= 12) score += 1;

  if (score > 7) score = 7;

  if (score <= 2) setStrengthInfo({ label: "Weak", color: "text-red-500" });
  else if (score <= 4) setStrengthInfo({ label: "Medium", color: "text-yellow-500" });
  else if (score <= 6) setStrengthInfo({ label: "Strong", color: "text-green-500" });
  else setStrengthInfo({ label: "Very Strong", color: "text-emerald-600" });
};


  const generatePassword = () => {
    let chars = "";
    if (options.uppercase) chars += uppercaseChars;
    if (options.lowercase) chars += lowercaseChars;
    if (options.numbers) chars += numberChars;
    if (options.symbols) chars += symbolChars;
    if (options.excludeSimilar)
      chars = chars
        .split("")
        .filter((c) => !similarChars.includes(c))
        .join("");

    if (chars==="" || chars=="O0oIl1"){
      
    }
    let pass = "";
    for (let i = 0; i < length; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    setPassword(pass);
    Getstrength(password,options,length);
  };

  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);

    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  useEffect(() => {
    generatePassword();
  }, [length, options]);

  return (
    <div className="bg-white p-6 rounded-2xl   h-full w-full  space-y-5">


      <h2 className="text-xl font-semibold text-center mb-3">
      </h2>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={password}
          readOnly
          className="flex-1 bg-gray-200 px-3 py-2 rounded-lg text-sm outline-none"
        />
        <button
          onClick={copyToClipboard}
          className="bg-white p-2  rounded-lg border hover:bg-gray-200 transition"
        >
          {copied ? <Check size={18}/> : <Copy size={18} />}
        </button>
        <button
          onClick={generatePassword}
          className="bg-white p-2 rounded-lg border hover:bg-gray-200 transition"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="text-sm black">
        Strength: {""}
        <span className={`${StrengthInfo.color} font-medium`}>
          {StrengthInfo.label}
        </span>
      </div>

      <div>
        <label className="text-sm">
          Length: <span className="text-black">{length}</span>
        </label>
        <input
          type="range"
          min="4"
          max="32"
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="w-full accent-black mt-1 "
        />
      </div>


      <div className="space-y-2 text-sm">
        {Object.keys(options).map((key) => (
          <label key={key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={options[key]}
              onChange={() =>{
                const checkedCount = Object.entries(options)
                .filter(([k, v]) => k !== "excludeSimilar" && v) 
                .length;

                if (checkedCount === 1 && options[key] && key !== "excludeSimilar") return;


                setOptions({ ...options, [key]: !options[key] })
              }
              }
              className="accent-black"
            />
            {key === "excludeSimilar"
              ? "Exclude similar characters"
              : key.charAt(0).toUpperCase() + key.slice(1)}
          </label>
        ))}
      </div>

    </div>
  );
}

