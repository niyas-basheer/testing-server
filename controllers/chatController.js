const Chat = require('../models/Chat');
const Message = require('../models/Message');

const getMessagePreview = (messageData) => {
  switch (messageData.messageType) {
    case 'photo':
      return '📷 Photo';
    case 'video':
      return '📸 Video';
    case 'audio':
      return '🎵 Audio';
    case 'gif':
      return 'GIF';
    default:
      return messageData.message;
  }
};

const updateChat = async (messageData) => {
  const recentTextMessage = getMessagePreview(messageData);

  await Chat.findOneAndUpdate(
    {
      senderUid: messageData.senderUid,
      recipientUid: messageData.recipientUid
    },
    {
      $set: {
        senderName: messageData.senderName,
        recipientName: messageData.recipientName,
        senderProfile: messageData.senderProfile,
        recipientProfile: messageData.recipientProfile,
        recentTextMessage,
        createdAt: new Date()
      }
    },
    { upsert: true }
  );

  await Chat.findOneAndUpdate(
    {
      senderUid: messageData.recipientUid,
      recipientUid: messageData.senderUid
    },
    {
      $set: {
        senderName: messageData.recipientName,
        recipientName: messageData.senderName,
        senderProfile: messageData.recipientProfile,
        recipientProfile: messageData.senderProfile,
        recentTextMessage,
        createdAt: new Date()
      },
      $inc: { totalUnReadMessages: 1 }
    },
    { upsert: true }
  );
};

module.exports = {
  updateChat,
  getMessagePreview
};