---
## Rule Name
Use Managed Services for Production Deployments

## Category
Architecture

## Rule
Prefer managed vector search services (Pinecone, Qdrant Cloud, pgvector on managed PostgreSQL) for production rather than self-hosting.

## Reason
Managed services handle scaling, backup, monitoring, and disaster recovery — reducing operational burden significantly.

## Bad Example
```bash
# Self-hosted Qdrant — ops burden, scaling, and DR responsibility
docker run -d qdrant/qdrant
```

## Good Example
```bash
# Qdrant Cloud — managed infrastructure
# Configure cloud cluster with desired size
# Provider handles scaling, backup, and DR
```

## Exceptions
Compliance requirements (data residency, air-gapped environments) requiring self-hosting.

## Consequences Of Violation
Increased operational overhead, risk of data loss from incomplete backups, and difficulty scaling.

---
## Rule Name
Plan RAM Sizing for Vectors Plus Index Overhead

## Category
Scalability

## Rule
Always size RAM for 1.5-2x the raw vector storage cost when using HNSW indexes.

## Reason
HNSW graph structures add significant memory overhead. Under-sizing RAM causes OOM or swapping during queries.

## Bad Example
```bash
# 10M vectors × 1536 dims × 4 bytes = ~60GB
# Provisioning 64GB host — insufficient for HNSW overhead
```

## Good Example
```bash
# 60GB vectors + 30-60GB HNSW overhead = 90-120GB
# Provision 128GB host with headroom
```

## Exceptions
Using IVFFlat (lower overhead) or exact search (no index overhead).

## Consequences Of Violation
Production OOM crashes during index builds or peak query load.

---
## Rule Name
Establish an Index Refresh Strategy

## Category
Reliability

## Rule
Always define and document an index rebuild strategy for production ANN indexes.

## Reason
ANN indexes degrade in quality over time as vectors are inserted/updated. Regular rebuilding maintains recall quality.

## Bad Example
```bash
# No rebuild strategy — recall degrades silently over months
```

## Good Example
```php
// Weekly full rebuild via schedule
$schedule->call(function () {
    DB::statement('REINDEX INDEX items_embedding_idx');
    Log::info('Vector index rebuilt');
})->weekly();
```

## Exceptions
Read-only datasets that never change after initial indexing.

## Consequences Of Violation
Gradual and undetected search quality degradation over time.

---
## Rule Name
Backup Source Data for Embedding Regeneration

## Category
Reliability

## Rule
Always backup the source text/content from which embeddings are generated, not just the vectors themselves.

## Reason
Vector backups alone may be tied to a specific embedding model version. Source data allows re-embedding with any model version after a model change.

## Bad Example
```bash
# Backing up vectors only
pg_dump -t items > items_backup.sql
# Model changes — old vectors incompatible
```

## Good Example
```bash
# Backing up source content
pg_dump -t items > items_with_content_backup.sql
# Can regenerate embeddings on any model
```

## Exceptions
Embedding model frozen and never changing.

## Consequences Of Violation
Inability to upgrade embedding models without losing existing search capabilities.
