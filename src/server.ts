import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config/env.js';  
import router from './routes/index.js';
import { seedSuperApprover } from './seedApprover.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = config.port;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'https://freshdrops.netlify.app',
  'https://approvals.freshdropsgh.com'
];

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://freshdrops.netlify.app',
    'https://approvals.freshdropsgh.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));



// Routes
app.use('/api', router);


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Fresh Drops Approval System API',
    timestamp: new Date().toISOString(),
  });
});

const startServer = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');

    await seedSuperApprover();

    app.listen(PORT, () => {
      console.log(`🏭 Fresh Drops Approval System`);
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Startup error:', error);
    process.exit(1);
  }
};

startServer();