# Decision Trees for 1-6 Migration Ordering Naming Conventions

## Metadata

| Field | Value |
|-------|-------|
| ID | 1-6 |
| Title | Migration Ordering Naming Conventions |
| Decision Type | Schema Design & Migration Engineering |

## Decision Inventory

- D1: Migration naming convention selection
- D2: Timestamp collision resolution strategy
- D3: FK dependency ordering approach
- D4: Migration grouping vs independent deployment

## Architecture-Level Decision Trees

### D1: Migration naming convention selection

**Decision Context**: Choose a naming pattern that encodes migration purpose while maintaining deterministic ordering.

**Criteria**:
- Verb prefix (create_, alter_, add_, drop_)
- Descriptive name granularity
- Team scale and migration volume
- CI automation requirements

**Tree**:
```
Is FK dependency ordering needed?
├── Yes
│   └── Use verb prefix + target table + description
│       (e.g., "create_authors_table", "add_biography_to_authors_table")
└── No
    └── Fewer than 20 migrations?
        ├── Yes → Simple descriptive name
        └── No → Verb prefix convention
```

**Rationale**: Verb prefix naming provides immediate intent understanding from filename alone, critical for teams with 20+ migrations. The pattern `timestamp_action_target_description` enables grep-based discovery and automated ordering verification.

**Default**: Verb prefix convention with snake_case table names: `create_authors_table`, `add_column_to_table`.

**Risks**:
- Renaming migration after deployment breaks rollback
- Generic names like "some_changes" become unsearchable at scale

**Related Rules/Skills**: 1-6-1 (always encode intent in name), 1-6-2 (never rename deployed migrations)

---

### D2: Timestamp collision resolution strategy

**Decision Context**: Two developers create migrations at the same second, causing unpredictable ordering.

**Criteria**:
- Team size and concurrent migration frequency
- CI merge timing
- Rollback reliability requirements

**Tree**:
```
Are concurrent migrations expected?
├── No → Default Laravel timestamp (HHiiss) is sufficient
└── Yes
    ├── Use manual second offset per developer
    │   (e.g., dev A: :00, dev B: :05, dev C: :10)
    └── Use CI-based timestamp override on merge
        (re-timestamp migrations during merge pipeline)
```

**Rationale**: Default timestamps work for solo or low-concurrency teams. At scale, intentional timestamp spacing or CI automation prevents ordering ambiguity. Manual offsets are simpler but require team discipline.

**Default**: Default Laravel timestamp generation with `migrate:status` verification after each merge.

**Risks**:
- Duplicate timestamps cause non-deterministic ordering
- Manual offset discipline degrades under pressure

**Related Rules/Skills**: 1-6-3 (verify ordering with migrate:status)

---

### D3: FK dependency ordering approach

**Decision Context**: A migration references a foreign key pointing to a table that must exist first.

**Criteria**:
- Number of cross-table FK references
- Circular dependency presence
- Squash strategy

**Tree**:
```
Do migrations have circular FK dependencies?
├── Yes
│   └── Defer FK addition to separate migration
│       (create tables first, add FK in subsequent migration)
└── No
    ├── Adjust timestamp: referenced table runs before referencing
    └── Use service-level integrity (no DB FK, enforce in app)
```

**Rationale**: FK ordering failures (`1215 Cannot add foreign key constraint`) are the most common migration ordering issue. Explicit timestamp ordering or deferred FK addition resolves this. Circular dependencies require deferred FK pattern, not timestamp manipulation.

**Default**: Adjust timestamps so referenced table migrations precede referencing table migrations.

**Risks**:
- Circular dependencies can't be resolved with timestamp manipulation alone
- Deferred FK addition means temporary window without constraint enforcement

**Related Rules/Skills**: 1-4 (foreign key definition), 1-6-4 (reference tables before referencing)

---
