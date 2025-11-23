import prisma from '../prisma/client.js';
import { findBreachesForCredentials } from './hibpService.js';

/**
 * Syncs breach alerts for a single user against the external breach service.
 * - Loads the user profile and active credentials before querying Have I Been Pwned.
 * - Inserts only the newly detected breaches and returns summary statistics.
 */
export async function checkUserBreaches(userId) {
  try {
    console.log(`🔍 Checking breaches for user ${userId}...`);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const credentials = await prisma.credential.findMany({
      where: {
        userId,
        state: 'active',
      },
      select: {
        id: true,
        userId: true,
        title: true,
        dataEnc: true,
        dataIv: true,
        dataAuthTag: true,
      },
    });

    console.log(`📝 Found ${credentials.length} credentials to check`);

    const potentialBreaches = await findBreachesForCredentials(credentials, user.email || user.username);

    console.log(`⚠️ Found ${potentialBreaches.length} potential breaches`);

    const existingBreaches = await prisma.breachAlert.findMany({
      where: {
        userId,
        breachSource: {
          in: potentialBreaches.map(b => b.breachSource),
        },
      },
      select: {
        breachSource: true,
        affectedEmail: true,
      },
    });

    const existingBreachKeys = new Set(
      existingBreaches.map(b => `${b.breachSource}-${b.affectedEmail}`)
    );

    const newBreaches = potentialBreaches.filter(
      breach => !existingBreachKeys.has(`${breach.breachSource}-${breach.affectedEmail}`)
    );

    console.log(`✅ ${newBreaches.length} new breaches to add`);

    if (newBreaches.length > 0) {
      await prisma.breachAlert.createMany({
        data: newBreaches,
      });
    }

    return {
      newBreaches: newBreaches.length,
      totalBreaches: potentialBreaches.length,
      userId,
    };
  } catch (error) {
    console.error(`❌ Error checking breaches for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Iterates over every user to refresh breach alerts, respecting rate limits.
 * - Sequentially invokes the single-user sync and pauses between requests.
 * - Collects per-user outcomes for monitoring or scheduled jobs.
 */
export async function checkAllUsersBreaches() {
  try {
    console.log('🌐 Starting breach check for all users...');

    const users = await prisma.user.findMany({
      select: { id: true },
    });

    console.log(`👥 Found ${users.length} users to check`);

    const results = [];

    for (const user of users) {
      try {
        const result = await checkUserBreaches(user.id);
        results.push(result);

        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to check breaches for user ${user.id}:`, error.message);
        results.push({
          userId: user.id,
          error: error.message,
          newBreaches: 0,
          totalBreaches: 0,
        });
      }
    }

    const totalNew = results.reduce((sum, r) => sum + (r.newBreaches || 0), 0);
    console.log(`✅ Breach check complete. Found ${totalNew} new breaches across all users.`);

    return results;
  } catch (error) {
    console.error('❌ Error in checkAllUsersBreaches:', error);
    throw error;
  }
}

/**
 * Updates a breach alert status once the caller passes ownership checks.
 * - Validates the requested status value before persisting the change.
 * - Ensures the alert belongs to the requesting user.
 */
export async function updateBreachStatus(breachId, userId, newStatus) {
  const validStatuses = ['pending', 'resolved', 'dismissed'];

  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  const breach = await prisma.breachAlert.findUnique({
    where: { id: breachId },
  });

  if (!breach) {
    throw new Error('Breach alert not found');
  }

  if (breach.userId !== userId) {
    throw new Error('Unauthorized');
  }

  return prisma.breachAlert.update({
    where: { id: breachId },
    data: { status: newStatus },
  });
}

/**
 * Toggles a breach alert between pending and resolved states.
 * - Confirms record ownership before updating the status flag.
 * - Leaves dismissed alerts untouched so they require a different handler.
 */
export async function toggleBreachResolved(breachId, userId) {
  const breach = await prisma.breachAlert.findUnique({
    where: { id: breachId },
  });

  if (!breach) {
    throw new Error('Breach alert not found');
  }

  if (breach.userId !== userId) {
    throw new Error('Unauthorized');
  }

  const newStatus = breach.status === 'pending' ? 'resolved' : 'pending';

  return prisma.breachAlert.update({
    where: { id: breachId },
    data: { status: newStatus },
  });
}

/**
 * Switches an alert between dismissed and pending states.
 * - Validates ownership and flips the dismissal flag accordingly.
 */
export async function toggleBreachDismissed(breachId, userId) {
  const breach = await prisma.breachAlert.findUnique({
    where: { id: breachId },
  });

  if (!breach) {
    throw new Error('Breach alert not found');
  }

  if (breach.userId !== userId) {
    throw new Error('Unauthorized');
  }

  const newStatus = breach.status === 'dismissed' ? 'pending' : 'dismissed';

  return prisma.breachAlert.update({
    where: { id: breachId },
    data: { status: newStatus },
  });
}
