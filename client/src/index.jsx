import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";



const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
       <App />
       </QueryClientProvider>
  </React.StrictMode>,
)
