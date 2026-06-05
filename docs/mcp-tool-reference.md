# MCP Tool Reference

All five tools are registered via `@modelcontextprotocol/sdk/server/mcp.js` `McpServer.registerTool(...)` with:

- `title` — short label
- `description` — concise one-paragraph description
- `inputSchema` — strict Zod schema
- `outputSchema` — strict Zod schema (for `structuredContent` validation)
- `annotations.readOnlyHint = true`
- `annotations.destructiveHint = false`
- `annotations.idempotentHint = true`
- `annotations.openWorldHint = false`

All tools return `{ content: [{ type: 'text', text: '...' }], structuredContent: { ... } }` on success, or `{ isError: true, content: [{ type: 'text', text: '...' }] }` on failure. Tool errors are short actionable strings — no stack traces.

---

## 1. `retrieve_context_bundle`

Return the smallest useful Laravel ECC context bundle for a task.

### Input

```jsonc
{
  "task": "Build a multi-tenant REST API with Sanctum and queued notifications",  // required, string
  "mode": "compact",      // optional, enum: compact|standard|deep, default: standard
  "max_kus": 10,          // optional, integer 1..50, default: 10
  "max_rules": 10,        // optional, integer 0..50, default: 10
  "max_skills": 6,        // optional, integer 0..50, default: 6
  "max_related": 6,       // optional, integer 0..50, default: 6
  "max_prerequisites": 6, // optional, integer 0..50, default: 6
  "prerequisite_depth": 1,// optional, integer 0..5, default: 1
  "related_depth": 1,     // optional, integer 0..5, default: 1
  "budget": 6000,         // optional, integer 256..200000, default: 6000
  "domain": "security-identity-engineering"  // optional, string
}
```

### Output (`structuredContent`)

| Field | Type | Description |
|-------|------|-------------|
| `query` | string | Echo of the input task |
| `mode` | string | Effective mode used |
| `estimatedTokens` | number | Token count of the bundle |
| `selectedDomains` | array | Ranked domains with reason |
| `knowledgeUnits` | array | Ranked KUs with score, breakdown, sourcePath |
| `rules` | array | Applicable rules per KU |
| `skills` | array | Applicable skills per KU |
| `decisionTrees` | array | Optional, mode-dependent |
| `antiPatterns` | array | Optional, mode-dependent |
| `checklists` | array | Validation checklists |
| `prerequisites` | array | Prerequisite KUs with reason/depth |
| `relatedTopics` | array | Related KUs with reason/depth |
| `externalConcepts` | array | External concepts referenced by selected KUs |
| `warnings` | array | Bundle warnings (e.g. truncation) |
| `explanation` | object | `appliedAliases` and `rankingSummary` |

### Errors

- Invalid input: Zod validation error returned by SDK.
- Missing intelligence: `isError: true` with the actionable `ECC intelligence files were not found` message.

---

## 2. `search_ecc`

Search the ECC knowledge unit catalog.

### Input

```jsonc
{
  "query": "Sanctum tenant authentication", // required, string
  "limit": 10,                              // optional, integer 1..100, default: 10
  "domain": "security-identity-engineering" // optional, string
}
```

### Output

| Field | Type | Description |
|-------|------|-------------|
| `query` | string | Echo of the input query |
| `count` | number | Number of results returned |
| `results[].id` | string | Canonical KU ID |
| `results[].score` | number | Ranking score (descending) |
| `results[].domain` | string | Domain ID |
| `results[].subdomain` | string | Subdomain |
| `results[].name` | string | KU name |
| `results[].breakdown[]` | array | Score signals with value + detail |
| `results[].sourcePath` | string | Path to the KU's `04-standardized-knowledge.md` |

### Errors

- Empty query: Zod validation error.
- Missing intelligence: actionable isError.

---

## 3. `get_knowledge_unit`

Inspect one canonical knowledge unit by ID.

### Input

```jsonc
{
  "id": "security-identity-engineering/authentication/passport-vs-sanctum",  // required, string
  "include_content": false,    // optional, boolean, default: false
  "artifact_types": [          // optional, default: all six
    "knowledge",
    "rules",
    "skills",
    "decision_trees",
    "anti_patterns",
    "checklists"
  ]
}
```

### Output

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Echo of the input ID |
| `metadata.id` | string | Canonical KU ID |
| `metadata.domain` | string | Domain |
| `metadata.subdomain` | string | Subdomain |
| `metadata.knowledge_unit` | string | KU name |
| `metadata.difficulty` | string | Difficulty level |
| `metadata.directory` | string | Source directory |
| `metadata.has_*` | boolean | Per-artifact availability |
| `artifact_summaries[]` | array | One entry per requested artifact type with `available` + `source_file` |
| `content` | string | Optional, only if `include_content: true` |
| `detail` | string | Formatted Markdown detail |

### Errors

- Unknown ID: `isError: true` with `Knowledge unit not found: <id>`.
- Missing intelligence: actionable isError.

---

## 4. `get_graph_context`

Return prerequisites and related topics for a knowledge unit in a single call.

### Input

```jsonc
{
  "id": "data-storage-systems/indexes/b-tree-index-structure", // required, string
  "prerequisite_depth": 1,   // optional, integer 0..5, default: 1
  "related_depth": 1,        // optional, integer 0..5, default: 1
  "max_prerequisites": 10,   // optional, integer 0..100, default: 10
  "max_related": 10          // optional, integer 0..100, default: 10
}
```

### Output

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Echo of the input ID |
| `prerequisites[]` | array | Prerequisite nodes with `id`, `sourceKuId`, `reason`, `depth`, `strength` |
| `relatedTopics[]` | array | Related nodes with `id`, `sourceKuId`, `reason`, `depth` |
| `totalPrerequisitesFound` | number | Total prerequisites discovered (before max) |
| `totalRelatedFound` | number | Total related topics discovered (before max) |
| `truncated` | boolean | True if the result was truncated by max limits |

### Errors

- Unknown ID: `isError: true` with `Knowledge unit not found: <id>`.
- Missing intelligence: actionable isError.

---

## 5. `validate_ecc`

Validate the structural integrity of the ECC intelligence layer.

### Input

```jsonc
{}  // no parameters
```

### Output

| Field | Type | Description |
|-------|------|-------------|
| `valid` | boolean | `true` if no issues, `false` otherwise |
| `knowledgeUnitCount` | number | Canonical KU count (expected: 2321) |
| `dependencyEdgeCount` | number | Dependency edge count (expected: 428) |
| `relationshipEdgeCount` | number | Relationship edge count (expected: 3633) |
| `aliasesCount` | number | Alias mappings |
| `externalConceptsCount` | number | External concept references |
| `cycleCount` | number | Cycles in the prerequisite graph (expected: 0) |
| `selfLoopCount` | number | Self-loops in the prerequisite graph (expected: 0) |
| `danglingEdgeCount` | number | Edges pointing to non-existent KUs (expected: 0) |
| `issues[]` | array | Detailed issues list (empty when `valid: true`) |

### Errors

- Missing intelligence: actionable isError.

---

## Determinism guarantees

- All outputs are sourced from the deterministic retrieval core. No `Date.now()`, `Math.random()`, or non-deterministic ordering.
- The MCP layer adds no ranking logic — it only forwards `structuredContent` returned by the core.
- The `MCP Server — Determinism` test suite verifies that two identical calls return byte-identical `structuredContent`.
