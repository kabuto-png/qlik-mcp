# Contributing to Qlik MCP

Thanks for your interest in contributing!

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Make your changes
5. Test locally with a Qlik Sense dashboard
6. Commit with clear messages
7. Push and create a Pull Request

## Development Setup

```bash
# Install dependencies
npm install

# Build Chrome extension
cd src/chrome-extension && node build.js

# Install MCP server for Claude Code
./install.sh  # Linux/macOS
# or
.\install.ps1  # Windows
```

## Code Style

- TypeScript for all source files
- Keep functions small and focused
- Add JSDoc comments for public functions
- Follow existing patterns in the codebase

## Pull Request Guidelines

- One feature/fix per PR
- Include description of what and why
- Test with an actual Qlik Sense dashboard
- Update README if adding new tools

## Reporting Issues

- Check existing issues first
- Include Qlik Sense version
- Describe steps to reproduce
- Include console logs if applicable

## Questions?

Open an issue with the "question" label.
