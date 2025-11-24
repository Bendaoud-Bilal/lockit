// server/services/breachDetectionService.js
import prisma from '../prisma/client.js';
import { findBreachesForCredentials, checkEmailBreaches, normalizeBreachData } from './hibpService.js';

/**
 * Check for new breaches for a specific user
 * @param {number} userId - User ID to check
 * @returns {Promise<Object>} - { newBreaches: number, totalBreaches: number }
 */
export async function checkUserBreaches(userId) {
  try {
    console.log(`🔍 Checking breaches for user ${userId}...`);
    
    // Get user data
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
    
    // Get all active credentials for this user
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
    
    // Find breaches based on credential titles
    const potentialBreaches = await findBreachesForCredentials(credentials, user.email || user.username);
    
    console.log(`⚠️ Found ${potentialBreaches.length} potential breaches`);
    
    // Filter out breaches that already exist in DB
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
    
    // Insert new breaches
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
 * Check breaches for all users
 * Used by scheduled task
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
        
        // Rate limiting: wait 2 seconds between users
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
 * Update breach status
 * @param {number} breachId - Breach alert ID
 * @param {number} userId - User ID (for security check)
 * @param {string} newStatus - 'pending', 'resolved', or 'dismissed'
 * 
 * ✅ STATUS LOGIC:
 * - 'pending' = Not viewed/handled (checkbox unchecked, not dismissed)
 * - 'resolved' = Marked as handled (checkbox checked)
 * - 'dismissed' = User dismissed the alert (can be undismissed)
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
 * Toggle breach resolved status (for checkbox)
 * If pending → resolved (checked)
 * If resolved → pending (unchecked)
 * @param {number} breachId - Breach alert ID
 * @param {number} userId - User ID (for security check)
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
  
  // Toggle: pending ↔ resolved
  // Note: dismissed stays dismissed (use toggleBreachDismissed for that)
  const newStatus = breach.status === 'pending' ? 'resolved' : 'pending';
  
  return prisma.breachAlert.update({
    where: { id: breachId },
    data: { status: newStatus },
  });
}

/**
 * Toggle breach dismissed status (for dismiss button)
 * If pending/resolved → dismissed
 * If dismissed → pending
 * @param {number} breachId - Breach alert ID
 * @param {number} userId - User ID (for security check)
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
  
  // Toggle: dismissed ↔ pending
  const newStatus = breach.status === 'dismissed' ? 'pending' : 'dismissed';
  
  return prisma.breachAlert.update({
    where: { id: breachId },
    data: { status: newStatus },
  });
}
// ```

// ---

// ## **Status State Machine Logic**
// ```
// ┌─────────┐  checkbox     ┌──────────┐
// │ pending │ ────────────> │ resolved │
// └─────────┘               └──────────┘
//      ^  │                      │  ^
//      │  │ dismiss button       │  │ checkbox
//      │  v                      v  │
//      │ ┌───────────┐           │
//      └─│ dismissed │───────────┘
//        └───────────┘
//          undismiss button