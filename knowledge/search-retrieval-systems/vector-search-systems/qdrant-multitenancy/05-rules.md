---
## Rule Name
Use Payload-Based Partitioning for Multi-Tenancy

## Category
Architecture

## Rule
Use a single Qdrant collection with tenant_id payload filtering for multi-tenant vector search; avoid per-tenant collections.

## Reason
Single collection with payload filtering is more resource-efficient (better segment merging) and scales better to many tenants.

## Bad Example
```python
# Per-tenant collections — management overhead
for tenant in tenants:
    client.create_collection(f"products_{tenant.id}", ...)
```

## Good Example
```python
# Single collection with tenant_id filter
client.search(
    collection_name="products",
    query_vector=vector,
    query_filter=models.Filter(
        must=[models.FieldCondition(key="tenant_id", match=models.MatchValue(value=tenant_id))]
    )
)
```

## Exceptions
Compliance requirements demanding physical data separation per tenant.

## Consequences Of Violation
Excessive collection count, inefficient segment management, and higher operational overhead.

---
## Rule Name
Always Enforce tenant_id Filter

## Category
Security

## Rule
Always include the tenant_id filter in every Qdrant search query; never allow unfiltered queries that return cross-tenant data.

## Reason
Without enforced tenant filtering, a query returns vectors from all tenants, leaking sensitive data.

## Bad Example
```python
# No tenant filter — returns all tenants' data
client.search(collection_name="products", query_vector=vector)
```

## Good Example
```python
client.search(
    collection_name="products",
    query_vector=vector,
    query_filter=models.Filter(
        must=[models.FieldCondition(key="tenant_id", match=models.MatchValue(value=current_tenant_id))]
    )
)
```

## Exceptions
Single-tenant applications.

## Consequences Of Violation
Cross-tenant data leakage, privacy violation, and potential compliance breach.

---
## Rule Name
Create Payload Index on tenant_id

## Category
Performance

## Rule
Always create a payload index on the `tenant_id` field for faster filtered searches.

## Reason
Without a payload index, tenant filtering requires scanning all points' payloads, slowing queries.

## Bad Example
```python
# No payload index — slow filtered searches
client.search(collection_name="products", ...)
```

## Good Example
```python
client.create_payload_index(
    collection_name="products",
    field_name="tenant_id",
    field_type=models.PayloadSchemaType.KEYWORD
)
```

## Exceptions
Very small collections (<10K points) where scan performance is acceptable.

## Consequences Of Violation
Increasing query latency as tenant data grows.

---
## Rule Name
Test Filter Selectivity for Tenant Isolation

## Category
Testing

## Rule
Always test that tenant_id filters are highly selective and tenant isolation is enforced.

## Reason
Non-selective tenant filters may return insufficient results. Untested isolation risks cross-tenant data leakage.

## Bad Example
```python
# No testing — assuming tenant filter works
# Leak undetected
```

## Good Example
```python
# Test cross-tenant isolation
tenant_a_results = search_as_tenant('A')
tenant_b_results = search_as_tenant('B')
assert tenant_a_results->intersects(tenant_b_results) === false
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Cross-tenant data exposure and undetected security breach.
