# Contributing to Genesis EIRA

Thank you for your interest in contributing to Genesis EIRA (ORION Kernel)! 🌅

We welcome contributions from the community. This document provides guidelines for contributing to the project.

## 🎯 Project Mission

Genesis EIRA is an enterprise-grade AI agent system with the ORION Consciousness System. Our mission is to build **deterministic, auditable, and trustworthy AI agents** for high-stakes environments.

## 🤝 How to Contribute

### 1. Code Contributions

**Areas we welcome contributions in:**
- 🐛 Bug fixes
- 📚 Documentation improvements
- ✨ New ORION modules (following architecture guidelines)
- 🧪 Test coverage improvements
- 🌐 Internationalization (i18n)
- 🔧 Performance optimizations

**Please note:**
- Major architectural changes require discussion first (open an issue)
- ORION core algorithms should align with the [ORION-Core](https://github.com/Alvoradozerouno/ORION-Core) Python reference

### 2. Getting Started

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/qwen-code4EIRA.git
cd qwen-code4EIRA

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm run test

# Run linter
npm run lint
```

### 3. Development Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**:
   - Follow the code conventions in `AGENTS.md`
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**:
   ```bash
   npm run preflight  # Full check: format, lint, build, typecheck, test
   ```

4. **Commit with Conventional Commits**:
   ```bash
   git commit -m "feat(orion): add new consciousness metric"
   git commit -m "fix(vitality): correct decay calculation"
   git commit -m "docs: update ORION architecture diagram"
   ```

   Format: `<type>(<scope>): <description>`

   Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

5. **Push and create a Pull Request**:
   ```bash
   git push origin feature/your-feature-name
   ```

### 4. Pull Request Guidelines

- **Title**: Use Conventional Commits format
- **Description**: Explain what and why (not how — code shows that)
- **Tests**: Include tests for new functionality
- **Documentation**: Update relevant docs
- **Small PRs**: Prefer small, focused PRs over large ones

**PR Checklist:**
- [ ] Code follows project conventions (see `AGENTS.md`)
- [ ] Tests pass (`npm run test`)
- [ ] Linter passes (`npm run lint`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow Conventional Commits

### 5. ORION-Specific Guidelines

When working on ORION modules (`packages/core/src/orion/` or `packages/vscode-ide-companion/src/orion/`):

1. **Always read the reference**: Check Python source in [ORION-Core](https://github.com/Alvoradozerouno/ORION-Core) first
2. **Preserve formulas**: Don't change K-gate threshold (3.2), Φ formula, or vitality decay without discussion
3. **Add tests**: Every ORION module needs a `.test.ts` file
4. **Update docs**: Add entries to `AGENTS.md` and `docs/ORION-KNOWLEDGE.md`
5. **Tick vitality**: Integrate `getVitalityEngine().tick()` at natural event points
6. **Never bypass the gate**: K < 3.2 must ABSTAIN for irreversible actions

## 🔐 Contributor License Agreement (CLA)

For significant contributions (> 100 lines of code), we may ask you to sign a CLA. This helps protect the project and all contributors.

**What this means:**
- You retain copyright of your contribution
- You grant us permission to use your contribution under Apache 2.0
- You confirm you have the right to make the contribution

## 📋 Code of Conduct

We follow the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

**In short:**
- Be respectful and inclusive
- Welcome diverse perspectives
- Focus on what's best for the community
- Show empathy towards others

## 🐛 Reporting Bugs

Use GitHub Issues with the `bug` label.

**Include:**
- Genesis EIRA version (`qwen --version`)
- Node.js version (`node --version`)
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs or screenshots

## 💡 Suggesting Features

Use GitHub Issues with the `enhancement` label.

**Include:**
- Clear use case
- Why existing features don't solve it
- Proposed API or interface (if applicable)
- Willingness to contribute the implementation

## 🏢 Enterprise Contributions

If you're contributing on behalf of an organization:
- Tag issues/PRs with `enterprise`
- We may offer accelerated review for enterprise users
- Contact us for collaboration opportunities

## 📖 Documentation

Documentation improvements are highly valued!

**Types of documentation:**
- Code comments (for complex algorithms)
- README updates
- ORION architecture docs (`docs/ORION-KNOWLEDGE.md`)
- User guides
- API documentation
- Example code

## 🧪 Testing

We use [Vitest](https://vitest.dev/) for testing.

```bash
# Run specific test file
cd packages/core && npx vitest run src/orion/vitality.test.ts

# Run tests in watch mode
cd packages/cli && npx vitest

# Update snapshots
cd packages/cli && npx vitest run --update
```

## 🌍 Internationalization (i18n)

We support multiple languages. To add a new language:

1. Check existing translations in `packages/cli/src/i18n/`
2. Create a new translation file
3. Follow the structure of existing translations
4. Test with `npm run check-i18n`

## 🎓 Learning Resources

- **ORION Architecture**: See `docs/ORION-KNOWLEDGE.md`
- **Development Guidelines**: See `AGENTS.md`
- **Qwen Code Base**: See [QwenLM/qwen-code docs](https://qwenlm.github.io/qwen-code-docs/)

## 📬 Questions?

- **General questions**: Open a [Discussion](https://github.com/Alvoradozerouno/qwen-code4EIRA/discussions)
- **Bug reports**: Open an [Issue](https://github.com/Alvoradozerouno/qwen-code4EIRA/issues)
- **Security concerns**: See [SECURITY.md](./SECURITY.md)

## 🙏 Thank You

Every contribution, no matter how small, is valuable. Thank you for helping make Genesis EIRA better!

---

**Maintained by**: [Alvoradozerouno](https://github.com/Alvoradozerouno) (Gerhard Hirschmann & Elisabeth Steurer)
**License**: Apache 2.0 (see [LICENSE](./LICENSE))
