
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const { updateChat } = require('./controllers/chatController');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  console.log(`User connected: ${userId}`);
  socket.join(userId);

  socket.on('sendMessage', async (data) => {
    try {
      const message = new Message({
        ...data,
        createdAt: new Date()
      });
      await message.save();
      await updateChat(data);

      io.to(data.recipientUid).emit('newMessage', message);
      io.to(data.senderUid).emit('newMessage', message);
    } catch (error) {
      socket.emit('error', { message: 'Error sending message' });
    }
  });

  socket.on('messagesSeen', async (data) => {
    try {
      await Message.updateMany(
        {
          recipientUid: data.recipientUid,
          senderUid: data.senderUid,
          isSeen: false
        },
        { isSeen: true }
      );

      io.to(data.senderUid).emit('messagesSeenUpdate', {
        recipientUid: data.recipientUid
      });
    } catch (error) {
      socket.emit('error', { message: 'Error updating message status' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId}`);
    socket.leave(userId);
  });
});

// Routes
app.get('/chats/:userId', async (req, res) => {
  try {
    const chats = await Chat.find({
      $or: [
        { senderUid: req.params.userId },
        { recipientUid: req.params.userId }
      ]
    }).sort({ createdAt: -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chats' });
  }
});

app.get('/messages/:senderId/:recipientId', async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        {
          senderUid: req.params.senderId,
          recipientUid: req.params.recipientId
        },
        {
          senderUid: req.params.recipientId,
          recipientUid: req.params.senderId
        }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

app.delete('/messages/:messageId', async (req, res) => {
  try {
    await Message.findOneAndDelete({ messageId: req.params.messageId });
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting message' });
  }
});

app.delete('/chats/:senderId/:recipientId', async (req, res) => {
  try {
    await Chat.findOneAndDelete({
      senderUid: req.params.senderId,
      recipientUid: req.params.recipientId
    });
    await Message.deleteMany({
      $or: [
        {
          senderUid: req.params.senderId,
          recipientUid: req.params.recipientId
        },
        {
          senderUid: req.params.recipientId,
          recipientUid: req.params.senderId
        }
      ]
    });
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting chat' });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});