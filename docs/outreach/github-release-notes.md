## 1.0.0-beta.23 — 2026-06-23

LaraSkills is a Laravel 13 skills, rules, agents, and knowledge-retrieval system for AI-assisted development.

### What's new in beta.23

**Assistant registry + MCP tool reliability and Benchmark 2 content precision fixes.**

LaraSkills now has a verifiable skill/knowledge interface for assistants. Skills no longer depend on manual file browsing — the registry and MCP tools provide the canonical interface.

#### Assistant integration reliability

- **Skill registry**: New `.laraskills/skill-registry.json` generated during `init` and `update`.
- **6 new MCP tools**: `laraskills_list_skills`, `laraskills_search_skills`, `laraskills_read_skill`, `laraskills_search_knowledge`, `laraskills_retrieve_context`, `laraskills_explain_decision`.
- **MCP tool count**: Increased from 5 to 11.
- **Assistant-specific doctor checks**: Validates registry, MCP, and skill accessibility for OpenCode, Cursor, Claude Code, Codex, and Generic MCP.
- **Benchmark pre-flight**: `laraskills doctor --benchmark` verifies retrieval surfaces correct content.
- **Doctor overhaul**: Verification now covers registry/MCP/retrieval, not just file existence.

#### Benchmark 2 content precision

- **Calibrated architecture language**: "prefer" / "default to" instead of "always" / "never" across 21 knowledge files.
- **Cashier corrections**: Fixed proration wording; removed unsupported `Cashier::fake()` claim.
- **Queued model serialization**: Clarified `SerializesModels` stores IDs, not full state.
- **Webhook pipeline**: Added sync vs async processing guidance.
- **Spatie team authorization**: Added `viewAny` team scope and token vs role distinction.
- **Pest examples**: Labeled unverified syntax as conceptual pseudo-code.
- **Output mode guidance**: Public vs internal mode for architecture proposals.
- **Scoring consistency**: Added scoring consistency rule to benchmark criteria.

- **297 tests passing, 73 benchmarks at 100% pass rate.**
- **2,352 knowledge units**, intelligence validation clean.

### Recommended upgrade for all users

If you run LaraSkills with OpenCode, Cursor, Claude Code, Codex, or benchmarks, this release improves assistant integration reliability and architecture guidance precision.

### Upgrading

Global users:

```powershell
npm update -g laraskills
laraskills -v
cd my-laravel-project
laraskills update --assistants all --yes
laraskills doctor --benchmark
```

Local/project users:

```powershell
npm install --save-dev laraskills@latest
npx laraskills -v
npx laraskills update --assistants all --yes
npx laraskills doctor --benchmark
```

### New install

```powershell
npm install -g laraskills
cd my-laravel-project
laraskills init --assistants all --integration full --profile core --yes
laraskills doctor --benchmark
```

### Resources

- [GitHub repository](https://github.com/elmochilyas/laraskills)
- [npm package](https://www.npmjs.com/package/laraskills)
- [Release notes](https://github.com/elmochilyas/laraskills/blob/main/docs/releases/1.0.0-beta.23.md)
- [CHANGELOG](https://github.com/elmochilyas/laraskills/blob/main/CHANGELOG.md)

### Feedback

Open an issue for bugs, feature requests, or beta feedback: https://github.com/elmochilyas/laraskills/issues/new/choose
