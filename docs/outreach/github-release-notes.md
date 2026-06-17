## 1.0.0-beta.16 — 2026-06-14

LaraSkills is a Laravel 13 skills, rules, agents, and knowledge-retrieval system for AI-assisted development. This is the first public beta release.

### What's included

- **12 skills** covering Laravel patterns, Eloquent, TDD, security, core internals, databases, REST APIs, JSON:API, GraphQL, gRPC, microservices, and authentication (14 sub-documents)
- **41 rules** across common, PHP, web, and Laravel categories
- **12 agent definitions** for specialized Laravel engineering assistance
- **2,321 knowledge units** across 21 engineering domains — each with standardized knowledge, rules, skills, a decision tree, anti-patterns, and a validation checklist
- **2,513 graph edges** — 427 dependency edges and 3,513 relationship edges connecting knowledge units for guided retrieval
- **Deterministic CLI** — `retrieve`, `search`, `get`, `doctor`, `validate`, `install`, `setup`
- **MCP server** — 5 read-only tools for AI tool integration (`retrieve_context_bundle`, `search_ecc`, `get_knowledge_unit`, `get_graph_context`, `validate_ecc`)
- **AI-tool harness configs** for OpenCode, Claude Code, Cursor, Gemini CLI, Codex CLI, GitHub Copilot, VS Code, Zed, Trae, Qwen, CodeBuddy, and Kiro

### Validation

- Validated in fresh and existing Laravel 13 projects (Pest test suites passed with 0 regressions)
- 202 Node.js tests passing
- 72 retrieval benchmarks at 100% accuracy
- Packed-install verification and MCP smoke tests passing
- Intelligence layer validated — 0 cycles, 0 self-loops, 0 dangling edges

### Install

```bash
npm install --save-dev laraskills
npx laraskills install --profile core
```

### Resources

- [Beta testing guide](https://github.com/elmochilyas/laraskills/blob/main/docs/feedback/beta-testing-guide.md)
- [GitHub repository](https://github.com/elmochilyas/laraskills)
- [npm package](https://www.npmjs.com/package/laraskills)

### Feedback

Open an issue for bugs, feature requests, or beta feedback: https://github.com/elmochilyas/laraskills/issues/new/choose

### Upgrading

```bash
npm update laraskills
```

See the [CHANGELOG](https://github.com/elmochilyas/laraskills/blob/main/CHANGELOG.md) for the full history.
