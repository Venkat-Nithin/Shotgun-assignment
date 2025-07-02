require('dotenv').config();

const redis = require('redis');
const isProd = process.env.REDIS_URL?.includes('upstash.io');

const client = redis.createClient({
  url: process.env.REDIS_URL,
  ...(isProd && {
    socket: {
      tls: true,
      reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
      keepAlive: 5000,
    },
  }),
});

client.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

client.on('connect', () => {
  console.log('✅ Connected to Redis');
});

client.connect();

module.exports = client;
