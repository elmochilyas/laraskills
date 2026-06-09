# Documentation Sync Audit

> Generated: 2026-06-04
> Phase 10.5.5 — Documentation and Agent Entry-Point Synchronization

## Actual Repository Metrics (from filesystem)

| Metric | Calculated Value |
|---|---|
| Package version (package.json) | 1.0.0-beta.7 |
| Curated skills (skills/ directories) | 12 |
| Curated agents (agents/ .md files) | 12 |
| Rule categories (rules/ directories) | 4 (common, laravel, php, web) |
| Individual rule files | 41 |
| Commands (commands/ .md files) | 7 |
| Harness configs | 12 |
| MCP config files | 1 |
| Engineering domains (knowledge/) | 21 |
| Canonical KUs | 2,321 |
| JSON intelligence files | 8 |
| Markdown indexes | 7 |
| Dependency edges | 264 |
| Relationship edges | 3,626 |
| Agent navigation files | 5 |

## Stale Counts Found

### README.md

| Claimed | Actual | Fix Needed |
|---|---|---|
| Skills: 11 | 12 | Update to 12 |
| Agents: 10 | 12 | Update to 12 |
| Rules: 40 | 41 | Update to 41 |
| Commands: 4 | 7 | Update to 7 |
| "All 3 skills" (line 49) | 12 skills | Remove stale GitHub wording |
| Missing knowledge layer | Not mentioned | Add two-layer architecture |
| Missing metrics table | Not present | Add current metrics table |
| Missing agent workflow | Not present | Add retrieval workflow section |

### AGENTS.md

| Claimed | Actual | Fix Needed |
|---|---|---|
| Version: 1.0.0-beta.5 | 1.0.0-beta.7 | Update to 1.0.0-beta.7 |
| JSON files: "7 files" (line 130) | 8 | Update to 8 |
| Missing retrieval priority | Not present | Add retrieval priority section |
| Missing machine-readable section | Not present | Add intelligence/json reference |
| Missing ADR reference | Not present | Add docs/architecture-decisions/ link |
| Missing repository purpose | Partial | Add operating + knowledge layer explanation |

### docs/repository-map.md

| Claimed | Actual | Fix Needed |
|---|---|---|
| KUs: 2,307 | 2,321 | Update to 2,321 |
| Indexes: 6 | 7 (includes anti-pattern-index) | Update to 7 |
| JSON files: 4 | 8 (adds deps, rels, decision-trees, anti-patterns, checklists) | Update to 8 |
| agent/: "empty" | 5 files | Update description |
| commands/: empty | 7 files | Update description |
| Says `production/` directory | Check if exists | Remove or verify |
| Missing intelligence JSON descriptions | 4 of 8 listed | Add all 8 |

### CLAUDE.md

| Issue | Fix Needed |
|---|---|
| No reference to AGENTS.md | Add forwarding instruction |
| No reference to agent navigation layer | Add agent/ directory references |
| No knowledge layer reference | Add brief mention |
| Skills table lists 12 correctly | OK — keep |

### Harness Entry Points (.opencode, .cursor, .gemini, .codex, etc.)

| Issue | Fix Needed |
|---|---|
| Most do not reference AGENTS.md | Add concise forwarding to AGENTS.md |
| Most reference specific instructions only | Keep harness-specific, add AGENTS.md pointer |

## Files to Update

1. `README.md` — Major update: metrics, two-layer architecture, agent workflow, distribution wording
2. `AGENTS.md` — Update version, add retrieval priority, add machine-readable section, add ADR reference
3. `CLAUDE.md` — Add forwarding to AGENTS.md and agent/ layer
4. `.opencode/opencode.json` — Add AGENTS.md reference
5. `.gemini/instructions.md` — Add AGENTS.md reference
6. `.codex/instructions.md` — Add AGENTS.md reference
7. `.github/copilot-instructions.md` — Add AGENTS.md reference
8. `.trae/rules.md` — Add AGENTS.md reference
9. `.qwen/instructions.md` — Add AGENTS.md reference
10. `.codebuddy/instructions.md` — Add AGENTS.md reference
11. `.kiro/instructions.md` — Add AGENTS.md reference
12. `docs/repository-map.md` — Update counts, descriptions, links

## Files NOT to Modify

- `knowledge/` — No knowledge graph changes
- `intelligence/json/` — No dependency graph changes
- `skills/` — No curated skill changes
- `rules/` — No curated rule changes
- `agents/` — No curated agent changes
