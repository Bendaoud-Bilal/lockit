import dotenv from "dotenv";
import app from "./app.js";
import prisma from "./prisma/client.js";
import { startBreachScheduler } from "./scheduler/breachScheduler.js";

dotenv.config();

const PORT = Number.parseInt(process.env.PORT ?? "4000", 10);
const HOST = process.env.HOST || "0.0.0.0";

let server;
let schedulerJob;
let isShuttingDown = false;

async function shutdown(reason, error) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  if (error) {
    console.error(`[lockit] Fatal error triggered by ${reason}:`, error);
  } else {
    console.log(`[lockit] Shutdown triggered by ${reason}`);
  }

  try {
    if (schedulerJob) {
      schedulerJob.cancel();
      schedulerJob = undefined;
    }

    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }

    await prisma.$disconnect();
    console.log("[lockit] Prisma disconnected");
    process.exit(error ? 1 : 0);
  } catch (shutdownError) {
    console.error("[lockit] Error during shutdown", shutdownError);
    process.exit(1);
  }
}

async function start() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    server = app.listen(PORT, HOST, () => {
      console.log(`🚀 Lockit server running on http://${HOST}:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`Client URL: ${process.env.CLIENT_URL || "http://localhost:5173"}`);
    });

    if (process.env.ENABLE_BREACH_SCHEDULER !== "false") {
      schedulerJob = startBreachScheduler();
    }
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    await prisma.$disconnect().catch((disconnectError) => {
      console.error("Failed to disconnect Prisma during startup failure:", disconnectError);
    });
    process.exit(1);
  }
}

start();

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
  shutdown("unhandledRejection", reason instanceof Error ? reason : undefined);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  shutdown("uncaughtException", error);
});


