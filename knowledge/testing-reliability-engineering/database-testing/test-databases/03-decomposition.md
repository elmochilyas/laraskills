# Decomposition: Test Databases

## Topic Overview
Testing environment management controls configuration, database, drivers, and services used during test execution. Proper environment management prevents accidental production service usage and ensures deterministic test behavior.

## Decomposition Strategy
This knowledge unit breaks down into four areas: (1) environment file configuration and layering, (2) database strategy (local vs CI), (3) service nullification patterns, and (4) per-test environment overrides.

## Proposed Folder Structure
```
ku-04-test-databases/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory
| Component | Type | Description |
|-----------|------|-------------|
| `.env.testing` configuration | concept | Test-specific environment file with null drivers |
| Configuration layering | concept | `.env` -> `.env.testing` -> `phpunit.xml` -> per-test override |
| Database engine strategy | practice | SQLite locally, MySQL/PostgreSQL in CI |
| Null driver patterns | practice | Setting null/log drivers for all external services |
| `Env::fake()` | practice | Per-test environment overrides |
| Testing service provider | practice | Binding null implementations for third-party services |
| Parallel database isolation | practice | Process-specific database naming with `ParallelTesting::token()` |

## Dependency Graph
```
Test Databases
├── Requires: Laravel environment configuration basics
├── Depends on: PHPUnit configuration (phpunit.xml, APP_ENV=testing)
├── Related: Database testing lifecycle
├── Related: Null driver pattern
└── Related: Parallel test execution
```

## Boundary Analysis
This KU focuses on test environment configuration and does not cover database-specific testing (assertions, migrations, query testing), which is covered in other KUs under the Database Testing subdomain.

## Future Expansion Opportunities
- CI-specific database configuration matrix
- Docker-based testing environment setup
- Environment-aware service provider patterns
- Testing service provider catalog for common third-party services
