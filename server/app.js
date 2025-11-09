import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import vaultRoutes from "./routes/Vault.js";
import authenticatorRoutes from "./routes/authenticator.routes.js"
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 30 requests per windowMs
});

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Body parsing middleware

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Lockit Server is running",
    timestamp: new Date().toISOString() 
  });
});

// Apply rate limiting to all API routes
app.use("/api/", limiter);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vault", vaultRoutes);
app.use("/api/totp",authenticatorRoutes)
//  


// Error handling middleware
app.use(errorHandler);

// 404 handler (must be last)
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

export default app;
