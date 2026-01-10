# @nexus/nip1-middleware

Convenience wrapper and re-export of `@nexus-ecosystem/nip1` for third-party providers who want to implement the NIP-1 (HTTP 402) paywall standard.

## Installation

```bash
npm install @nexus/nip1-middleware
```

## Usage

```typescript
import { requirePayment } from '@nexus/nip1-middleware';
import express from 'express';

const app = express();

app.get('/premium', requirePayment({
  recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f5e123',
  price: '0.1', // in native token
  chainId: 240
}), (req, res) => {
  res.json({ data: 'premium content' });
});

app.listen(3000);
```

See the canonical [@nexus-ecosystem/nip1 README](../../sdk/nip1-sdk/README.md) for full documentation.
