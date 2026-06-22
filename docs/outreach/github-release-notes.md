## 1.0.0-beta.21 — 2026-06-22 (Hotfix)

LaraSkills is a Laravel 13 skills, rules, agents, and knowledge-retrieval system for AI-assisted development.

### What's new in beta.21

**Hotfix for OpenCode config generation.** Beta.20 had a bug where `laraskills init --assistants opencode` generated `.opencode/opencode.json` with `{file:commands/plan.md}` references but did not copy the `.opencode/commands/` directory. OpenCode rejected the configuration. Beta.21 fixes this.

- **OpenCode commands now generated** — `.opencode/commands/plan.md`, `tdd.md`, `artisan.md`, and `code-review.md` are now copied alongside the config file.
- **Doctor detects broken refs** — `laraskills doctor` validates every `{file:...}` reference in OpenCode config and reports missing files with repair instructions.
- **One-command repair** — Existing beta.20 installs can be fixed with `laraskills update --assistants opencode --yes`.
- **Summary accuracy** — The init summary no longer lists Generic MCP as a selected assistant when it was only generated as shared config.
- **244 tests passing** — 15 new regression tests for config generation, repair, validation, and idempotency.

### Upgrading

If you installed beta.20 globally:

```powershell
npm update -g laraskills
cd my-laravel-project
laraskills update --assistants opencode --yes
```

If you installed beta.20 locally in a project:

```powershell
npm install --save-dev laraskills@latest
npx laraskills update --assistants opencode --yes
```

### New install

```powershell
npm install -g laraskills
cd my-laravel-project
laraskills init --assistants opencode --integration full --profile core --yes
```

### Resources

- [GitHub repository](https://github.com/elmochilyas/laraskills)
- [npm package](https://www.npmjs.com/package/laraskills)
- [Release notes](https://github.com/elmochilyas/laraskills/blob/main/docs/releases/1.0.0-beta.21.md)
- [CHANGELOG](https://github.com/elmochilyas/laraskills/blob/main/CHANGELOG.md)

### Feedback

Open an issue for bugs, feature requests, or beta feedback: https://github.com/elmochilyas/laraskills/issues/new/choose
