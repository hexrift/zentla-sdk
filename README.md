# @zentla/sdk

<p align="center">
  <img src="https://zentla-web.pages.dev/favicon.svg" alt="Zentla" width="80" height="80">
</p>

<p align="center">
  Official TypeScript SDK for <a href="https://zentla-web.pages.dev">Zentla</a> - subscription management for modern apps.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@zentla/sdk"><img src="https://img.shields.io/npm/v/@zentla/sdk.svg" alt="npm version"></a>
  <a href="https://github.com/PrimeCodeLabs/zentla-sdk/actions/workflows/ci.yml"><img src="https://github.com/PrimeCodeLabs/zentla-sdk/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://codecov.io/gh/PrimeCodeLabs/zentla-sdk"><img src="https://codecov.io/gh/PrimeCodeLabs/zentla-sdk/branch/main/graph/badge.svg" alt="codecov"></a>
  <a href="https://github.com/PrimeCodeLabs/zentla-sdk/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@zentla/sdk.svg" alt="license"></a>
  <a href="https://www.npmjs.com/package/@zentla/sdk"><img src="https://img.shields.io/npm/dm/@zentla/sdk.svg" alt="downloads"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0+-blue.svg" alt="TypeScript"></a>
</p>

## Installation

```bash
npm install @zentla/sdk
```

## Quick Start

```typescript
import { ZentlaClient } from "@zentla/sdk";

const zentla = new ZentlaClient({
  apiKey: process.env.ZENTLA_API_KEY,
});

// Check customer entitlements
const { entitlements } = await zentla.customers.getEntitlements("customer_123");

const premiumFeature = entitlements.find((e) => e.featureKey === "premium_features");
if (premiumFeature?.hasAccess) {
  // Grant access to premium features
}

// List subscriptions for a customer
const subscriptions = await zentla.subscriptions.list({ customerId: "customer_123" });
```

## Features

- Full TypeScript support with generated types
- Automatic retries with exponential backoff
- Webhook signature verification
- Works with Zentla Cloud or self-hosted

## API Reference

### Customers

```typescript
// Get customer by ID
const customer = await zentla.customers.get("customer_123");

// Create customer
const customer = await zentla.customers.create({
  externalId: "user_456",
  email: "user@example.com",
  name: "John Doe",
});
```

### Subscriptions

```typescript
// List subscriptions
const subs = await zentla.subscriptions.list({ customerId: "customer_123" });

// Get subscription details
const sub = await zentla.subscriptions.get("sub_789");
```

### Entitlements

```typescript
// Get all entitlements for a customer
const { entitlements } = await zentla.customers.getEntitlements("customer_123");

// Check specific feature
const feature = await zentla.customers.checkEntitlement("customer_123", "api_access");
if (feature.hasAccess) {
  console.log("Access granted, value:", feature.value);
}
```

### Checkout

```typescript
// Create checkout session
const checkout = await zentla.checkout.createSession({
  customerId: "customer_123",
  offerId: "offer_pro_monthly",
  successUrl: "https://app.example.com/success",
  cancelUrl: "https://app.example.com/cancel",
});

// Redirect user to checkout.sessionUrl
```

### Webhooks

```typescript
import { verifyWebhookSignature } from "@zentla/sdk";

// In your webhook handler
const isValid = verifyWebhookSignature(
  req.body,
  req.headers["x-zentla-signature"],
  process.env.ZENTLA_WEBHOOK_SECRET
);
```

## Configuration Options

```typescript
const zentla = new ZentlaClient({
  apiKey: "zentla_live_...", // Required
  baseUrl: "https://api.zentla.dev/api/v1", // Optional, defaults to Zentla Cloud
  timeout: 30000, // Optional, request timeout in ms (default: 30000)
  retries: 3, // Optional, number of retries on 5xx/timeout (default: 3)
});
```

## Documentation

Full documentation available at [zentla-web.pages.dev/docs](https://zentla-web.pages.dev/docs)

## License

MIT
