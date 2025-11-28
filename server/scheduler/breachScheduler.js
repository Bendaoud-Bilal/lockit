// server/scheduler/breachScheduler.js
import schedule from 'node-schedule';
import { checkAllUsersBreaches } from '../services/breachDetectionService.js';

/**
 * Schedule daily breach checks at midnight
 */
export function startBreachScheduler() {
  // Run every day at 00:00 (midnight)
  const job = schedule.scheduleJob('0 0 * * *', async () => {
    try {
      await checkAllUsersBreaches();
    } catch (error) {
      console.error('❌ Scheduled breach check failed:', error);
    }
  });
  return job;
}

/**
 * For testing: Run breach check immediately
 */
export async function runBreachCheckNow() {
  return checkAllUsersBreaches();
}