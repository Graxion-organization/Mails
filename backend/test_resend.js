import { Resend } from 'resend';
const resend = new Resend('dummy');
console.log('receiving.get:', typeof resend.emails.receiving.get);
