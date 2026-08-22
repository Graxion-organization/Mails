import { nanoid } from 'nanoid';
import cloudinary from '../config/cloudinary.js';
import Attachment from '../models/Attachment.js';

/**
 * @desc    Upload attachment
 * @route   POST /api/mail/attachments/upload
 */
export const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { orgId } = req.body;
    
    // Upload to Cloudinary using a stream
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `graxion_mail/attachments/${orgId}`,
          resource_type: 'auto',
          original_filename: req.file.originalname,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const attachment = await Attachment.create({
      organization: orgId,
      uploadedBy: req.accountId,
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      size: req.file.size,
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    });

    res.status(201).json({
      success: true,
      data: {
        id: attachment._id,
        filename: attachment.filename,
        contentType: attachment.contentType,
        size: attachment.size,
        public_id: attachment.public_id,
        url: attachment.url,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Error uploading attachment' });
  }
};

/**
 * @desc    Download attachment (URL redirect)
 * @route   GET /api/mail/attachments/:attachmentId/download
 */
export const downloadAttachment = async (req, res) => {
  try {
    const attachment = await Attachment.findById(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    // Cloudinary URLs are public, so we can just redirect or return the URL
    res.json({ success: true, data: { url: attachment.url, filename: attachment.filename } });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ success: false, message: 'Error getting download URL' });
  }
};

/**
 * @desc    Delete attachment
 * @route   DELETE /api/mail/attachments/:attachmentId
 */
export const deleteAttachment = async (req, res) => {
  try {
    const attachment = await Attachment.findById(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    if (attachment.public_id) {
      await cloudinary.uploader.destroy(attachment.public_id, { resource_type: 'raw' }).catch(err => console.error('Cloudinary deletion error:', err));
      await cloudinary.uploader.destroy(attachment.public_id, { resource_type: 'image' }).catch(err => console.error('Cloudinary deletion error:', err));
      await cloudinary.uploader.destroy(attachment.public_id, { resource_type: 'video' }).catch(err => console.error('Cloudinary deletion error:', err));
    }

    attachment.status = 'deleted';
    await attachment.save();

    res.json({ success: true, message: 'Attachment deleted' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ success: false, message: 'Error deleting attachment' });
  }
};
