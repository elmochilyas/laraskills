---
## Rule Name
Ensure Dataset Fits in RAM with Headroom

## Category
Performance

## Rule
Always verify the Typesense dataset fits in RAM with at least 2x headroom before production deployment.

## Reason
Typesense is RAM-first — all indexes are memory-mapped. Insufficient RAM causes OOM crashes and severe performance degradation.

## Bad Example
```bash
# 100GB dataset on 64GB RAM server
# OOM guaranteed
```

## Good Example
```bash
# 50GB dataset requires minimum 100GB RAM
# Monitor at 75% threshold
```

## Exceptions
Typesense Cloud manages infrastructure scaling automatically.

## Consequences Of Violation
Frequent OOM crashes, production outages, and emergency migration to larger instances.

---
## Rule Name
Use Alias Swap for Schema Migrations

## Category
Architecture

## Rule
Always plan schema migrations using the alias swap pattern: create new collection, copy data, swap alias, drop old.

## Reason
Typesense does not support in-place schema alterations. Field additions or type changes require collection recreation.

## Bad Example
```bash
# Direct drop and recreate — causes downtime
php artisan scout:flush "App\Models\Product"
php artisan scout:import "App\Models\Product"
```

## Good Example
```bash
# 1. Create products_v2 with new schema
# 2. Import data to products_v2
# 3. Swap alias 'products' -> products_v2
# 4. Drop products_v1
```

## Exceptions
Development environments where brief downtime is acceptable.

## Consequences Of Violation
Extended search downtime, data loss during migration, and rollback complexity.

---
## Rule Name
Deploy Minimum 3 Nodes for HA

## Category
Reliability

## Rule
Always configure at least 3 Typesense nodes in production for Raft-based high availability clustering.

## Reason
Typesense uses Raft consensus requiring a majority of nodes. With 2 nodes, one failure causes loss of majority and cluster unavailability.

## Bad Example
```bash
# 2-node cluster — one failure loses majority
typesense-node-1
typesense-node-2
```

## Good Example
```bash
typesense-node-1
typesense-node-2
typesense-node-3
# One node can fail without losing majority
```

## Exceptions
Single-node deployments where HA is not required.

## Consequences Of Violation
Cluster unavailability during node maintenance or failure, violating uptime SLAs.

---
## Rule Name
Declare All Fields in Collection Schema

## Category
Framework Usage

## Rule
Always include every field from `toSearchableArray()` in the Typesense collection schema definition.

## Reason
Fields not declared in the schema are silently ignored during indexing. Missing fields cause incomplete search results.

## Bad Example
```php
// Schema missing 'description' field
'collection-schema' => [
    'fields' => [
        ['name' => 'id', 'type' => 'string'],
        ['name' => 'title', 'type' => 'string'],
    ],
],

// toSearchableArray includes description
public function toSearchableArray()
{
    return ['id' => (string) $this->id, 'title' => $this->title, 'description' => $this->description];
}
```

## Good Example
```php
// Both fields declared
'fields' => [
    ['name' => 'id', 'type' => 'string'],
    ['name' => 'title', 'type' => 'string'],
    ['name' => 'description', 'type' => 'string'],
],
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Silent field omission from index, incomplete search coverage, and data inconsistency.

---
## Rule Name
Cast IDs to String for Typesense

## Category
Framework Usage

## Rule
Always cast the primary key to string in `toSearchableArray()` when using Typesense.

## Reason
Typesense requires string IDs. Integer IDs cause schema validation errors and indexing failures.

## Bad Example
```php
public function toSearchableArray()
{
    return ['id' => $this->id]; // integer — fails validation
}
```

## Good Example
```php
public function toSearchableArray()
{
    return ['id' => (string) $this->id];
}
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Import failures blocking all indexing operations for the model.
