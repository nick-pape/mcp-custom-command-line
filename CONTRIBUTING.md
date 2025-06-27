# Contributing to MCP CLI Server

Thank you for your interest in contributing to MCP CLI Server! This guide will help you get started with development and contributing to the project.

## 🛠️ Development Setup

### Prerequisites

- Node.js 22+
- npm or pnpm
- TypeScript 5.8+

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd mcp-cli

# Install dependencies
npm install
# or
pnpm install

# Build the project
npm run build
```

### Build Commands

```bash
# Clean build
npm run build

# Development server with debug output
npm run serve

# Development server with MCPO proxy
npm run serve:mcpo
```

## 📁 Project Structure

```
mcp-cli/
├── bin/                    # Executable scripts
│   ├── mcp-cli            # Unix executable
│   └── mcp-cli.cmd        # Windows batch file
├── config/                # Build configuration
│   ├── heft.json          # Heft build configuration
│   └── typescript.json    # TypeScript configuration
├── examples/              # Example configurations
│   └── config.json        # Sample configuration file
├── src/                   # Source code
│   ├── config-schema.json # JSON schema for validation
│   ├── configuration.ts   # Configuration management
│   ├── executor.ts        # Command execution logic
│   ├── index.ts           # Main entry point
│   └── schema.ts          # Type definitions and validation
├── package.json           # Project configuration
├── README.md              # Project documentation
└── CONTRIBUTING.md        # This file
```

## 🔧 Development Environment

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MCP_CLI_CONFIG_PATH` | Path to configuration file | `./config.json` |
| `MCP_CLI_CONFIG_JSON` | Inline JSON configuration | `{"version":"1.0",...}` |
| `DEBUG` | Enable debug logging | `1` |
| `VERBOSE` | Enable verbose logging | `1` |

### Testing Your Changes

1. Build the project: `npm run build`
2. Test locally with debug output: `npm run serve`
3. Test with a sample configuration from `examples/config.json`

## 🤝 Contributing Guidelines

### Getting Started

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test your changes thoroughly
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- Follow TypeScript best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Ensure all types are properly defined
- Run the linter before submitting: `npm run lint` (if available)

### Commit Messages

Use clear and descriptive commit messages:
- `feat: add new command validation feature`
- `fix: resolve issue with argument parsing`
- `docs: update README with new examples`
- `refactor: improve error handling in executor`

### Pull Request Process

1. Ensure your code builds successfully (`npm run build`)
2. Update documentation if you've changed functionality
3. Add examples if you've added new features
4. Describe your changes clearly in the PR description
5. Link any related issues

## 🧪 Testing

### Manual Testing

1. Create test configuration files in the `examples/` directory
2. Test different command types and argument combinations
3. Verify error handling for invalid configurations
4. Test environment variable configurations

### Adding New Features

When adding new features:
1. Update the JSON schema in `src/config-schema.json`
2. Update TypeScript interfaces in `src/schema.ts`
3. Add validation logic if needed
4. Update documentation and examples
5. Test thoroughly with various configurations

## 📝 Documentation

- Update README.md for user-facing changes
- Update this CONTRIBUTING.md for development changes
- Add inline code documentation for complex functions
- Update examples in the `examples/` directory

## 🐛 Reporting Issues

When reporting issues:
1. Use a clear and descriptive title
2. Provide steps to reproduce the issue
3. Include your configuration file (if applicable)
4. Include error messages and logs
5. Specify your Node.js version and operating system

## 💡 Feature Requests

We welcome feature requests! Please:
1. Check if the feature already exists or is planned
2. Describe the use case clearly
3. Provide examples of how it would be used
4. Consider backwards compatibility

## 🔍 Code Review Process

All contributions go through code review:
1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Once approved, your PR will be merged
4. Your contribution will be included in the next release

## 📦 Release Process

Releases are handled by maintainers:
1. Version bump in package.json
2. Update CHANGELOG.md
3. Create release tag
4. Publish to npm

## 🙏 Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes for significant contributions
- README acknowledgments (for major features)

---

Thank you for contributing to MCP CLI Server! 🚀
