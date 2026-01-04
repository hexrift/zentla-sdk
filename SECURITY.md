# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, email us at: **security@zentla.dev**

Include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (optional)

### What to Expect

1. **Acknowledgment**: We will acknowledge receipt within 48 hours.
2. **Assessment**: We will investigate within 7 days.
3. **Resolution**: We aim to resolve critical vulnerabilities within 30 days.
4. **Disclosure**: We will coordinate with you on public disclosure timing.

### Safe Harbor

We consider security research conducted in accordance with this policy to be authorized and will not pursue legal action against researchers who act in good faith.

## Security Best Practices

When using the Zentla SDK:

- Never commit API keys to version control
- Use environment variables for all secrets
- Rotate API keys regularly
- Use test keys in development, live keys only in production
- Always verify webhook signatures using `verifyWebhookSignature()`

## Updates

Security updates are released as patch versions. Subscribe to releases to stay informed.
