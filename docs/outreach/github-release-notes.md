## 1.0.0-beta.17 — 2026-06-22

LaraSkills is a Laravel 13 skills, rules, agents, and knowledge-retrieval system for AI-assisted development.

### What's new in beta.17

- **`laraskills init`** — New recommended project setup command with profile
  support (`minimal`, `core`, `full`). `laraskills install` kept for backward
  compatibility.
- **`laraskills -v` / `laraskills --version`** — Quick version check.
- **Command-specific help pages** — Each command has its own `--help` output.
- **CLI help rework** — Root help organized into clear command groups.
- **Hybrid model clarified** — npm package = CLI/MCP adapter, full checkout =
  knowledge source, `laraskills init` = project-facing files.
- **README rewrite** — Clean install → setup → init → retrieve → update flow.
- **213 Node.js tests passing** (up from 201).

### Install

```bash
npm install -g laraskills
laraskills setup --laraskills-root "C:\path\to\laraskills"
cd my-laravel-project
laraskills init
```

### Upgrading

```bash
npm update -g laraskills
cd my-laravel-project
laraskills update
```

### Resources

- [Beta testing guide](https://github.com/elmochilyas/laraskills/blob/main/docs/feedback/beta-testing-guide.md)
- [GitHub repository](https://github.com/elmochilyas/laraskills)
- [npm package](https://www.npmjs.com/package/laraskills)
- [Release notes](https://github.com/elmochilyas/laraskills/blob/main/docs/releases/1.0.0-beta.17.md)

### Feedback

Open an issue for bugs, feature requests, or beta feedback: https://github.com/elmochilyas/laraskills/issues/new/choose

See the [CHANGELOG](https://github.com/elmochilyas/laraskills/blob/main/CHANGELOG.md) for the full history.
