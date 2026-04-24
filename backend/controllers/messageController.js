const Message = require('../models/Message');
const User = require('../models/User');

exports.send = async (req, res) => {
  try {
    const { recipient, subject, body, threadId } = req.body;

    if (!recipient || !subject || !body) {
      return res.status(400).json({ error: 'Recipient User ID, subject and body are required.' });
    }

    // Resolve recipient by their userId string (e.g. "230101120") -> MongoDB _id
    const recipientUser = await User.findOne({ userId: recipient }).select('_id');
    if (!recipientUser) {
      return res.status(404).json({ error: `No user found with User ID "${recipient}"` });
    }

    const message = await Message.create({
      sender: req.user.userId,
      recipient: recipientUser._id,
      subject,
      body,
      threadId
    });
    res.status(201).json(message);
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: err.message || 'Failed to send message' });
  }
};

exports.getInbox = async (req, res) => {
  try {
    const messages = await Message.find({
      recipient: req.user.userId,
      deletedByRecipient: false
    })
      .populate('sender', 'name userId role')
      .sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
};

exports.getSent = async (req, res) => {
  try {
    const messages = await Message.find({
      sender: req.user.userId,
      deletedBySender: false
    })
      .populate('recipient', 'name userId role')
      .sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sent messages' });
  }
};

exports.getThread = async (req, res) => {
  try {
    const uid = req.user.userId;
    const messages = await Message.find({
      threadId: req.params.threadId,
      $or: [{ sender: uid }, { recipient: uid }]
    })
      .populate('sender', 'name userId role')
      .populate('recipient', 'name userId role')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch thread' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.recipient.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Only the recipient can mark a message as read' });
    }
    msg.isRead = true;
    await msg.save();
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    const uid = req.user.userId;
    const isSender = msg.sender.toString() === uid;
    const isRecipient = msg.recipient.toString() === uid;
    if (!isSender && !isRecipient) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    if (isSender) msg.deletedBySender = true;
    if (isRecipient) msg.deletedByRecipient = true;
    await msg.save();
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
};
