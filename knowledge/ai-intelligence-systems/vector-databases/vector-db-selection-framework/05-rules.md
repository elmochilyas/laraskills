## Start with pgvector by Default
---
## Category
Architecture
---
## Rule
Choose pgvector as the default vector database for new projects when PostgreSQL is part of the stack; add Qdrant or Pinecone only when specific requirements justify the additional infrastructure.
---
## Reason
pgvector adds zero operational complexity — it runs on existing PostgreSQL with ACID transactions, hybrid search, and familiar tooling. It handles up to 50M vectors efficiently. Separate vector databases add infrastructure cost, operational burden, and migration risk.
---
## Bad Example
```php
// Reaching for Pinecone without evaluating pgvector first
'vector_store' => 'pinecone', // $70+/month + operational complexity
```
---
## Good Example
```php
// Default to pgvector, re-evaluate when approaching scale limits
'vector_store' => 'pgvector',
```
---
## Exceptions
Projects without PostgreSQL (e.g., SQLite-only deployments, MongoDB-centric stacks) or those exceeding 50M vectors may choose Qdrant or Pinecone from the start.
---
## Consequences Of Violation
Unnecessary infrastructure complexity, higher costs, operational overhead for features not yet needed.

## Build a Driver Abstraction Layer from Day One
---
## Category
Maintainability
---
## Rule
Implement a repository or interface pattern (`VectorStoreInterface`) for vector operations; never write vector DB-specific code directly in application logic.
---
## Reason
Vector database migration is expensive — it requires re-embedding all data. A driver abstraction makes migration possible without rewriting application code. Even if migration is not planned, the abstraction simplifies testing (use SQLite-vec for tests) and provides flexibility.
---
## Bad Example
```php
// Direct pgvector syntax — locked in
Chunk::whereVectorSimilarTo('embedding', $embedding)->get();
```
---
## Good Example
```php
// Interface-based — swappable implementation
interface VectorStoreInterface {
    public function search(VectorQuery $query): VectorResultSet;
}
class PgVectorStore implements VectorStoreInterface { /* ... */ }
```
---
## Exceptions
Projects that are fully committed to pgvector and accept the migration cost may use native Laravel syntax for simplicity.
---
## Consequences Of Violation
Cannot migrate vector databases without rewriting all query code, vendor lock-in, testing complexity.
