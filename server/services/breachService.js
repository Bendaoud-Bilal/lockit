import prisma from './prisma.service.js';

/**
 * Retrieves breach alerts for a user and normalizes them for the dashboard.
 * - Loads recent alerts with minimal fields and applies presentation mapping.
 * - Formats dates and severity text for direct display consumption.
 */
export async function listBreachAlertsForUser(userId) {
  const uid = Number(userId);
  const alerts = await prisma.breachAlert.findMany({
    where: { userId: uid },
    select: {
      id: true,
      credentialId: true,
      affectedEmail: true,
      breachSource: true,
      breachDate: true,
      affectedData: true,
      severity: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });


  return alerts.map(alert => ({
    id: alert.id,
    service: alert.breachSource,
    status: alert.status,
    description: `${alert.affectedData || 'User data exposed'}`,
    date: alert.breachDate ? new Date(alert.breachDate).toLocaleDateString() : 'Unknown',
    affected: alert.affectedEmail,
    severity: alert.severity
  }));
}

/**
 * Finds a single breach alert with ownership information.
 * - Supports dashboard interactions that need the full alert payload.
 */
export async function getBreachAlert(id) {
  return prisma.breachAlert.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      userId: true,
      credentialId: true,
      affectedEmail: true,
      breachSource: true,
      breachDate: true,
      affectedData: true,
      severity: true,
      status: true,
      createdAt: true,
    },
  });
}