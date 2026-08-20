import mongoose from 'mongoose';
import Mailbox from './models/Mailbox.js';
import Thread from './models/Thread.js';
import Message from './models/Message.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const mailboxes = await Mailbox.find({});
    console.log('Mailboxes:', mailboxes.map(m => m.address));

    const threads = await Thread.find({});
    console.log(`Found ${threads.length} threads`);
    
    if (threads.length > 0) {
      console.log('Sample thread:', JSON.stringify(threads[0], null, 2));
    }

    const messages = await Message.find({});
    console.log(`Found ${messages.length} messages`);

  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
}

checkDB();
