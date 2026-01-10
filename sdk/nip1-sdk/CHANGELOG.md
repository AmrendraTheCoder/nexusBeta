# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-21

### Added
- Initial release of @nexus-ecosystem/nip1
- Provider SDK with `requirePayment` middleware
- Client SDK with `NIP1Client` class
- `autoPayFetch` utility for simple requests
- Payment verification with `verifyPayment`
- Payment caching with `PaymentCache`
- Multi-chain support (Cronos, Base, Polygon, Ethereum)
- Comprehensive TypeScript type definitions
- Payment callbacks (beforePayment, afterPayment)
- Helper utilities for parsing and creating payment proofs
- Full test suite with 80%+ coverage
- Example implementations for providers and clients
- AI agent automation example
- Complete documentation

### Security
- Replay attack prevention via payment caching
- Transaction confirmation validation
- Amount and recipient verification
- Error handling for failed transactions

---

## Future Releases

### [1.1.0] - Planned
- Support for ERC20 token payments
- NFT-gated access (ERC721/ERC1155)
- Subscription-based payments
- Webhook support for payment notifications
- Rate limiting integration
- Advanced analytics

### [1.2.0] - Planned
- Fastify plugin
- NestJS module
- Python SDK
- Go SDK
- Payment streaming (continuous micro-payments)

---

[1.0.0]: https://github.com/nexus-ecosystem/nip1-sdk/releases/tag/v1.0.0
