# @zentla/sdk

Official TypeScript SDK for [Zentla](https://zentla-web.pages.dev) - the open source subscription management API.

## Installation

```bash
npm install @zentla/sdk
```

## Quick Start

```typescript
import { ZentlaClient } from "@zentla/sdk";

const zentla = new ZentlaClient({
  apiKey: process.env.ZENTLA_API_KEY,
  baseUrl: "https://api.zentla.dev", // or your self-hosted URL
});

// Get customer entitlements
const entitlements = await zentla.entitlements.check("customer_123");

if (entitlements.hasAccess("premium_features")) {
  // Grant access to premium features
}

// List customer subscriptions
const subscriptions = await zentla.subscriptions.list("customer_123");
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
const subs = await zentla.subscriptions.list("customer_123");

// Get subscription details
const sub = await zentla.subscriptions.get("sub_789");
```

### Entitlements

```typescript
// Check entitlements
const entitlements = await zentla.entitlements.check("customer_123");

// Check specific feature
const hasFeature = entitlements.hasAccess("api_access");
const apiLimit = entitlements.getValue("api_calls_per_month");
```

### Checkout

```typescript
// Create checkout session
const checkout = await zentla.checkout.create({
  customerId: "customer_123",
  offerId: "offer_pro_monthly",
  successUrl: "https://app.example.com/success",
  cancelUrl: "https://app.example.com/cancel",
});

// Redirect user to checkout.url
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
  baseUrl: "https://api.zentla.dev", // Optional, defaults to Zentla Cloud
  timeout: 30000, // Optional, request timeout in ms
  retries: 3, // Optional, number of retries
});
```

## Documentation

Full documentation available at [zentla-web.pages.dev/docs](https://zentla-web.pages.dev/docs)

## License

MIT
