# Decomposition: 1.13 Spirit tool (gh-ost successor for MySQL 8.0+)

## Topic Overview
Spirit is a modern online schema migration tool for MySQL 8.0+, designed as a successor to gh-ost. It uses the same binlog-based, trigger-free approach but is built specifically for MySQL 8.0+ features (better performance schema, improved binlog handling). Developed to address gh-ost's limitations with newer MySQL versions and larger datasets.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-13-spirit-tool/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.13 Spirit tool (gh-ost successor for MySQL 8.0+)
- **Purpose:** Spirit is a modern online schema migration tool for MySQL 8.0+, designed as a successor to gh-ost. It uses the same binlog-based, trigger-free approach but is built specifically for MySQL 8.0+ features (better performance schema, improved binlog handling).
- **Difficulty:** Advanced
- **Dependencies:** 1.11 gh-ost tool, 1.12 pt-online-schema-change, 1.10 Zero-downtime migration patterns

## Dependency Graph
**Depends on:** "1.11 gh-ost tool", "1.12 pt-online-schema-change", "1.10 Zero-downtime migration patterns"

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **MySQL 8.0+ focus**: Built for and tested on MySQL 8.0+ only. Leverages MySQL 8.0's improved performance schema for throttling feedback.; - **Binlog-based, trigger-free**: Same architecture as gh-ost — no triggers, reads binary log for change capture.; - **Improved cut-over**: Faster, more reliable atomic swap than gh-ost in high-concurrency environments.; - **Built-in throttling**: Performance schema-based metrics for more accurate self-regulation..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization