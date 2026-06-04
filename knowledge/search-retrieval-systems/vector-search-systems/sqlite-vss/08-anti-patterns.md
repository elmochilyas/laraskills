# Anti-Patterns: SQLite VSS

## Metadata

| | |
|---|---|
| **KU ID** | ku-06 |
| **Subdomain** | vector-similarity-search |
| **Topic** | SQLite VSS |
| **Source** | SQLite VSS docs |
| **Maturity** | New |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | SQLite VSS in Production | Architecture | High |
| 2 | Mismatched Schema Between Test and Production | Testing | Medium |
| 3 | Production-Level Dependence on SQLite VSS | Architecture | Medium |

## Repository-Wide Anti-Patterns

- **SQLite-in-Production**: Using SQLite VSS as a production vector store when the application uses MySQL/PostgreSQL
- **Dimension Drift**: Different vector dimensions in SQLite VSS tests vs production pgvector, causing silent test failures

---

## 1. SQLite VSS in Production

**Category:** Architecture

**Description:** Using SQLite VSS as the production vector store for a Laravel application that uses MySQL or PostgreSQL as its primary database.

**Why It Happens:** SQLite VSS is easy to set up and works during development. Teams may default to it in production if they lack experience with pgvector or dedicated vector databases.

**Warning Signs:**
- Production database is MySQL/PostgreSQL but vector search uses SQLite VSS
- Two database connections: one for app data, one for vectors
- Write contention issues under production load
- Concurrency problems with multiple users

**Why Harmful:** SQLite is single-writer and not designed for concurrent production web workloads. Vector search queries compete with writes, causing contention. SQLite VSS lacks the performance, scalability, and reliability features of pgvector or dedicated vector databases.

**Consequences:**
- Write contention under concurrent load
- Production stability issues (SQLite corruption risk)
- Inability to scale horizontally
- Missing vector search features (filtered ANN, quantization)

**Alternative:** Use pgvector if on PostgreSQL, or a dedicated vector database (Qdrant, Pinecone) for production.

**Refactoring Strategy:**
1. Set up production vector store (pgvector/Qdrant/Pinecone)
2. Migrate vectors and code
3. Keep SQLite VSS only for development testing

**Detection Checklist:**
- [ ] Is production vector store pgvector/Qdrant/Pinecone?
- [ ] Is SQLite VSS only used in development/testing?

**Related Rules/Skills/Trees:**
- Rule: Use SQLite VSS for Development Only (`05-rules.md:1-31`)

---

## 2. Mismatched Schema Between Test and Production

**Category:** Testing

**Description:** Using different vector dimensions or distance metrics in SQLite VSS test schema than production pgvector schema.

**Why It Happens:** SQLite VSS and pgvector have different schema syntax. Developers write test schemas independently without cross-referencing production values.

**Warning Signs:**
- SQLite VSS has different embedding dimensions than production
- Distance metric differs between test and production
- Tests pass but vector behavior differs in production

**Why Harmful:** Tests verify vector search logic with different parameters than production, so they don't catch production issues. A 512-dim test vs 1536-dim production means tests measure different behavior entirely.

**Consequences:**
- False confidence from passing tests
- Production bugs undetected in CI

**Alternative:** Match SQLite VSS test schema dimensions and metric exactly to production.

**Refactoring Strategy:**
1. Read production vector dimension from config
2. Use same config value in test schema creation

**Detection Checklist:**
- [ ] Do test and production use same dimensions?
- [ ] Do test and production use same distance metric?

**Related Rules/Skills/Trees:**
- Rule: Match SQLite VSS Schema to Production (`05-rules.md:33-63`)
