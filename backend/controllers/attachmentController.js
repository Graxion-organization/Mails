import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';
import getR2Client, { R2_BUCKET } from '../config/r2.js';
import Attachment from '../models/Attachment.js';

/**
 * @desc    Upload attachment to R2
 * @route   POST /api/mail/attachments/upload
 */
export const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { orgId } = req.body;
    const r2 = getR2Client();
    const key = `attachments/${orgId}/${nanoid(16)}/${req.file.originalname}`;

    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    const attachment = await Attachment.create({
      organization: orgId,
      uploadedBy: req.accountId,
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      size: req.file.size,
      r2Bucket: R2_BUCKET,
      r2Key: key,
    });

    res.status(201).json({
      success: true,
      data: {
        id: attachment._id,
        filename: attachment.filename,
        contentType: attachment.contentType,
        size: attachment.size,
        r2Key: attachment.r2Key,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Error uploading attachment' });
  }
};

/**
 * @desc    Download attachment (pre-signed URL)
 * @route   GET /api/mail/attachments/:attachmentId/download
 */
export const downloadAttachment = async (req, res) => {
  try {
    const attachment = await Attachment.findById(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    const r2 = getR2Client();
    const url = await getSignedUrl(r2, new GetObjectCommand({
      Bucket: attachment.r2Bucket,
      Key: attachment.r2Key,
    }), { expiresIn: 3600 }); // 1 hour

    res.json({ success: true, data: { url, filename: attachment.filename } });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ success: false, message: 'Error generating download URL' });
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

    const r2 = getR2Client();
    await r2.send(new DeleteObjectCommand({
      Bucket: attachment.r2Bucket,
      Key: attachment.r2Key,
    }));

    attachment.status = 'deleted';
    await attachment.save();

    res.json({ success: true, message: 'Attachment deleted' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ success: false, message: 'Error deleting attachment' });
  }
};
