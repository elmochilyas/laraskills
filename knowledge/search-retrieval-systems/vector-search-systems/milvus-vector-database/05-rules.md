---
## Rule Name
Start Standalone, Scale to Cluster

## Category
Architecture

## Rule
Always start with standalone Milvus deployment for development and scale to distributed cluster only when needed.

## Reason
Distributed Milvus (storage, indexing, query nodes) adds significant operational complexity. Standalone is simpler for development and moderate workloads.

## Bad Example
```yaml
# Full distributed cluster for development
docker-compose up milvus-storage milvus-broker milvus-index milvus-query
```

## Good Example
```yaml
# Standalone for development
docker-compose up milvus-standalone
```

## Exceptions
Production deployments requiring horizontal scaling for >10M vectors.

## Consequences Of Violation
Unnecessary operational complexity in development and premature infrastructure investment.

---
## Rule Name
Choose the Right Index Type for Query Patterns

## Category
Performance

## Rule
Select the Milvus index type based on query requirements: IVF for balanced performance, HNSW for query speed, DiskANN for datasets exceeding RAM.

## Reason
Each index type optimizes for different workloads. Wrong index choice degrades either query latency or recall.

## Bad Example
```python
# Same index type for all workloads
index_params = {"index_type": "IVF_FLAT", "metric_type": "COSINE"}
```

## Good Example
```python
# Query-speed critical
index_params = {"index_type": "HNSW", "metric_type": "COSINE", "params": {"M": 16, "efConstruction": 200}}

# Dataset > RAM
index_params = {"index_type": "DISKANN", "metric_type": "COSINE"}
```

## Exceptions
Small datasets (<1M vectors) where index type has negligible performance impact.

## Consequences Of Violation
Suboptimal query latency, excessive memory usage, or poor recall for the workload.

---
## Rule Name
Configure Consistency Level for Multi-Tenant Workloads

## Category
Reliability

## Rule
Always choose the appropriate Milvus consistency level: strong for financial data, bounded staleness for typical search, eventual for high-performance.

## Reason
Strong consistency guarantees accurate reads but reduces write throughput. Wrong choice causes either data inconsistency or performance issues.

## Bad Example
```python
# Always using strong consistency
collection.load(consistency_level="Strong")
```

## Good Example
```python
# Bounded staleness for search workloads
collection.load(consistency_level="BoundedStaleness")
```

## Exceptions
Applications requiring immediate read-after-write consistency.

## Consequences Of Violation
Performance degradation from unnecessary consistency guarantees or data inconsistency from insufficient guarantees.

---
## Rule Name
Use Partition Key for Multi-Tenancy

## Category
Architecture

## Rule
Always use Milvus partition keys to isolate tenant data within a single collection.

## Reason
Per-tenant collections increase management overhead and prevent cross-tenant queries. Partition keys provide logical isolation within one collection.

## Bad Example
```python
# Separate collection per tenant — management nightmare
collection = client.create_collection(f"documents_tenant_{tenant_id}", ...)
```

## Good Example
```python
# Single collection with partition key
schema.add_field("tenant_id", DataType.INT64, is_partition_key=True)
```

## Exceptions
Compliance requirements demanding physical data separation per tenant.

## Consequences Of Violation
Excessive collection management overhead, difficulty scaling to many tenants, and inefficient resource usage.

---
## Rule Name
Monitor Index Build Resources

## Category
Performance

## Rule
Always monitor CPU and memory during Milvus index building; index operations consume significant resources.

## Reason
Index building in Milvus is resource-intensive. Unmonitored builds can starve query traffic or cause OOM in production.

## Bad Example
```bash
# Triggering index build without monitoring
# Production query latency spikes during build
```

## Good Example
```bash
# Schedule index builds during low-traffic periods
# Monitor CPU/memory during build
# Adjust index_building_max_cpu_ratio if needed
```

## Exceptions
Small datasets where index build completes in seconds.

## Consequences Of Violation
Query timeout during index builds, OOM crashes on resource-constrained nodes, and cascading service disruption.
