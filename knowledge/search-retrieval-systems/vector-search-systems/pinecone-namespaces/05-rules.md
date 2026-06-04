---
## Rule Name
Always Include Namespace in Operations

## Category
Maintainability

## Rule
Always specify the namespace parameter on every Pinecone upsert, query, and delete operation.

## Reason
Omitting the namespace defaults to the empty namespace, causing data mixing across tenants or environments.

## Bad Example
```python
client.upsert(index='products', vectors=[...])
# No namespace — goes to default empty namespace
```

## Good Example
```python
client.upsert(index='products', vectors=[...], namespace='tenant_42')
```

## Exceptions
Single-tenant indexes with no partitioning requirement.

## Consequences Of Violation
Cross-tenant data contamination and incorrect query results.

---
## Rule Name
Use Tenant ID as Namespace

## Category
Architecture

## Rule
Use the tenant ID as the Pinecone namespace for multi-tenant SaaS applications.

## Reason
Per-tenant namespaces provide logical isolation within a single index, sharing infrastructure while maintaining data separation.

## Bad Example
```python
# Per-tenant indexes — management overhead
tenant_index = f"products_{tenant_id}"
```

## Good Example
```python
# Namespace per tenant — single index
client.query(index='products', vector=[...], namespace=f"tenant_{tenant_id}")
```

## Exceptions
Compliance requirements demanding physically separate indexes per tenant.

## Consequences Of Violation
Excessive index management overhead and inability to scale to thousands of tenants.

---
## Rule Name
Isolate Environments via Namespace

## Category
Architecture

## Rule
Use different namespaces or name prefixes for development, staging, and production data within the same index.

## Reason
Shared namespaces across environments cause data contamination during testing and development.

## Bad Example
```python
# Same namespace for all environments
namespace = 'products'
```

## Good Example
```python
namespace = f"{app_env}_products"  # 'staging_products', 'prod_products'
```

## Exceptions
Organizations using completely separate Pinecone indexes per environment.

## Consequences Of Violation
Testing data mixing with production data, causing incorrect query results.

---
## Rule Name
Document the Namespace Naming Convention

## Category
Maintainability

## Rule
Always document the namespace naming convention and ensure all team members follow it consistently.

## Reason
Inconsistent namespace naming (tenant_42 vs t_42 vs 42) causes data fragmentation and debugging difficulty.

## Bad Example
```python
# No convention — different patterns across codebase
namespace = f"t{tenant_id}"
namespace = f"tenant{tenant_id}"
namespace = str(tenant_id)
```

## Good Example
```python
# Single convention documented and enforced
namespace = "tenant_{$tenantId}"
```

## Exceptions
Single-developer projects with no collaboration.

## Consequences Of Violation
Data fragmentation across misnamed namespaces, orphaned data, and difficult debugging.
