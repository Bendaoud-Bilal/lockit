import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import vaultRoutes from "./routes/Vault.js";

import folderRoute from "./routes/folderRoute.js";
import credentialsRouter from "./routes/credentials.js";
import legacyUsersRouter from "./routes/users.js";
import passwordCardsRouter from "./routes/passwordCards.js";
import securityRouter from "./routes/security.js";
import breachRouter from "./routes/breach.js";
import authenticatorRoutes from "./routes/authenticator.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import sendRoutes from "./routes/send.routes.js";

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number.parseInt(process.env.RATE_LIMIT_MAX ?? "300", 10),
});

app.use(helmet());

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL,
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175"
    ].filter(Boolean),
    credentials: true,
  })
);

const payloadLimit = process.env.PAYLOAD_LIMIT || "100mb";
app.use(express.json({ limit: payloadLimit }));
app.use(express.urlencoded({ limit: payloadLimit, extended: true }));

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Lockit Server is running",
    timestamp: new Date().toISOString(),
  });
});



app.use("/api", limiter);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vault", vaultRoutes);
app.use("/api/totp", authenticatorRoutes);
//  
app.use("/api/folder", folderRoute);
app.use("/api/send", sendRoutes);

app.use("/api/credentials", credentialsRouter);
app.use("/api/users", legacyUsersRouter);
app.use("/api", passwordCardsRouter);
app.use("/api", securityRouter);
app.use("/api", breachRouter);

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

export default app;
