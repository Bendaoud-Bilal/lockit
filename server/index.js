import dotenv from "dotenv";
import app from "./app.js";

// Load environment variables
dotenv.config();

// Server configuration
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "localhost";

// Start server
app.listen(PORT, HOST, () => {
  console.log(`🚀 Lockit Server running on http://${HOST}:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL || "http://localhost:3000"}`);
});
