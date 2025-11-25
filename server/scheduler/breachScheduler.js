// server/scheduler/breachScheduler.js
import schedule from 'node-schedule';
import { checkAllUsersBreaches } from '../services/breachDetectionService.js';

/**
 * Schedule daily breach checks at midnight
 */
export function startBreachScheduler() {
  // Run every day at 00:00 (midnight)
  const job = schedule.scheduleJob('0 0 * * *', async () => {
    console.log('⏰ Running scheduled breach check...');
    try {
      await checkAllUsersBreaches();
      console.log('✅ Scheduled breach check completed');
    } catch (error) {
      console.error('❌ Scheduled breach check failed:', error);
    }
  });
  
  console.log('📅 Breach scheduler started - will run daily at 00:00');
  return job;
}

/**
 * For testing: Run breach check immediately
 */
export async function runBreachCheckNow() {
  console.log('🚀 Running immediate breach check...');
  return checkAllUsersBreaches();
}