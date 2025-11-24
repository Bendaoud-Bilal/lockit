import dayjs from 'dayjs';
import prisma from './prisma.service.js';

export async function getPasswordCards(userId) {
  const uid = Number(userId);
  const baseWhere = { userId: uid, state: 'active', hasPassword: true };
  
  const [total, weak, reused, exposed] = await Promise.all([
    prisma.credential.count({ where: baseWhere }),
    prisma.credential.count({ where: { ...baseWhere, passwordStrength: { lte: 40 } } }),
    prisma.credential.count({ where: { ...baseWhere, passwordReused: true } }),
    prisma.credential.count({ where: { ...baseWhere, compromised: true } }),
  ]);

  const oldDate = dayjs().subtract(365, 'day').toDate();
  const old = await prisma.credential.count({ 
    where: { ...baseWhere, passwordLastChanged: { lt: oldDate } } 
  });

  const cards = [
    { 
      id: 'weak', 
      title: 'Weak Passwords', 
      color: 'red', 
      count: weak,
      badge: weak > 0 ? { text: 'Action needed', variant: 'action-needed' } : null
    },
    { 
      id: 'reused', 
      title: 'Reused Passwords', 
      color: 'yellow', 
      count: reused,
      badge: reused > 0 ? { text: 'Review', variant: 'review' } : null
    },
    { 
      id: 'exposed', 
      title: 'Exposed Passwords', 
      color: 'orange', 
      count: exposed,
      badge: exposed > 0 ? { text: 'Critical', variant: 'action-needed' } : null
    },
    { 
      id: 'old', 
      title: 'Old Passwords', 
      color: 'blue', 
      count: old,
      badge: old > 0 ? { text: 'Update', variant: 'update' } : null
    },
  ];

  return { total, cards };
}

export async function getCardDetails(userId, cardId) {
  const uid = Number(userId);
  const base = { userId: uid, state: 'active', hasPassword: true };
  const oneYearAgo = dayjs().subtract(365, 'day').toDate();
  
  let where;
  switch (cardId) {
    case 'weak': 
      where = { ...base, passwordStrength: { lte: 40 } }; 
      break;
    case 'reused': 
      where = { ...base, passwordReused: true }; 
      break;
    case 'exposed': 
      where = { ...base, compromised: true }; 
      break;
    case 'old': 
      where = { ...base, passwordLastChanged: { lt: oneYearAgo } }; 
      break;
    default: 
      where = { ...base };
  }

  const creds = await prisma.credential.findMany({
    where,
    select: {
      id: true,
      title: true,
      icon: true,
      favorite: true,
      category: true,
      passwordStrength: true,
      passwordReused: true,
      compromised: true,
      has2fa: true,
      passwordLastChanged: true,
      createdAt: true,
      updatedAt: true,
      dataEnc: true,
      dataIv: true,
      dataAuthTag: true,
      hasPassword: true,
      state: true,
      userId: true,
      folderId: true,
      folder: {
        select: {
          name: true,
        },
      },
      attachments: {
        select: {
          id: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });

  const bufferToBase64 = (value) => {
    if (!value) return value;
    if (typeof value === 'string') return value;
    if (Buffer.isBuffer(value)) return value.toString('base64');
    if (value?.type === 'Buffer' && Array.isArray(value.data)) {
      return Buffer.from(value.data).toString('base64');
    }
    return value;
  };

  return creds.map((credential) => ({
    ...credential,
    dataEnc: bufferToBase64(credential.dataEnc),
    dataIv: bufferToBase64(credential.dataIv),
    dataAuthTag: bufferToBase64(credential.dataAuthTag),
    attachments: credential.attachments ?? [],
  }));
}