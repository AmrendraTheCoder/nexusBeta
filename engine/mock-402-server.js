// Simple Mock 402 Server for Testing
import express from 'express';

const app = express();
const PORT = 3000;

console.log('🚀 Starting Simple Mock 402 Server...\n');

// Free endpoint
app.get('/free', (req, res) => {
  console.log('✅ /free - No payment required');
  res.json({
    message: 'Free public data',
    data: 'Anyone can access this!',
    timestamp: new Date().toISOString()
  });
});

// Premium endpoint (402)
app.get('/premium', (req, res) => {
  const payment = req.headers['x-payment'];
  
  if (!payment) {
    console.log('💰 /premium - Sending 402 Payment Required');
    res.status(402).set({
      'X-Cronos-Address': '0x742d35Cc6634C0532925a3b844Bc9e7595f5e123',
      'X-Cost': '100000000000000000', // 0.1 ETH in wei
      'X-Chain-Id': '84532',
      'X-Asset-Type': 'native'
    }).json({
      error: 'Payment Required',
      payment: {
        recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f5e123',
        amount: '100000000000000000',
        chainId: 84532
      }
    });
  } else {
    console.log(`✅ /premium - Payment proof received: ${payment.substring(0, 20)}...`);
    res.json({
      message: 'Premium crypto data unlocked! 🎉',
      price: { BTC: '$43,521', ETH: '$2,289' },
      timestamp: new Date().toISOString()
    });
  }
});

// Expensive endpoint (402)
app.get('/expensive', (req, res) => {
  const payment = req.headers['x-payment'];
  
  if (!payment) {
    console.log('💎 /expensive - Sending 402 Payment Required');
    res.status(402).set({
      'X-Cronos-Address': '0x742d35Cc6634C0532925a3b844Bc9e7595f5e123',
      'X-Cost': '500000000000000000', // 0.5 ETH in wei
      'X-Chain-Id': '84532',
      'X-Asset-Type': 'native'
    }).json({
      error: 'Payment Required',
      payment: {
        recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f5e123',
        amount: '500000000000000000',
        chainId: 84532
      }
    });
  } else {
    console.log(`✅ /expensive - Payment proof received: ${payment.substring(0, 20)}...`);
    res.json({
      message: 'Exclusive institutional-grade data unlocked! 💎',
      analytics: { sentiment: 'Bullish', volatility: 42.3 },
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Mock 402 Server running on port ${PORT}\n`);
  console.log('📍 Endpoints:');
  console.log(`   GET http://localhost:${PORT}/free`);
  console.log(`   GET http://localhost:${PORT}/premium`);
  console.log(`   GET http://localhost:${PORT}/expensive\n`);
});
