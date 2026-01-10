# NIP-1: Nexus Interface Protocol — HTTP 402 Payment Standard

This document formalizes the NIP-1 standard used across the Nexus ecosystem for pay-per-use API access via HTTP 402 (Payment Required). It specifies the required headers, the payment proof format, error handling, and reference implementations for providers and clients.

For the canonical, richly formatted specification with examples, see the published standard in: [docs/standards/nip-1.md](docs/standards/nip-1.md)

## Overview

- Status code: 402 Payment Required
- Required headers: `X-Cronos-Address`, `X-Cost`, `X-Asset-Type`, `X-Chain-Id`
- Optional headers: `X-Supported-Chains`, `X-Payment-Format` (defaults to `txHash:chainId`)
- Payment proof header: `X-PAYMENT: <txHash>:<chainId>`

## Provider Requirements

- Return 402 with all required headers when payment is missing or invalid.
- Validate `X-PAYMENT` header format and the chain ID against supported chains.
- Verify payment on-chain for recipient and amount; accept equal or greater amount.
- Optionally enforce minimum confirmations and a transaction max age.
- Include a JSON body with clear instructions and supported chain metadata.

## Client Requirements

- Parse 402 headers/body to determine `recipient`, `amount`, and `chainId`.
- Execute payment on the indicated chain.
- Retry with `X-PAYMENT` header.
- Cache successful payments to avoid double-spend for the same resource.

## Error Handling

- 402: Payment required or invalid payment.
- 409: Duplicate payment (already used).
- 4xx/5xx: Standard HTTP semantics.

## Reference Implementations

- Provider middleware and client SDK are available in the workspace under `sdk/nip1-sdk/` and can be published to NPM.
- `@nexus-ecosystem/nip1` package provides `requirePayment` (Express), client helpers, and tests.

## Publishing

- The ecosystem-facing standard is published under [docs/standards/nip-1.md](docs/standards/nip-1.md).
