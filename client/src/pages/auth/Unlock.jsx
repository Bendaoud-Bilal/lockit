import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const Unlock = () => {
  const navigate = useNavigate();
  const { login, unlock, logout, isAuthenticated, isLocked, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    masterPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && !isLocked) {
      navigate("/my-vault");
    }
  }, [isAuthenticated, isLocked, navigate]);

  // CHECK: "quick unlock" or "full login"
  const isQuickUnlock = isLocked && user;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Quick unlock - only password needed
    if (isQuickUnlock) {
      if (!formData.masterPassword) {
        toast.error("Please enter your master password");
        return;
      }

      setLoading(true);

      try {
        const result = await unlock(formData.masterPassword);

        if (result.success) {
          toast.success("Vault unlocked!");
          navigate("/my-vault", { replace: true });
        } else {
          toast.error(result.error || "Invalid password");
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }
    // Full login
    else {
      if (!formData.usernameOrEmail || !formData.masterPassword) {
        toast.error("Please fill in all fields");
        return;
      }

      setLoading(true);

      try {
        const result = await login(
          formData.usernameOrEmail,
          formData.masterPassword
        );

        if (result.success) {
          toast.success("Vault unlocked successfully!");
          setTimeout(() => {
            navigate("/my-vault");
          }, 500);
        } else {
          toast.error(result.error || "Authentication failed");
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSwitchAccount = () => {
    logout("User switched account");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-gray-700" strokeWidth={2} />
          </div>
        </div>

        {/* QUICK UNLOCK*/}
        {isQuickUnlock ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Vault Locked
            </h1>
            <p className="text-sm text-gray-500 text-center mb-2">
              Locked for:{" "}
              <span className="font-semibold text-gray-700">
                {user.username}
              </span>
            </p>
            <button
              onClick={handleSwitchAccount}
              className="text-xs text-gray-500 hover:text-gray-700 text-center w-full mb-6 underline"
            >
              Not you? Switch account
            </button>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Master Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="masterPassword"
                    autoComplete="off"
                    value={formData.masterPassword}
                    onChange={handleChange}
                    placeholder="Enter your master password"
                    autoFocus
                    className="w-full h-12 px-4 pr-12 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6EF5] focus:border-transparent disabled:opacity-60"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full h-12 font-medium rounded-lg transition-all duration-150 flex items-center justify-center gap-2 ${
                  loading
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-[#5B6EF5] hover:bg-[#4A5FE5] text-white"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Unlocking...
                  </>
                ) : (
                  "Unlock Vault"
                )}
              </button>
            </form>
          </>
        ) : (
          /* FULL LOGIN */
          <>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Unlock Your Vault
            </h1>
            <button
              onClick={() => navigate("/signup")}
              className="text-sm text-gray-500 hover:text-gray-700 text-center w-full mb-8 underline"
            >
              Or Sign Up If You're A New User
            </button>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username Or Email
                </label>
                <input
                  type="text"
                  name="usernameOrEmail"
                  value={formData.usernameOrEmail}
                  onChange={handleChange}
                  placeholder="Enter your username or email"
                  className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6EF5] focus:border-transparent disabled:opacity-60"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Master Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="masterPassword"
                    autoComplete="off"
                    value={formData.masterPassword}
                    onChange={handleChange}
                    placeholder="Enter your master password"
                    className="w-full h-12 px-4 pr-12 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B6EF5] focus:border-transparent disabled:opacity-60"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => navigate("/reset-password")}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                    disabled={loading}
                  >
                    Forgot your master password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full h-12 font-medium rounded-lg transition-all duration-150 flex items-center justify-center gap-2 ${
                  loading
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-[#5B6EF5] hover:bg-[#4A5FE5] text-white"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Unlocking...
                  </>
                ) : (
                  "Unlock Vault"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Unlock;
