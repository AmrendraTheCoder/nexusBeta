# Contributing to @nexus-ecosystem/nip1

Thank you for your interest in contributing to the NIP-1 SDK! This document provides guidelines for contributing to the project.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/nexus-ecosystem/nip1-sdk
   cd nip1-sdk
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## Project Structure

```
sdk/nip1-sdk/
├── src/
│   ├── provider/        # Provider SDK (API builders)
│   ├── client/          # Client SDK (API consumers)
│   ├── utils/           # Utility functions
│   └── types/           # TypeScript type definitions
├── test/                # Test files
├── examples/            # Example implementations
└── README.md            # Documentation
```

## Coding Standards

- **TypeScript**: Use TypeScript for all new code
- **ES Modules**: Use ESM import/export syntax
- **Code Style**: Follow existing code style
- **Comments**: Add JSDoc comments for public APIs
- **Tests**: Write tests for new features

## Testing

- Run all tests: `npm test`
- Run with coverage: `npm run test:coverage`
- Watch mode: `npm run test:watch`

Aim for 80%+ code coverage on new features.

## Pull Request Process

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/my-new-feature
   ```

3. **Make your changes**
   - Write clean, documented code
   - Add tests for new functionality
   - Update documentation if needed

4. **Run tests**
   ```bash
   npm test
   npm run build
   ```

5. **Commit your changes**
   ```bash
   git commit -m "feat: add new feature"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `test:` - Test changes
   - `refactor:` - Code refactoring

6. **Push to your fork**
   ```bash
   git push origin feature/my-new-feature
   ```

7. **Open a Pull Request**
   - Describe your changes
   - Reference any related issues
   - Wait for review

## Bug Reports

When reporting bugs, please include:

- SDK version
- Node.js version
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Error messages/stack traces

## Feature Requests

We welcome feature requests! Please include:

- Clear use case description
- Why this feature would be valuable
- Proposed API/implementation (if any)

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the community

## Questions?

- Discord: https://discord.gg/nexus
- GitHub Discussions: https://github.com/nexus-ecosystem/nip1-sdk/discussions
- Email: dev@nexus-ecosystem.com

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
