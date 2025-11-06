import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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