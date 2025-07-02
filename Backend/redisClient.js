const redis = require('redis');

const client = redis.createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: true
  }
});

client.connect();
module.exports = client;
