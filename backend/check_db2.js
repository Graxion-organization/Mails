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

    const messages = await Message.find({});
    console.log(JSON.stringify(messages, null, 2));

  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
}

checkDB();
