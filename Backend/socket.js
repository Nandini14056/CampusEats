const { Server } = require('socket.io');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('User Connected:', socket.id);

    socket.on('delivery-location', (data) => {
      io.emit('delivery-location-update', {
        orderId: data.orderId,
        lat: data.lat,
        lng: data.lng,
      });
    });

    socket.on('disconnect', () => {
      console.log('User Disconnected:', socket.id);
    });
  });
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }

  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};
