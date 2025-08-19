const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Basic middleware
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());

// Basic health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Mock user data for authentication
app.post('/api/v1/auth/login', (req, res) => {
  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: 1,
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
    },
    token: 'mock-jwt-token',
  });
});

// Mock products data
app.get('/api/v1/products', (req, res) => {
  res.json([
    {
      id: 1,
      sku: 'ELC001',
      name: 'MacBook Pro 16"',
      category: 'Electronics',
      quantity: 3,
      status: 'In Stock',
    },
    {
      id: 2,
      sku: 'OFF001',
      name: 'Office Chair',
      category: 'Office Supplies',
      quantity: 5,
      status: 'In Stock',
    },
  ]);
});

// Mock lending data
app.get('/api/v1/lending', (req, res) => {
  res.json([
    {
      id: 1,
      sku: 'ELC001',
      name: 'MacBook Pro 16"',
      category: 'Electronics',
      available: 3,
      location: 'Office A',
      condition: 'good',
    },
  ]);
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Simple server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`🌐 Frontend should be running on http://localhost:3000`);
});
