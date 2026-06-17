# LaraSkills beta announcement

**LaraSkills** is a Laravel 13 skills, rules, agents, and knowledge-retrieval system for AI-assisted development. After months of internal validation, the public beta is ready for real-world testing.

## What it is

LaraSkills gives AI coding agents two layers of Laravel-specific intelligence:

1. **Operating layer** — Drop-in skills, rules, agents, hooks, and AI-tool harness configs. Install it in any Laravel project to train your AI tool on Laravel 13 conventions, security patterns, and architecture standards.
2. **Knowledge intelligence layer** — 2,321 curated knowledge units across 21 engineering domains. Deterministic retrieval with CLI and MCP server support. Every unit includes knowledge, rules, skills, a decision tree, anti-patterns, and a validation checklist.

## Who it is for

- Laravel developers using AI coding tools (OpenCode, Claude Code, Cursor, Gemini CLI, Codex CLI, Copilot, VS Code with MCP, and others)
- Teams that want consistent, secure, Laravel 13–compliant code from their AI assistants
- Developers curious about structured knowledge retrieval for AI-assisted development

## Quick install

```bash
# In your Laravel project
npm install --save-dev laraskills
npx laraskills install --profile core

# Configure knowledge retrieval (optional but recommended)
git clone https://github.com/elmochilyas/laraskills.git ../laraskills-source
npx laraskills setup --laraskills-root ../laraskills-source
npx laraskills doctor
```

## How to test it

1. Install in a fresh or existing Laravel 13 project
2. Run `npx laraskills doctor` and `npx laraskills validate` to confirm the setup
3. Try building a feature with your AI tool — the installed skills and rules should guide its output
4. Optionally, configure the MCP server for retrieval-powered context

See the [beta testing guide](../feedback/beta-testing-guide.md) and [tester checklist](../feedback/tester-checklist.md) for structured walkthroughs.

## What to build

- A CRUD REST API with policies, Form Requests, API Resources, and pagination
- An Eloquent query with eager loading and index optimization
- A multi-tenant data model with global scopes
- A queue job with retry and failure handling
- Pest feature tests for an existing endpoint

## Supported tools

OpenCode, Claude Code, Cursor, Gemini CLI, Codex CLI, GitHub Copilot, VS Code (with MCP), Zed, Trae, Qwen, CodeBuddy, Kiro.

## Give feedback

- [Bug report](https://github.com/elmochilyas/laraskills/issues/new?template=1-bug-report.yml)
- [Feature request](https://github.com/elmochilyas/laraskills/issues/new?template=2-feature-request.yml)
- [Beta feedback](https://github.com/elmochilyas/laraskills/issues/new?template=3-beta-feedback.yml)

## Links

- **GitHub:** [github.com/elmochilyas/laraskills](https://github.com/elmochilyas/laraskills)
- **npm:** [npmjs.com/package/laraskills](https://www.npmjs.com/package/laraskills)
- **Docs:** [Beta testing guide](../feedback/beta-testing-guide.md)
