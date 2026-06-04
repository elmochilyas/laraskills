# ECC Retrieval Core API

## Overview

The retrieval core exposes a stable public API suitable for direct use by AI coding agents, custom tooling, and future MCP adapter integration.

All functions are exported from `src/retrieval/index.mjs`.

## Import

```javascript
import {
  retrieveContext,
  searchKnowledge,
  getKnowledgeUnit,
  getPrerequisites,
  getRelatedTopics,
  validateIntelligence,
  retrieveAndFormat,
} from './src/retrieval/index.mjs';
```

---

## `retrieveContext(rawQuery, options)`

Retrieve a full ECC context bundle for a task.

**Parameters:**
- `rawQuery` (string) — Natural language task description
- `options` (object) — Retrieval options

**Options:**

| Field | Type | Default | Description |
|---|---|---|---|
| `mode` | string | `'standard'` | `'compact'`, `'standard'`, or `'deep'` |
| `eccRoot` | string | `process.cwd()` | Path to ECC repository root |
| `explicitEccRoot` | string | `null` | Explicit root path override |
| `maxKus` | number | 10 | Max knowledge units |
| `maxRules` | number | 5 | Max rules |
| `maxSkills` | number | 5 | Max skills |
| `maxRelated` | number | 5 | Max related topics |
| `maxPrerequisites` | number | 5 | Max prerequisites |
| `prerequisiteDepth` | number | 1 | Graph expansion depth |
| `relatedDepth` | number | 1 | Graph expansion depth |
| `budget` | number | 4096 | Token budget |
| `domain` | string | `null` | Domain filter |

**Returns:**
```javascript
{
  bundle: {
    query: string,
    mode: string,
    selectedDomains: Array<{ id, name, score, reason }>,
    knowledgeUnits: Array<{ id, domain, subdomain, name, difficulty, score, breakdown, directory, sourcePath }>,
    rules: Array<{ id, domain, summary, sourcePath, forKuId }>,
    skills: Array<{ id, domain, summary, sourcePath, forKuId }>,
    decisionTrees: Array<{...}>,
    antiPatterns: Array<{...}>,
    checklists: Array<{...}>,
    prerequisites: Array<{ id, sourceKuId, reason, depth }>,
    relatedTopics: Array<{ id, sourceKuId, reason, depth }>,
    externalConcepts: Array<{ id, name, reason }>,
    warnings: string[],
    estimatedTokens: number,
    explanation: { appliedAliases, rankingSummary }
  },
  explanation: object,
  catalog: object
}
```

---

## `searchKnowledge(rawQuery, options)`

Search for knowledge units matching a query.

**Parameters:**
- `rawQuery` (string) — Search query
- `options` (object)

**Options:**

| Field | Type | Default | Description |
|---|---|---|---|
| `limit` | number | 20 | Max results |
| `domain` | string | `null` | Domain filter |
| `eccRoot` | string | `process.cwd()` | ECC root path |
| `explicitEccRoot` | string | `null` | Explicit root override |

**Returns:**
```javascript
Array<{
  id: string,
  ku: object,
  score: number,
  breakdown: Array<{ signal, value, detail }>,
  domain: string,
  subdomain: string,
  summary: string
}>
```

---

## `getKnowledgeUnit(id, options)`

Get detailed metadata for a single knowledge unit.

**Parameters:**
- `id` (string) — Canonical KU ID (e.g., `"security-identity-engineering/authentication/sanctum-spa-authentication"`)
- `options` (object)

**Returns:**
```javascript
{
  metadata: {
    id, domain, subdomain, knowledge_unit, difficulty,
    directory, has_skills, has_rules, has_checklists,
    has_decision_trees, has_anti_patterns
  },
  detail: string  // Formatted Markdown detail
} | null
```

---

## `getPrerequisites(id, options)`

Get the prerequisite chain for a knowledge unit.

**Parameters:**
- `id` (string) — Canonical KU ID
- `options` (object) — `{ depth, limit }`

**Returns:**
```javascript
Array<{
  id: string,
  sourceKuId: string,
  reason: string,
  depth: number,
  evidencePaths: string[]
}>
```

---

## `getRelatedTopics(id, options)`

Get related topics for a knowledge unit.

**Parameters:**
- `id` (string) — Canonical KU ID
- `options` (object) — `{ depth, limit }`

**Returns:**
```javascript
Array<{
  id: string,
  sourceKuId: string,
  reason: string,
  depth: number,
  evidencePaths: string[]
}>
```

---

## `validateIntelligence(options)`

Validate the structural integrity of the intelligence layer.

**Returns:**
```javascript
{
  valid: boolean,
  knowledgeUnitCount: number,
  dependencyEdgeCount: number,
  relationshipEdgeCount: number,
  aliasesCount: number,
  externalConceptsCount: number,
  issues: string[]
}
```

---

## `retrieveAndFormat(rawQuery, options)`

Convenience function: retrieve + format in one call.

**Parameters:** Same as `retrieveContext`, plus `format` option.

**Options:**
- `format` (string) — `'markdown'` or `'json'`

**Returns:** Formatted string.

---

## MCP Adapter Boundary

A future MCP server must:
1. Import from `src/retrieval/index.mjs`
2. Call the exported functions with query parameters from MCP tool requests
3. Return the results formatted as MCP tool responses

The adapter should be a thin wrapper with no additional retrieval logic. All business logic lives in the core.
