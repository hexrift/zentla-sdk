# Contributing to Zentla SDK

Thank you for your interest in contributing to the Zentla SDK!

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check existing issues. When reporting:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Your environment (Node.js version, OS)
- Relevant error messages

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies**: `yarn install`
3. **Make your changes** following our coding standards
4. **Add tests** for new functionality
5. **Run tests**: `yarn test`
6. **Run type checking**: `yarn typecheck`
7. **Submit a pull request**

## Development Setup

### Prerequisites

- Node.js 18+
- Yarn 4+

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/zentla-sdk.git
cd zentla-sdk

# Install dependencies
yarn install

# Run tests
yarn test

# Build
yarn build
```

### Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run with coverage
yarn test:coverage
```

### Commit Messages

We follow conventional commit format:

```
type(scope): description
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Getting Help

- **Questions**: Open a [GitHub Discussion](https://github.com/hexrift/zentla-sdk/discussions)
- **Bugs**: Open a [GitHub Issue](https://github.com/hexrift/zentla-sdk/issues)
- **Security**: Email security@zentla.dev (see [SECURITY.md](SECURITY.md))

Thank you for contributing!
