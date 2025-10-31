import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
});
app.use("/api/", limiter);

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Lockit Server running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
