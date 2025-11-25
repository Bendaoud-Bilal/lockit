import dayjs from 'dayjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Calculates the composite security score and supporting metrics.
 * - Applies configurable weights to penalties for risky credential states.
 * - Aggregates Prisma counts in parallel to build the final response object.
 */
export async function computeSecurityScore(userId, opts = {}) {
  const {
    compromisedWeight = 40,
    reuseWeight = 20,
    missing2faWeight = 8,
    oldPasswordWeight = 5,
    weakThreshold = 40,
    oldDays = 365,
  } = opts;

  const oneYearAgo = dayjs().subtract(oldDays, 'day').toDate();
  const baseWhere = { userId: Number(userId), state: 'active', hasPassword: true };

  const total = await prisma.credential.count({ where: baseWhere });
  if (total === 0) {
    return {
      score: 100,
      pct: 100,
      statusText: 'Excellent',
      total: 0,
      weak: 0,
      reused: 0,
      exposed: 0,
      avgStrength: 100,
    };
  }

  const agg = await prisma.credential.aggregate({
    where: baseWhere,
    _avg: { passwordStrength: true },
  });
  const avgStrength = Number((agg._avg.passwordStrength ?? 100).toFixed(1));

  const [weak, reused, exposed, missing2fa, oldPasswords] = await Promise.all([
    prisma.credential.count({ where: { ...baseWhere, passwordStrength: { lte: weakThreshold } } }),
    prisma.credential.count({ where: { ...baseWhere, passwordReused: true } }),
    prisma.credential.count({ where: { ...baseWhere, compromised: true } }),
    prisma.credential.count({ where: { ...baseWhere, has2fa: false } }),
    prisma.credential.count({ where: { ...baseWhere, passwordLastChanged: { lt: oneYearAgo } } }),
  ]);

  const compromisedPenalty = (exposed / total) * compromisedWeight;
  const reusePenalty = (reused / total) * reuseWeight;
  const missing2faPenalty = (missing2fa / total) * missing2faWeight;
  const oldPenalty = (oldPasswords / total) * oldPasswordWeight;
  const totalPenalties = compromisedPenalty + reusePenalty + missing2faPenalty + oldPenalty;

  let score = avgStrength - totalPenalties;
  score = Math.max(0, Math.min(100, score));
  const pct = Math.round(score * 10) / 10;

  let statusText = 'Poor';
  if (score >= 85) statusText = 'Excellent';
  else if (score >= 70) statusText = 'Good';
  else if (score >= 50) statusText = 'Fair';

  return {
    score: Math.round(score),
    pct,
    statusText,
    total,
    weak,
    reused,
    exposed,
    avgStrength,
  };
}