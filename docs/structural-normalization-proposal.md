# Structural Normalization Proposal

**Generated:** 2026-06-04
**Status:** Proposal only — no directories renamed

---

## Issues Observed

### 1. `_templates` vs `templates`

| Pattern | Occurrences | Domains |
|---------|-------------|---------|
| `_templates/` | 21 domains | All knowledge domains |
| `templates/` | 1 domain | cost-resource-optimization |
| `_assets/` | 1 domain | performance-runtime-engineering |
| `assets/` | 3 domains | real-time-systems, search-retrieval-systems, performance-runtime-engineering |
| `shared/` | 4 domains | devops-infrastructure, platform-engineering, search, security |
| `references/` | 3 domains | async-distributed, cost-resource-optimization, performance-runtime-engineering |

**Recommendation:** Adopt a single convention. `_templates` (underscore-prefixed) appears most consistently.

### 2. Mixed Nesting Depth

Some KUs exist at nesting depth 3 (`domain/subdomain/ku`), others at depth 4 (`domain/subdomain/category/ku`), and others at depth 2 (`domain/ku`).

| Depth | Example | Domains |
|-------|---------|---------|
| 2 (domain/ku) | `weak-reference-api-usage/weak-reference-api-usage/` | weak-reference-api-usage |
| 3 (domain/subdomain/ku) | `ai-intelligence-systems/01-provider-integration/ku-02/` | Most domains |
| 4+ (nested) | `data-storage-systems/advanced/enterprise/14-1-event-store-design/` | data-storage-systems, several others |

**Recommendation:** Standardize to depth 3. Deeply nested KUs at depth 4+ should be reviewed but the cost of migration is high due to cross-references.

### 3. Numbering Inconsistencies

| Pattern | Example Domains |
|---------|-----------------|
| `01-subdomain` format | devops-infrastructure, data-engineering, async-distributed, cost-resource, observability, platform-engineering, real-time, search, security |
| Named subdomains (no numbers) | ai-intelligence, api-integration, backend-architecture, governance, laravel-core, laravel-eloquent, performance |
| Mixed within domain | performance-runtime has `S01-`, `S02-`, `Z0-`, `Z9-` prefixes |
| Non-standard prefixes | `LAP-`, `ku-` prefixes in some sub-KU names |

**Recommendation:** Establish a domain-numbering policy but do NOT apply retroactively. New subdomains should use the `NN-name` convention.

### 4. Root-Level Knowledge Units

`weak-reference-api-usage/` contains a single KU at `weak-reference-api-usage/weak-reference-api-usage/` — effectively a domain containing only one KU with the same name.

**Recommendation:** Evaluate whether this should be a subdomain within `performance-runtime-engineering` (its likely architectural home) or remain as a standalone domain.

### 5. Capitalization and Naming

- Inconsistent use of hyphens vs underscores in directory names
- Some subdomain names use full words, others use abbreviated conventions
- `S04-memory-management-gc` mixes system prefix with descriptive name

---

## Proposed Naming Policy

For future additions:

1. **Auxiliary directories**: `_templates`, `_assets`, `_shared` (underscore prefix)
2. **Subdomain directories**: `NN-descriptive-name` (two-digit number + hyphen + kebab-case)
3. **Knowledge unit directories**: `descriptive-kebab-name` (no numbers unless content requires ordering)
4. **Maximum depth**: `knowledge/{domain}/{subdomain}/{ku}` (3 levels max)
5. **Special prefixes**: Avoid system prefixes (`S01-`, `Z0-`, `LAP-`) — use descriptive names

---

## Migration Risk Assessment

| Change | Risk | Impact | Effort |
|--------|------|--------|--------|
| Rename `templates` → `_templates` | Low | Minimal (no content references) | 1 file move |
| Rename `assets` → `_assets` | Low | Minimal | 3 file moves |
| Standardize depth 4+ KUs | High | All cross-references must be updated | Days |
| Rename numbered subdomains | High | All KU paths and JSON entries change | Days |
| Move weak-reference-api-usage | Medium | JSON, indexes, registry must update | Hours |

---

## Recommendation

**Do NOT apply any structural changes in this phase.** The cost of migration across 2,408 KUs, 7 JSON files, and all index files is high. Structural changes should be deferred to a dedicated normalization phase with approval and rollback planning.

Minor changes (auxiliary directory renames) can be done safely at any time but have minimal practical benefit.
