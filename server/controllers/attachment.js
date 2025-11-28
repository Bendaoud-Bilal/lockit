import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// CREATE ATTACHMENT
// ============================================
export const addAttachment = async (req, res) => {
  try {
    const { credentialId, filename, fileSize, mimeType, encryptedData, dataIv, dataAuthTag } = req.body;
    
    // Validate required fields
    if (!credentialId || !filename || !fileSize || !encryptedData || !dataIv || !dataAuthTag) {
      return res.status(400).json({ 
        error: 'Missing required fields: credentialId, filename, fileSize, encryptedData, dataIv, dataAuthTag' 
      });
    }

    // Verify credential exists
    const credential = await prisma.credential.findUnique({
      where: { id: parseInt(credentialId) }
    });

    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    // Create attachment
    const attachment = await prisma.attachment.create({
      data: {
        credentialId: parseInt(credentialId),
        filename,
        fileSize: parseInt(fileSize),
        mimeType: mimeType || null,
        encryptedData,
        dataIv,
        dataAuthTag,
      }
    });

    res.status(201).json({ 
      message: 'Attachment added successfully', 
      attachment 
    });
  } catch (error) {
    console.error('Error adding attachment:', error);
    res.status(500).json({ error: 'Failed to add attachment', details: error.message });
  }
};

// ============================================
// GET ALL ATTACHMENTS FOR CREDENTIAL
// ============================================
export const getAttachments = async (req, res) => {
  try {
    const { credentialId } = req.params;

    const attachments = await prisma.attachment.findMany({
      where: {
        credentialId: parseInt(credentialId),
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    res.status(200).json({ attachments });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({ error: 'Failed to fetch attachments', details: error.message });
  }
};

// ============================================
// GET SINGLE ATTACHMENT
// ============================================
export const getAttachmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const attachment = await prisma.attachment.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        credential: {
          select: {
            id: true,
            userId: true,
            title: true,
          }
        }
      }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    res.status(200).json({ attachment });
  } catch (error) {
    console.error('Error fetching attachment:', error);
    res.status(500).json({ error: 'Failed to fetch attachment', details: error.message });
  }
};

// ============================================
// DELETE ATTACHMENT
// ============================================
export const deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    const attachment = await prisma.attachment.findUnique({
      where: { id: parseInt(id) }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    await prisma.attachment.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ error: 'Failed to delete attachment', details: error.message });
  }
};

// ============================================
// EXPORT FUNCTIONS
// ============================================
export default {
  addAttachment,
  getAttachments,
  getAttachmentById,
  deleteAttachment,
};
