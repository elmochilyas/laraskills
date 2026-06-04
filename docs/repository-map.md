# ECC Repository Map

> Laravel Engineering Codex — a structured knowledge repository for engineering Laravel applications with production-grade intelligence.
> Last updated: 2026-06-04

| Metric | Count |
|---|---|
| Engineering Domains | 21 |
| Knowledge Units (KU) | 2,321 |
| JSON Intelligence Files | 8 |
| Markdown Indexes | 7 |
| Dependency Edges | 264 |
| Relationship Edges | 3,626 |
| Curated Skills | 12 |
| Curated Rule Files | 41 (4 categories) |
| Curated Agent Definitions | 12 |
| Agent Navigation Files | 5 |
| CLI Commands | 7 |
| CLI Harness Configs | 12 |

---

## Repository Tree

```
laravel-ecc/
├── knowledge/                          (21 domains, 2,321 KUs)
├── intelligence/
│   ├── indexes/                        (7 files)
│   ├── registry/                       (1 file)
│   ├── json/                           (8 files)
├── agent/                              (5 navigation files)
├── agents/                             (12 agent definitions)
├── skills/                             (12 skill sets)
├── rules/                              (41 rules, 4 categories)
│   ├── common/                         (10 rules)
│   ├── laravel/                        (19 rules)
│   ├── php/                            (5 rules)
│   └── web/                            (7 rules)
├── meta/                               (21 domain-discovery directories)
├── docs/                               (documentation, ADRs, reports)
├── commands/                           (7 command references)
├── scripts/                            (automation scripts)
├── hooks/                              (git/agent hooks)
├── tools/                              (knowledge layer scripts)
├── production/                         (production indexes)
├── manifests/                          (manifests)
├── mcp-configs/                        (MCP server configs)
├── .opencode/                          (1 file)
├── .claude/                            (1 file)
├── .cursor/                            (2 files)
├── .gemini/                            (1 file)
├── .codex/                             (1 file)
├── .github/                            (1 file)
├── .vscode/                            (2 files)
├── .zed/                               (1 file)
├── .trae/                              (1 file)
├── .qwen/                              (1 file)
├── .codebuddy/                         (1 file)
└── .kiro/                              (1 file)
```

---

## Domain Inventory

| # | Domain | KUs | Subdomains |
|---|--------|-----|------------|
| 1 | ai-intelligence-systems | 117 | 15 |
| 2 | api-crud-system-engineering | 246 | 12 |
| 3 | api-integration-engineering | 82 | 10 |
| 4 | application-architecture-patterns | 107 | 7 |
| 5 | async-distributed-systems | 95 | 11 |
| 6 | backend-architecture-design | 84 | 11 |
| 7 | cost-resource-optimization | 109 | 10 |
| 8 | data-engineering-analytics | 44 | 9 |
| 9 | data-storage-systems | 289 | 10 |
| 10 | devops-infrastructure | 47 | 11 |
| 11 | governance-compliance-engineering | 40 | 10 |
| 12 | laravel-core-application-engineering | 159 | 13 |
| 13 | laravel-eloquent-domain-modeling | 171 | 11 |
| 14 | laravel-execution-lifecycle | 110 | 10 |
| 15 | observability-production-intelligence | 34 | 9 |
| 16 | performance-runtime-engineering | 161 | 10 |
| 17 | platform-engineering-developer-experience | 107 | 10 |
| 18 | real-time-systems | 39 | 12 |
| 19 | search-retrieval-systems | 140 | 13 |
| 20 | security-identity-engineering | 61 | 8 |
| 21 | testing-reliability-engineering | 79 | 15 |

For full domain details including subdomain listings, see:
- `intelligence/indexes/knowledge-unit-index.md`
- `intelligence/registry/knowledge-registry.md`

---

## Operating Layer Overview

### Skills Inventory (12 Skill Sets)

| Skill | Description |
|---|---|
| `skills/laravel-api-graphql` | GraphQL API development |
| `skills/laravel-api-grpc` | gRPC API development |
| `skills/laravel-api-jsonapi` | JSON:API specification implementation |
| `skills/laravel-api-microservices` | Microservice API patterns |
| `skills/laravel-api-rest` | RESTful API development |
| `skills/laravel-authentication` | Authentication implementation |
| `skills/laravel-core-internals` | Laravel core internals |
| `skills/laravel-database` | Database engineering |
| `skills/laravel-eloquent` | Eloquent ORM patterns |
| `skills/laravel-patterns` | Laravel design patterns |
| `skills/laravel-security` | Security best practices |
| `skills/laravel-tdd` | Test-driven development |

### Rules Inventory (41 Rules, 4 Categories)

| Category | Count | Contents |
|---|---|---|
| common/ | 10 | agents, code-review, coding-style, development-workflow, git-workflow, hooks, patterns, performance, security, testing |
| laravel/ | 19 | api-graphql, api-grpc, api-jsonapi, api-microservices, api-rest, architecture, authentication, coding-style, contracts, database, eloquent, facades, hooks, middleware, patterns, security, service-container, service-providers, testing |
| php/ | 5 | coding-style, hooks, patterns, security, testing |
| web/ | 7 | coding-style, design-quality, hooks, patterns, performance, security, testing |

### Agents Inventory (12 Agent Definitions)

| Agent | Focus |
|---|---|
| `agents/laravel-api-graphql` | GraphQL API specialization |
| `agents/laravel-api-grpc` | gRPC API specialization |
| `agents/laravel-api-jsonapi` | JSON:API specialization |
| `agents/laravel-api-microservices` | Microservices architecture |
| `agents/laravel-api-rest` | REST API specialization |
| `agents/laravel-artisan` | Artisan console expertise |
| `agents/laravel-authentication` | Authentication systems |
| `agents/laravel-container` | Service container expertise |
| `agents/laravel-database` | Database engineering |
| `agents/laravel-eloquent` | Eloquent ORM expertise |
| `agents/laravel-identity-architecture` | Identity & access architecture |
| `agents/laravel-migration` | Database migration expertise |

---

## Intelligence Layer Overview

### Indexes (7 files)

| File | Purpose |
|---|---|
| `intelligence/indexes/knowledge-unit-index.md` | Complete index of all knowledge units |
| `intelligence/indexes/rule-index.md` | Compiled rule definitions for all categories |
| `intelligence/indexes/skill-index.md` | Index of all skill definitions |
| `intelligence/indexes/decision-tree-index.md` | Aggregated decision trees for engineering choices |
| `intelligence/indexes/anti-pattern-index.md` | Anti-pattern reference across all domains |
| `intelligence/indexes/checklist-index.md` | Master index of all checklists across domains |
| `intelligence/indexes/dependency-index.md` | Cross-domain dependency map |

### JSON Layer (8 files)

| File | Purpose |
|---|---|
| `intelligence/json/knowledge-units.json` | Machine-readable KU metadata (2,321 records) |
| `intelligence/json/rules.json` | Machine-readable rule set (2,321 entries) |
| `intelligence/json/skills.json` | Machine-readable skill definitions (2,321 entries) |
| `intelligence/json/decision-trees.json` | Machine-readable decision tree definitions (2,321 entries) |
| `intelligence/json/anti-patterns.json` | Machine-readable anti-pattern definitions (2,321 entries) |
| `intelligence/json/checklists.json` | Machine-readable checklist definitions (2,321 entries) |
| `intelligence/json/dependencies.json` | Machine-readable dependency graph (264 edges) |
| `intelligence/json/relationships.json` | Machine-readable relationship graph (3,626 edges) |

### Registry (1 file)

| File | Purpose |
|---|---|
| `intelligence/registry/knowledge-registry.md` | Human-readable domain registry with metadata |

### Agent Navigation Files (5 files)

| File | Purpose |
|---|---|
| `agent/domain-routing-index.md` | Flat index of all 21 domains with subdomains |
| `agent/agent-routing-map.md` | Task-to-domain routing map |
| `agent/domain-selection-guide.md` | Problem-to-domain matching guide |
| `agent/retrieval-guide.md` | Optimal retrieval strategy for AI agents |
| `agent/task-to-skill-map.md` | Task-to-curated-skill mapping |

---

## Navigation Guide

### For Humans
- **Domain discovery:** Start at `meta/domain-discovery/` for domain summaries, then drill into `knowledge/<domain>/` for detailed KUs.
- **Quick reference:** Use `intelligence/registry/knowledge-registry.md` for a curated human-readable map.
- **Rules:** Check `rules/<category>/` for coding standards and workflows.
- **Skills:** Browse `skills/` for reusable skill definitions organized by Laravel topic.
- **ADRs:** See `docs/architecture-decisions/` for architectural decision records.

### For AI Agents
- **Root entry:** Use [`AGENTS.md`](../AGENTS.md) for full agent operating instructions.
- **Domain selection:** Use `agent/domain-routing-index.md` then `agent/domain-selection-guide.md`.
- **Retrieval strategy:** Follow `agent/retrieval-guide.md` for optimal knowledge loading.
- **Knowledge Units:** `intelligence/indexes/knowledge-unit-index.md` to locate any KU across all domains.
- **Decision support:** `intelligence/indexes/decision-tree-index.md` for guided engineering decisions.
- **Dependency navigation:** `intelligence/indexes/dependency-index.md` or `intelligence/json/dependencies.json` for cross-domain prerequisites.
- **Rule loading:** `intelligence/indexes/rule-index.md` or `intelligence/json/rules.json` for machine-parseable rule definitions.
- **Checklist execution:** `intelligence/indexes/checklist-index.md` for step-by-step KU checklists.
- **Agent definitions:** `agents/` directory contains specialized agent configurations per domain.
- **Programmatic access:** Use `intelligence/json/` for structured JSON data.
- **Agent configs:** Each `.agent/` directory (`.claude/`, `.cursor/`, `.opencode/`, etc.) contains framework-specific configuration files.

---

*Counts verified against repository filesystem and intelligence JSON data as of 2026-06-04.*
