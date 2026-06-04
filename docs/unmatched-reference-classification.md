# Unmatched Reference Classification

> Phase 10.6 — Graph Quality
> Generated: 2026-06-04
> Total references: 324

## Summary

| Classification | Count | Percentage |
|---|---|---|
| internal-alias | 258 | 79.6% |
| external-prerequisite | 56 | 17.3% |
| parser-noise | 10 | 3.1% |
| potential-missing-ku | 0 | 0.0% |
| invalid-reference | 0 | 0.0% |
| requires-human-review | 0 | 0.0% |

## Classification by Category

### internal-alias — 258 references

These are section-number references (e.g. "1.1 Migration file structure") or K-codes (e.g. "K09") that map to internal Knowledge Units but could not be resolved by the edge-injection script because the names don't match canonical KU slugs.

**208 section-number references** (data-storage-systems domain):
- Pattern: `{subdomain-number}.{ku-number} {KU Title}` (e.g., `3.1 B-Tree index structure`)
- All reference KUs within `data-storage-systems/` using the domain's internal section-numbering scheme
- The script's fuzzy-match heuristic fails because section numbers like `3.1` don't match the canonical slug format `b-tree-index-structure`

**50 K-code references** (real-time-systems domain):
- Pattern: `K{number}` (e.g., `K09`, `K14`, `K27`)
- All reference KUs within `real-time-systems/` using the domain's internal K-code scheme
- The script cannot resolve K-codes to canonical KU slugs

### external-prerequisite — 56 references

These are genuinely external concepts that are valuable background knowledge but are not part of the Laravel ECC Knowledge Unit system.

Key categories:
| Category | Example References |
|---|---|
| Browser/UI Testing | Playwright basics, CSS selectors, HTML/DOM structure, JavaScript/DOM basics |
| HTTP/Protocol | HTTP protocol, HTTP protocol understanding |
| PHP Ecosystem | PHPUnit basics, PHP type system, Composer autoloading, PHP 8+ named arguments |
| Infrastructure | Docker basics, Linux server admin, Nginx/Apache config, Web server config |
| CI/CD | GitHub Actions fundamentals, YAML syntax, CI/CD fundamentals |
| Database | Database design, Database query basics, Database migration patterns |
| Performance | Load testing tools, Code coverage concepts |
| Other | OOP design, WCAG 2.1 understanding, Carbon date library |

### parser-noise — 10 references

These are markdown parsing artifacts captured incorrectly by the script:

| Reference | Source KU |
|---|---|
| `then swap atomically.` | 4 occurrences (mysql-algorithm-lock-options, mysql-instant-ddl, pg-repack, postgresql-lazy-add-column-default) |
| `make)` | testing-reliability-engineering/test-data-management/factory-states-sequences |
| `sessions)` | testing-reliability-engineering/feature-http-testing/auth-testing |
| `Multiple (5-8)` | application-architecture-patterns/service-layer-patterns/service-action-usecase-decision |
| `- **Online DDL tools**: gh-ost...` | 4 occurrences (same as then-swap-atomically files) |

### potential-missing-ku — 0 references

No references were identified as valuable missing Laravel concepts that deserve a new KU. All external concepts are either:
- Generic software engineering knowledge (not Laravel-specific)
- Already covered by related KUs

### invalid-reference — 0 references

All references are valid in intent — they reference real concepts. None are incorrect or fabricated.

### requires-human-review — 0 references

All references could be classified with high confidence.

## Detailed Reference List

See `intelligence/json/_unmatched-debug.json` for the complete machine-readable raw reference list.

For external concepts, see `intelligence/json/external-concepts.json`.
For internal aliases, see `intelligence/json/aliases.json`.
