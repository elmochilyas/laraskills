## Goal
- Generate 07-decision-trees.md files for all KUs in data-storage-systems domain that lack them, completing Phase 7 processing.

## Constraints & Preferences
- Decision trees must follow established format: Decision Context, Decision Criteria, Decision Tree, Recommended Default, Related Rules, Related Skills
- 2-4 decision trees per KU, real engineering choices not workflows
- Cross-reference 05-rules.md and 06-skills.md files
- Preserve existing 07-decision-trees.md files; only process KUs without one

## Progress
### Done
- **connections**: All 16 KUs
- **multi-tenancy**: All 30 KUs
- **partitioning**: All 18 KUs
- **replication**: All 21 KUs
- **sharding**: All 25 KUs

### In Progress
- (last batch written: sharding 6-21 through 6-25 global tables)

### Blocked
- (none)

## Key Decisions
- Follow existing repo DT format

## Next Steps
1. Process **transactions** (9-7 through 9-21, excluding 9-11 which exists): ~13 KUs
2. Process **schema** (1-1 through 1-30, production-schema-operations): ~32 KUs
3. Process **optimization** (4-1 through 4-30): ~35 KUs
4. Process **advanced** (enterprise, mysql 13-1 through 13-27, postgresql 12-1 through 12-40): ~69 KUs
5. Process **queries** (2-21 through 2-30): ~10 KUs

## Critical Context
- Domain location: `<research-workspace-root>/data-storage-systems`
- Total KUs with DTs now: ~160 out of ~279; remaining ~119

## Relevant Files
- `*/04-standardized-knowledge.md`, `*/05-rules.md`, `*/06-skills.md`: source files to read for DT generation in remaining KUs
