import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import decryptAesGcmBrowser from "./utils/crypto.js";

if (import.meta.env.DEV && typeof window !== "undefined") {
  window.decryptAesGcmBrowser = decryptAesGcmBrowser;
}


const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
       <App />
       </QueryClientProvider>
  </React.StrictMode>,
);
