# @hexrift/zentla-sdk

<p align="center">
  <img src="https://zentla.dev/favicon.svg" alt="Zentla" width="80" height="80">
</p>

<p align="center">
  Official TypeScript SDK for <a href="https://zentla.dev">Zentla</a> - subscription management for modern apps.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@hexrift/zentla-sdk"><img src="https://img.shields.io/npm/v/@hexrift/zentla-sdk.svg" alt="npm version"></a>
  <a href="https://github.com/hexrift/zentla-sdk/actions/workflows/ci.yml"><img src="https://github.com/hexrift/zentla-sdk/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://codecov.io/gh/hexrift/zentla-sdk"><img src="https://codecov.io/gh/hexrift/zentla-sdk/branch/main/graph/badge.svg" alt="codecov"></a>
  <a href="https://github.com/hexrift/zentla-sdk/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@hexrift/zentla-sdk.svg" alt="license"></a>
  <a href="https://www.npmjs.com/package/@hexrift/zentla-sdk"><img src="https://img.shields.io/npm/dm/@hexrift/zentla-sdk.svg" alt="downloads"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0+-blue.svg" alt="TypeScript"></a>
</p>

## Installation

```bash
npm install @hexrift/zentla-sdk
```

## Quick Start

```typescript
import { ZentlaClient } from "@hexrift/zentla-sdk";

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
import { verifyWebhookSignature } from "@hexrift/zentla-sdk";

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

Full documentation available at [zentla.dev/docs](https://zentla.dev/docs)

## Changelog

### v0.2.0 (Breaking Changes)

Subscription status values have been updated to use Zentla-native terminology:

| Old Value (v0.1.x) | New Value (v0.2.0) |
|--------------------|---------------------|
| `past_due` | `payment_failed` |
| `incomplete` | `pending` |
| `incomplete_expired` | `expired` |
| `unpaid` | `suspended` |

**Migration:** Update any code that filters or checks subscription status:

```typescript
// Before (v0.1.x)
if (subscription.status === "past_due") { ... }

// After (v0.2.0)
if (subscription.status === "payment_failed") { ... }
```

## License

MIT
