const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  senderUid: String,
  recipientUid: String,
  senderName: String,
  recipientName: String,
  senderProfile: String,
  recipientProfile: String,
  recentTextMessage: String,
  createdAt: { type: Date, default: Date.now },
  totalUnReadMessages: { type: Number, default: 0 }
});

module.exports = mongoose.model('Chat', chatSchema);
