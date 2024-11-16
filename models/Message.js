const mongoose = require('mongoose');
const uuid = require('uuid');

const messageSchema = new mongoose.Schema({
  messageId: { type: String, default: () => uuid.v1() },
  senderUid: String,
  recipientUid: String,
  senderName: String,
  recipientName: String,
  message: String,
  messageType: String,
  createdAt: { type: Date, default: Date.now },
  isSeen: { type: Boolean, default: false },
  repliedTo: { type: String, default: null },
  repliedMessage: { type: String, default: null },
  repliedMessageType: { type: String, default: null }
});

module.exports = mongoose.model('Message', messageSchema);
