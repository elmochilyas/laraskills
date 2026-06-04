| Metadata | |
|---|---|
| Knowledge Unit ID | ku-04 |
| Subdomain | full-text-search-engines |
| Topic | Database Full-Text vs Dedicated |
| Source | Laravel Scout / Community |
| Maturity | Stable |

## Overview

Scout offers two zero-infrastructure engines (database and collection) alongside three dedicated engine integrations (Meilisearch, Typesense, Algolia). The database engine leverages MySQL FULLTEXT or PostgreSQL GIN indexes. The collection engine uses PHP in-memory filtering. Dedicated engines run as separate servers. This KU compares when to use each approach.

## Core Concepts

- **Database Engine**: Uses MySQL FULLTEXT/PostgreSQL FTS with SearchUsingFullText/SearchUsingPrefix attributes
- **Collection Engine**: In-memory PHP filtering via Str::is() — development only
- **Dedicated Engines**: Separate search server (Meilisearch, Typesense, Algolia)
- **Scout Abstraction**: Same API regardless of engine, enabling gradual migration

## When To Use

- **Database Engine**: <50K records, MySQL/PostgreSQL, simple search, zero infrastructure
- **Collection Engine**: Local development, testing, CI environments only
- **Dedicated Engine**: >50K records, need typo tolerance, faceting, relevance tuning, production scale

## When NOT To Use

- **Database Engine**: >100K high-traffic, need typo tolerance, faceted search
- **Collection Engine**: Any production use (documented as dev-only)
- **Dedicated Engine**: Sub-5K record apps where cost/ops overhead not justified

## Best Practices

1. **Start with database engine** for new projects: zero cost, zero ops.
2. **Use SearchUsingFullText and SearchUsingPrefix**: Makes database engine production-viable.
3. **Migrate to dedicated engine** when hitting scale limits or needing features.
4. **Never use collection engine in production** — done explicitly for dev.
5. **Plan migration path early**: Index settings differ per engine.

## Architecture Guidelines

| Decision | <10K records | 10K-100K records | >100K records |
|---|---|---|---|
| Infrastructure | Database engine | Database engine (with attrs) | Dedicated engine |
| Features needed | Basic search | Full-text + prefix | Typo + faceting + ranking |
| Ops cost | None | None | Search server or cloud |
| REINDEX overhead | Minimal | Moderate | Managed by engine |

## Performance Considerations

- Database engine: 10-100ms on indexed columns at 1M rows, competes with OLTP
- Collection engine: O(n) — 2-10 seconds on 50K records, memory intensive
- Dedicated engines: Sub-50ms at any scale, isolated infrastructure
- Database engine writes are slowed by FULLTEXT/GIN index maintenance

## Security Considerations

- Database engine: Search queries add load to main database (DoS risk)
- Dedicated engine: API key management, network-level access control
- Collection engine: Not applicable (dev only)
- All engines: Validate and sanitize user search input

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using collection engine in production | SCOUT_DRIVER not set | Memory exhaustion, slow queries | Set SCOUT_DRIVER=database |
| Database engine without FULLTEXT index | No migration step | LIKE fallback, poor performance | Add index + SearchUsingFullText |
| Migrating to dedicated too early | Feature envy | Unnecessary cost | Start with database engine |
| Not planning migration | Assume engine lock-in | Painful switch later | Use Scout abstraction from start |

## Anti-Patterns

- **Running collection engine in production**: Explicitly documented as dev-only
- **Expecting dedicated engine features from database engine**: Know the limitations
- **Over-engineering with dedicated engine for tiny apps**: Database engine works well
- **Skipping Scout abstraction**: Makes future migration harder

## Examples

`php
// config/scout.php
// Database engine (start here)
SCOUT_DRIVER=database

// Later, switch to Meilisearch
SCOUT_DRIVER=meilisearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_KEY=search-key
`

## Related Topics

- K002 (Scout database engine)
- K003 (Scout collection engine)
- K023 (Meilisearch driver setup)
- K033 (Typesense driver setup)
- K018 (Algolia driver setup)

## AI Agent Notes

- The database engine is severely underutilized — for many apps it eliminates search infrastructure
- Migration from database to dedicated engine is a common Laravel application scaling pattern
- Collection engine is only for dev — always set SCOUT_DRIVER in production env
- For agents: recommend starting with database engine, benchmark before migrating

## Verification

- [ ] Current dataset size and growth rate measured
- [ ] Database engine tested with SearchUsingFullText/prefix
- [ ] Decision documented: why this engine choice
- [ ] Migration path documented if using database engine
- [ ] SCOUT_DRIVER correctly set per environment
- [ ] Collection engine not used in production
