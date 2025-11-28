import dotenv from "dotenv";
import app from "./app.js";
import prisma from "./prisma/client.js";
import { startBreachScheduler } from "./scheduler/breachScheduler.js";
import net from "net";

dotenv.config();

const HOST = process.env.HOST || "localhost";
const MIN_PORT = 3000;
const MAX_PORT = 3100;

let server;
let schedulerJob;
let isShuttingDown = false;

/**
 * Check if a port is available
 */
function isPortAvailable(port, host) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          resolve(false);
        }
      })
      .once('listening', () => {
        tester.once('close', () => resolve(true)).close();
      })
      .listen(port, host);
  });
}

/**
 * Find an available port in the range
 */
async function findAvailablePort(startPort, endPort, host) {
  for (let port = startPort; port <= endPort; port++) {
    if (await isPortAvailable(port, host)) {
      return port;
    }
  }
  throw new Error(`No available ports found between ${startPort} and ${endPort}`);
}

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
    console.log("Database connected");

    // Find an available port
    const preferredPort = Number.parseInt(process.env.PORT ?? "3000", 10);
    let PORT;
    
    if (await isPortAvailable(preferredPort, HOST)) {
      PORT = preferredPort;
      console.log(`Using preferred port ${PORT}`);
    } else {
      console.log(`Port ${preferredPort} is occupied, searching for available port...`);
      PORT = await findAvailablePort(MIN_PORT, MAX_PORT, HOST);
      console.log(`Found available port: ${PORT}`);
    }

    server = app.listen(PORT, HOST, () => {
      console.log(`Lockit server running on http://${HOST}:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`Client URL: ${process.env.CLIENT_URL || "http://localhost:5173"}`);
      
      // Send port info to parent process (Electron main process)
      if (process.send) {
        process.send({ 
          type: 'SERVER_READY', 
          port: PORT,
          host: HOST,
          url: `http://${HOST}:${PORT}`
        });
      }
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('[lockit] Server error:', error);
      shutdown('server-error', error);
    });

    if (process.env.ENABLE_BREACH_SCHEDULER !== "false") {
      schedulerJob = startBreachScheduler();
    }
  } catch (error) {
    console.error("Failed to start server:", error);
    
    // Notify parent process of failure
    if (process.send) {
      process.send({ 
        type: 'SERVER_ERROR', 
        error: error.message 
      });
    }
    
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