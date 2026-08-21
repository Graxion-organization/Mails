import { S3Client } from '@aws-sdk/client-s3';

let r2Client = null;

export const getR2Client = () => {
  if (!r2Client) {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
    console.log('☁️  R2 client initialized');
  }
  return r2Client;
};

export const R2_BUCKET = process.env.R2_BUCKET_NAME || 'graxion-mail-attachments';
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

export default getR2Client;
