import { Resend } from 'resend';

let resendClient = null;

export const getResend = () => {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
    console.log('📧 Resend client initialized');
  }
  return resendClient;
};

export default getResend;
