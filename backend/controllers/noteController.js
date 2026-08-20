import Message from '../models/Message.js';
import { getIO } from '../sockets/socketHandler.js';
import AuditLog from '../models/AuditLog.js';

export const addNote = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Note text is required' });

    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    const note = {
      author: req.accountId,
      authorName: req.member?.account?.name || 'Unknown', // Ideally populated from Auth service
      text,
      createdAt: new Date(),
    };

    message.internalNotes.push(note);
    await message.save();

    await AuditLog.create({
      organization: message.organization,
      account: req.accountId,
      action: 'note.added',
      target: { type: 'message', id: message._id.toString() },
    });

    // Broadcast note addition
    const io = getIO();
    io.to(`thread:${message.thread}`).emit('note:added', {
      messageId: message._id,
      threadId: message.thread,
      note,
    });

    res.status(201).json({ success: true, data: note });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ success: false, message: 'Error adding internal note' });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const { messageId, noteId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    const noteIndex = message.internalNotes.findIndex(n => n._id.toString() === noteId);
    if (noteIndex === -1) return res.status(404).json({ success: false, message: 'Note not found' });

    const note = message.internalNotes[noteIndex];
    
    // Only author or admin can delete
    if (note.author !== req.accountId && req.member?.role !== 'admin' && req.member?.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this note' });
    }

    message.internalNotes.splice(noteIndex, 1);
    await message.save();

    const io = getIO();
    io.to(`thread:${message.thread}`).emit('note:deleted', {
      messageId,
      threadId: message.thread,
      noteId,
    });

    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ success: false, message: 'Error deleting note' });
  }
};
