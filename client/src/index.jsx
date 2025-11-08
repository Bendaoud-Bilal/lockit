import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import decryptAesGcmBrowser from "./utils/crypto.js";

if (import.meta.env.DEV && typeof window !== "undefined") {
  window.decryptAesGcmBrowser = decryptAesGcmBrowser;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
