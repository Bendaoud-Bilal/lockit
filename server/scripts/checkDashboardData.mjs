import { getPasswordCards } from '../services/passwordCardsService.js';
import { computeSecurityScore } from '../services/securityScoreService.js';

async function run() {
  const cards = await getPasswordCards(1);
  const score = await computeSecurityScore(1);
}

run().catch((err) => {
  console.error('Failed to inspect dashboard data:', err);
  process.exit(1);
});
