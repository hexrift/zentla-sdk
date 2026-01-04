# @hexrift/zentla-sdk

<p align="center">
  <img src="https://raw.githubusercontent.com/hexrift/zentla-sdk/main/assets/logo.svg" alt="Zentla" width="80" height="80">
</p>

<p align="center">
  <strong>Billing you control</strong>
</p>

<p align="center">
  Official TypeScript SDK for <a href="https://zentla.dev">Zentla</a> — open source entitlements, metering, and billing.
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

- **Entitlements** — Check feature access and quotas in real-time
- **Usage Metering** — Track and aggregate usage events for billing
- **Multi-Provider** — Works with Stripe, Zuora, or self-hosted Zentla
- Full TypeScript support with generated types
- Automatic retries with exponential backoff
- Webhook signature verification

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

### Usage Metering

```typescript
// Track usage events for usage-based billing
await zentla.usage.ingest({
  customerId: "customer_123",
  metricKey: "api_calls",
  quantity: 1,
  idempotencyKey: "evt_abc123", // Prevent duplicates
});

// Batch ingest for high-volume tracking
await zentla.usage.ingestBatch([
  { customerId: "customer_123", metricKey: "api_calls", quantity: 100 },
  { customerId: "customer_456", metricKey: "storage_gb", quantity: 5.5 },
]);

// Get usage summary for a customer
const summary = await zentla.usage.getSummary(
  "customer_123",
  "api_calls",
  "2024-01-01T00:00:00Z",
  "2024-01-31T23:59:59Z"
);
// { metricKey: "api_calls", totalQuantity: 15420, eventCount: 892, ... }

// Get current billing period usage for a subscription
const currentUsage = await zentla.usage.getCurrentPeriodUsage(
  "sub_789",
  "api_calls"
);
```

### Promotions

```typescript
// Create a promotion code
const promo = await zentla.promotions.create({
  code: "SUMMER25",
  name: "Summer Sale 2024",
  config: {
    discountType: "percent",
    discountValue: 25,
    maxRedemptions: 100,
    validUntil: "2024-08-31T23:59:59Z",
  },
});

// Publish the promotion
await zentla.promotions.publish(promo.id);

// Validate a promo code before checkout
const validation = await zentla.promotions.validate("SUMMER25", offerId);
if (validation.valid) {
  console.log("Discount:", validation.discountPreview);
}
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
