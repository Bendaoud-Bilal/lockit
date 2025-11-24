import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// CREATE CREDENTIAL
// ============================================
export const addCredential = async (req, res) => {
  try {
    const { userId, folderId, category, title, icon, dataEnc, dataIv, dataAuthTag, hasPassword, passwordStrength, passwordReused, compromised } = req.body.encryptedCredential;

    console.log('Received credential data:', req.body);
    
    // Validate required fields
    if (!userId || !title || !dataEnc || !dataIv || !dataAuthTag) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, title, dataEnc, dataIv, dataAuthTag' 
      });
    }

    // Create credential
    const credential = await prisma.credential.create({
      data: {
        userId: parseInt(userId),
        folderId: folderId ? parseInt(folderId) : null,
        category: category || 'login',
        title,
        icon: icon || null,
        dataEnc,
        dataIv,
        dataAuthTag,
        hasPassword: hasPassword !== undefined ? hasPassword : true,
        passwordStrength: passwordStrength || null,
        passwordReused: passwordReused || false,
        compromised: compromised || false,
        passwordLastChanged: hasPassword ? new Date() : null,
      },
      include: {
        folder: true,
      }
    });

    res.status(201).json({ 
      message: 'Credential added successfully', 
      credential 
    });
  } catch (error) {
    console.error('Error adding credential:', error);
    res.status(500).json({ error: error.message, details: error.message });
  }
};

// ============================================
// GET ALL CREDENTIALS FOR USER
// ============================================
export const getCredentials = async (req, res) => {
  try {
    const { userId } = req.params;
    const { folderId, category, favorite, state } = req.query;

    const where = {
      userId: parseInt(userId),
      state: state || 'active',
    };

    if (folderId) where.folderId = parseInt(folderId);
    if (category) where.category = category;
    if (favorite !== undefined) where.favorite = favorite === 'true';

    const credentials = await prisma.credential.findMany({
      where,
      select: {
        // ✅ Tous les champs nécessaires pour decryptCredentialForClient
        id: true,
        userId: true, // ✅ Ajouté
        title: true,
        category: true,
        icon: true, // ✅ Ajouté
        // Données chiffrées
        dataEnc: true,
        dataIv: true,
        dataAuthTag: true,
        // Métadonnées
        folder: {
          select: {
            id: true,
            name: true
          }
        },
        folderId: true, // ✅ Ajouté
        hasPassword: true,
        passwordStrength: true, // ✅ Ajouté
        passwordReused: true, // ✅ Ajouté
        passwordLastChanged: true, // ✅ Ajouté
        favorite: true,
        has2fa: true,
        compromised: true, // ✅ Ajouté
        state: true, // ✅ Ajouté
        createdAt: true, // ✅ Ajouté
        updatedAt: true, // ✅ Ajouté
        attachments: {
          select: {
            id: true,
            filename: true,
            fileSize: true,
            mimeType: true,
          }
        }
      },
      orderBy: {
        updatedAt: 'desc',
      }
    });

    res.status(200).json({ credentials });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    res.status(500).json({ error: 'Failed to fetch credentials', details: error.message });
  }
};

export const getArchiveCredentials = async (req, res) => {
  try {
    const { userId } = req.params;
    const { folderId, category, favorite, state } = req.query;

    const where = {
      userId: parseInt(userId),
      state: state || 'deleted',
    };

    if (folderId) where.folderId = parseInt(folderId);
    if (category) where.category = category;
    if (favorite !== undefined) where.favorite = favorite === 'true';

    const credentials = await prisma.credential.findMany({
      where,
      select: {
        // ✅ Tous les champs nécessaires pour decryptCredentialForClient
        id: true,
        userId: true, // ✅ Ajouté
        title: true,
        category: true,
        icon: true, // ✅ Ajouté
        // Données chiffrées
        dataEnc: true,
        dataIv: true,
        dataAuthTag: true,
        // Métadonnées
        folder: {
          select: {
            id: true,
            name: true
          }
        },
        folderId: true, // ✅ Ajouté
        hasPassword: true,
        passwordStrength: true, // ✅ Ajouté
        passwordReused: true, // ✅ Ajouté
        passwordLastChanged: true, // ✅ Ajouté
        favorite: true,
        has2fa: true,
        compromised: true, // ✅ Ajouté
        state: true, // ✅ Ajouté
        createdAt: true, // ✅ Ajouté
        updatedAt: true, // ✅ Ajouté
        attachments: {
          select: {
            id: true,
            filename: true,
            fileSize: true,
            mimeType: true,
          }
        }
      },
      orderBy: {
        updatedAt: 'desc',
      }
    });

    res.status(200).json({ credentials });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    res.status(500).json({ error: 'Failed to fetch credentials', details: error.message });
  }
};

// ============================================
// GET SINGLE CREDENTIAL
// ============================================
export const getCredentialById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query; // For security check

    const credential = await prisma.credential.findFirst({
      where: {
        id: parseInt(id),
        userId: parseInt(userId),
        state: 'active',
      },
      include: {
        folder: true,
        totpSecrets: true,
        attachments: true,
        breachAlerts: {
          where: {
            status: 'pending',
          }
        }
      }
    });

    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    res.status(200).json({ credential });
  } catch (error) {
    console.error('Error fetching credential:', error);
    res.status(500).json({ error: 'Failed to fetch credential', details: error.message });
  }
};

// ============================================
// UPDATE CREDENTIAL
// ============================================
export const updateCredential = async (req, res) => {
  try {
    const { id } = req.params;
    // console.log(req.body)
    const { userId, title, icon, folderId, category, dataEnc, dataIv, dataAuthTag, favorite, passwordStrength, hasPassword, passwordReused, compromised } = req.body.encryptedCredential;

    // Verify ownership
    const existing = await prisma.credential.findFirst({
      where: {
        id: parseInt(id),
        userId: parseInt(userId),
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Credential not found or unauthorized' });
    }

    // Prepare update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (icon !== undefined) updateData.icon = icon;
    if (folderId !== undefined) updateData.folderId = folderId ? parseInt(folderId) : null;
    if (category !== undefined) updateData.category = category;
    if (favorite !== undefined) updateData.favorite = favorite;
    if (passwordStrength !== undefined) updateData.passwordStrength = passwordStrength;
    if (hasPassword !== undefined) updateData.hasPassword = hasPassword;
    if (passwordReused !== undefined) updateData.passwordReused = passwordReused;
    if (compromised !== undefined) updateData.compromised = compromised;
    
    // If encrypted data is being updated
    if (dataEnc && dataIv && dataAuthTag) {
      updateData.dataEnc = dataEnc;
      updateData.dataIv = dataIv;
      updateData.dataAuthTag = dataAuthTag;
      
      // If password changed, update timestamp
      if (hasPassword) {
        updateData.passwordLastChanged = new Date();
      }
    }

    const credential = await prisma.credential.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        folder: true,
      }
    });

    res.status(200).json({ 
      message: 'Credential updated successfully', 
      credential 
    });
  } catch (error) {
    console.error('Error updating credential:', error);
    res.status(500).json({ error: 'Failed to update credential', details: error.message });
  }
};

// ============================================
// DELETE CREDENTIAL (Soft Delete)
// ============================================
// export const deleteCredential = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { userId, permanent } = req.query;

//     // Verify ownership
//     const existing = await prisma.credential.findFirst({
//       where: {
//         id: parseInt(id),
//         userId: parseInt(userId),
//       }
//     });

//     if (!existing) {
//       return res.status(404).json({ error: 'Credential not found or unauthorized' });
//     }

//     if (permanent === 'true') {
//       // Permanent delete
//       await prisma.credential.delete({
//         where: { id: parseInt(id) }
//       });
//       res.status(200).json({ message: 'Credential permanently deleted' });
//     } else {
//       // Soft delete
//       await prisma.credential.update({
//         where: { id: parseInt(id) },
//         data: { state: 'deleted' }
//       });
//       res.status(200).json({ message: 'Credential moved to trash' });
//     }
//   } catch (error) {
//     console.error('Error deleting credential:', error);
//     res.status(500).json({ error: 'Failed to delete credential', details: error.message });
//   }
// };
export const deletePass = async (req, res) =>{
    const { userId, id } = req.params;
    const {state} = req.query;

    if (!id || !userId) {
        return res.status(400).json({ message: "Both userId and id are required" });
    }

    try {
      if (state === 'deleted') {
        const deletedPass = await prisma.credential.delete({
            where: { 
                id: parseInt(id),
                userId: parseInt(userId)
            },
        });
        return res.status(200).json(deletedPass);}
        else{
          const softDeletedPass = await prisma.credential.update({
              where: { 
                  id: parseInt(id),
                  userId: parseInt(userId)
              },
              data: { state: 'deleted' },
          });
          return res.status(200).json(softDeletedPass); 
        }
    } catch (error) {
        return res.status(500).json({ message: "Error deleting password", error });
    }   

}

export const deleteAllPass = async (req, res) => {
  const { userId } = req.params;
  const { state } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    if (state === 'deleted') {
      const deletedPasses = await prisma.credential.deleteMany({
        where: {
          userId: parseInt(userId),
          state: 'deleted',
        },
      });
      return res.status(200).json(deletedPasses);
    } else {
      return res.status(400).json({ message: "Invalid state value" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Error deleting passwords", error });
  }
};

export const restoreCredential = async(req, res) => {
  const {userId, id} = req.params;
  if (!userId || ! id){
    return res.status(404).json({message :'userId or id is missing'})
  }
  try{
    const response = await prisma.credential.update({
      where : {
      id: parseInt(id),
      userId: parseInt(userId)
    },
    data : { state : 'active'}
  })
  res.status(200).json(
    {
      message: 'credential is restored',
      state : response.state
    }
  )

  }catch(error){
    return res.status(500).json({message: 'error restoring passwords'})
  }





}

// ============================================
// TOGGLE FAVORITE
// ============================================
export const toggleFavorite = async (req, res) => {
  try {
    const { userId,id} = req.params;

    const credential = await prisma.credential.findFirst({
      where: {
        id: parseInt(id),
        userId: parseInt(userId),
      }
    });

    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    const updated = await prisma.credential.update({
      where: { id: parseInt(id) },
      data: { favorite: !credential.favorite }
    });

    res.status(200).json({ 
      message: 'Favorite status updated', 
      favorite: updated.favorite 
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite', details: error.message });
  }
};

// ============================================
// FOLDER MANAGEMENT
// ============================================

// Create folder
export const createFolder = async (req, res) => {
  try {
    const { userId, name } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ error: 'Missing required fields: userId, name' });
    }

    const folder = await prisma.folder.create({
      data: {
        userId: parseInt(userId),
        name,
      }
    });

    res.status(201).json({ message: 'Folder created successfully', folder });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Folder with this name already exists' });
    }
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder', details: error.message });
  }
};

// Get all folders for user
export const getFolders = async (req, res) => {
  try {
    const { userId } = req.params;

    const folders = await prisma.folder.findMany({
      where: {
        userId: parseInt(userId),
      },
      include: {
        _count: {
          select: {
            credentials: {
              where: {
                state: 'active',
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc',
      }
    });

    res.status(200).json({ folders });
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders', details: error.message });
  }
};

// Update folder
export const updateFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, name } = req.body;

    const existing = await prisma.folder.findFirst({
      where: {
        id: parseInt(id),
        userId: parseInt(userId),
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const folder = await prisma.folder.update({
      where: { id: parseInt(id) },
      data: { name }
    });

    res.status(200).json({ message: 'Folder updated successfully', folder });
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ error: 'Failed to update folder', details: error.message });
  }
};

// Delete folder
export const deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    const existing = await prisma.folder.findFirst({
      where: {
        id: parseInt(id),
        userId: parseInt(userId),
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Move credentials to no folder before deleting
    await prisma.credential.updateMany({
      where: { folderId: parseInt(id) },
      data: { folderId: null }
    });

    await prisma.folder.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder', details: error.message });
  }
};

// ============================================
// STATISTICS
// ============================================
export const getVaultStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await prisma.credential.groupBy({
      by: ['category'],
      where: {
        userId: parseInt(userId),
        state: 'active',
      },
      _count: true,
    });

    const totalCredentials = await prisma.credential.count({
      where: {
        userId: parseInt(userId),
        state: 'active',
      }
    });

    const favoriteCount = await prisma.credential.count({
      where: {
        userId: parseInt(userId),
        state: 'active',
        favorite: true,
      }
    });

    const compromisedCount = await prisma.credential.count({
      where: {
        userId: parseInt(userId),
        state: 'active',
        compromised: true,
      }
    });

    const weakPasswordCount = await prisma.credential.count({
      where: {
        userId: parseInt(userId),
        state: 'active',
        hasPassword: true,
        passwordStrength: {
          lte: 2,
        }
      }
    });

    const reusedPasswordCount = await prisma.credential.count({
      where: {
        userId: parseInt(userId),
        state: 'active',
        passwordReused: true,
      }
    });

    res.status(200).json({
      totalCredentials,
      favoriteCount,
      compromisedCount,
      weakPasswordCount,
      reusedPasswordCount,
      byCategory: stats,
    });
  } catch (error) {
    console.error('Error fetching vault stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics', details: error.message });
  }
};

// ============================================
// EXPORT FUNCTIONS
// ============================================
export default {
  addCredential,
  getCredentials,
  getCredentialById,
  updateCredential,
  deletePass,
  deleteAllPass,
  restoreCredential,
  toggleFavorite,
  createFolder,
  getFolders,
  updateFolder,
  deleteFolder,
  getVaultStats,
  getArchiveCredentials
};