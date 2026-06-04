# Anti-Patterns: Milvus (Open-Source Vector DB)

## Metadata

| | |
|---|---|
| **KU ID** | K059 |
| **Subdomain** | vector-similarity-search |
| **Topic** | Milvus (Open-Source Vector DB) |
| **Source** | Milvus Docs |
| **Maturity** | Stable |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Distributed Cluster for Development | Architecture | High |
| 2 | Wrong Index Type for Workload | Performance | High |
| 3 | Strong Consistency for All Workloads | Performance | Medium |
| 4 | Per-Tenant Collections Instead of Partition Keys | Architecture | Medium |
| 5 | Unmonitored Index Build Resource Usage | Reliability | Medium |

## Repository-Wide Anti-Patterns

- **Infrastructure Overhead**: Deploying Milvus (distributed) when pgvector or single-node Qdrant would suffice for the dataset size
- **One-Index-Fits-All**: Using the same index type (IVF/HNSW/DiskANN) for all collections regardless of access patterns
- **Milvus-for-Everything**: Replacing existing PostgreSQL FTS or Scout with Milvus when hybrid search isn't needed

---

## 1. Distributed Cluster for Development

**Category:** Architecture

**Description:** Deploying the full Milvus distributed cluster (storage, broker, index, query nodes) for development and prototyping when standalone mode is sufficient.

**Why It Happens:** Production deployment guides show distributed architecture. Teams replicate this for development to match production. The complexity of managing multiple services is accepted as "what Milvus requires."

**Warning Signs:**
- Docker Compose includes 5+ Milvus services for dev
- Development environment is slow to start and uses significant resources
- Debugging requires checking multiple service logs
- Prototyping velocity is slowed by infrastructure overhead
- Team struggles with Milvus operational complexity before building any search

**Why Harmful:** Distributed Milvus separates storage, indexing, and query into separate nodes for horizontal scaling at 10M+ vectors. For development, standalone mode provides identical API with a single service. Running the full cluster wastes developer time on infrastructure management, slows environment setup, and consumes unnecessary resources.

**Consequences:**
- Slow development environment startup (minutes)
- High resource usage from unnecessary services
- Debugging complexity from multi-service architecture
- Lower prototyping velocity
- Premature infrastructure investment

**Alternative:** Use Milvus standalone for development and testing. Scale to cluster only when production requires horizontal scaling.

**Refactoring Strategy:**
1. Replace distributed Docker Compose with standalone
2. Verify all development workflows work with standalone
3. Keep distributed config for production deployment
4. Document the transition process from standalone to cluster

**Detection Checklist:**
- [ ] Is development using Milvus standalone?
- [ ] Is the distributed config only for production?
- [ ] Does the development environment start in <30 seconds?
- [ ] Is there a documented path from standalone to cluster?

**Related Rules/Skills/Trees:**
- Rule: Start Standalone, Scale to Cluster (`05-rules.md:1-31`)

---

## 2. Wrong Index Type for Workload

**Category:** Performance

**Description:** Using IVF_FLAT for query-speed-critical workloads (should use HNSW) or HNSW for datasets exceeding RAM (should use DiskANN).

**Why It Happens:** Teams default to one index type (usually IVF_FLAT or HNSW) and apply it uniformly. The workload's specific characteristics (query speed requirements, dataset size vs RAM, recall requirements) are not evaluated.

**Warning Signs:**
- Same index type used for all collections
- Query latency is higher than expected for HNSW-capable workloads
- OOM errors during search with HNSW on >RAM datasets
- DiskANN never evaluated for large datasets
- No workload analysis exists for index type choice

**Why Harmful:** Each Milvus index type optimizes for different tradeoffs. IVF_FLAT balances memory and speed. HNSW prioritizes query speed at higher memory cost. DiskANN enables >RAM datasets using SSDs. Using the wrong type degrades performance: HNSW on >RAM datasets causes OOM, IVF_FLAT for speed-critical queries leaves performance on the table.

**Consequences:**
- Query latency 2-10× higher than achievable
- OOM crashes from HNSW on large datasets
- Index build times unnecessarily long
- Inability to scale dataset within available RAM

**Alternative:** Choose index type based on workload: HNSW for query speed (dataset fits in RAM), IVF_FLAT for balanced performance, DiskANN for >RAM datasets.

**Refactoring Strategy:**
1. Profile workload: query speed requirements, dataset size vs RAM, recall needs
2. Select appropriate index type
3. Drop and rebuild index with new type
4. Benchmark latency and recall
5. Document rationale per collection

**Detection Checklist:**
- [ ] Is index type chosen per collection based on workload?
- [ ] Is dataset size vs RAM evaluated before choosing HNSW?
- [ ] Is DiskANN considered for >RAM datasets?
- [ ] Are query speed requirements documented?

**Related Rules/Skills/Trees:**
- Rule: Choose the Right Index Type for Query Patterns (`05-rules.md:33-65`)

---

## 3. Strong Consistency for All Workloads

**Category:** Performance

**Description:** Using Milvus's strongest consistency level (Strong) for all operations, including search workloads that tolerate eventual consistency, causing unnecessary write throughput reduction.

**Why It Happens:** Developers default to the strongest consistency guarantee for safety. The performance impact of strong consistency is not visible at low write volumes and only surfaces at scale.

**Warning Signs:**
- Consistency level is always "Strong"
- Write throughput is lower than expected
- Search latency is acceptable but write latency is high
- No consistency level evaluation exists
- Application can tolerate stale reads (typical for search)

**Why Harmful:** Strong consistency ensures immediate read-after-write visibility but reduces write throughput by requiring quorum confirms. Search workloads typically tolerate bounded staleness — a few seconds of delay between write and read is acceptable. Using strong consistency unnecessarily caps write throughput and increases infrastructure cost.

**Consequences:**
- Write throughput limited by consistency overhead
- Higher infrastructure costs for same write volume
- No benefit for search workloads that tolerate staleness
- Scaling writes requires more nodes than necessary

**Alternative:** Use BoundedStaleness for search workloads. Reserve Strong consistency for use cases requiring immediate read-after-write consistency.

**Refactoring Strategy:**
1. Evaluate application tolerance for stale reads
2. Change consistency to BoundedStaleness for search collections
3. Benchmark write throughput improvement
4. Verify search results are acceptably fresh

**Detection Checklist:**
- [ ] Is consistency level appropriate for each workload?
- [ ] Are search collections using BoundedStaleness or Eventual?
- [ ] Is Strong consistency reserved for write-then-read-critical operations?
- [ ] Was consistency level tuned after initial setup?

**Related Rules/Skills/Trees:**
- Rule: Configure Consistency Level for Multi-Tenant Workloads (`05-rules.md:67-96`)

---

## 4. Per-Tenant Collections Instead of Partition Keys

**Category:** Architecture

**Description:** Creating a separate Milvus collection per tenant instead of using partition keys within a single collection, causing management overhead at scale.

**Why It Happens:** Separate collections seem conceptually cleaner — each tenant has isolated data. Teams start with a few tenants and create one collection each. As tenants grow to hundreds or thousands, collection management becomes unsustainable.

**Warning Signs:**
- Collection name includes tenant ID
- 100+ collections exist in the Milvus instance
- Each new tenant requires schema creation
- Cross-tenant queries are impossible
- Resource usage is fragmented across many collections

**Why Harmful:** Milvus collections have management overhead: schema definition, index building, release/load operations. With per-tenant collections, adding a tenant requires API calls and resource allocation. Index builds are per-collection, wasting resources when many small collections exist. Cross-tenant analytics or admin queries are impossible without querying all collections.

**Consequences:**
- Excessive collection management operations
- Fragmented index builds (many small indexes)
- Inability to query across tenants
- Higher operational load per tenant added
- Resource inefficiency

**Alternative:** Use a single collection with a partition key (tenant_id). Milvus routes queries to the relevant partition automatically.

**Refactoring Strategy:**
1. Create a single collection with tenant_id as partition key
2. Migrate data from per-tenant collections into single collection
3. Update query code to filter by tenant_id
4. Drop per-tenant collections
5. Verify query isolation between tenants

**Detection Checklist:**
- [ ] Is a single collection used with partition keys?
- [ ] Are per-tenant collections avoided?
- [ ] Is tenant_id used as the partition key?
- [ ] Are queries filtered by tenant_id?

**Related Rules/Skills/Trees:**
- Rule: Use Partition Key for Multi-Tenancy (`05-rules.md:98-127`)

---

## 5. Unmonitored Index Build Resource Usage

**Category:** Reliability

**Description:** Triggering Milvus index builds without monitoring CPU and memory, causing production query degradation or OOM during resource-intensive index construction.

**Why It Happens:** Index build is a routine operation (triggered after data ingestion). Teams assume Milvus manages resource allocation automatically. The impact on concurrent query traffic is not monitored.

**Warning Signs:**
- Index builds during business hours
- Query latency spikes during index build
- No monitoring of Milvus node CPU/memory during builds
- OOM events during large index builds
- No resource limits configured for index building

**Why Harmful:** Milvus index building is CPU and memory intensive. Unmonitored builds can consume all available resources, starving query traffic. In containerized environments, this can trigger OOM kills. The impact on user-facing search can be severe and is hard to attribute to the index build without monitoring.

**Consequences:**
- Query latency spikes during index builds
- OOM crashes from memory exhaustion
- Cascading service disruption
- Hard-to-diagnose intermittent performance issues

**Alternative:** Monitor resource usage during index builds. Schedule builds during low-traffic periods. Configure resource limits (`index_building_max_cpu_ratio`).

**Refactoring Strategy:**
1. Enable monitoring for Milvus node CPU and memory
2. Track resource usage during index builds
3. Schedule builds during low-traffic windows
4. Configure index build resource limits
5. Set up alerts for resource exhaustion during builds

**Detection Checklist:**
- [ ] Is CPU/memory monitored during index builds?
- [ ] Are builds scheduled during low traffic?
- [ ] Are resource limits configured for index building?
- [ ] Are alerts in place for resource exhaustion?

**Related Rules/Skills/Trees:**
- Rule: Monitor Index Build Resources (`05-rules.md:129-158`)
