---
## Rule Name
Define Collection Schemas for Every Model

## Category
Framework Usage

## Rule
Always define complete collection schemas in `config/scout.php` under `typesense.model-settings` for every searchable model.

## Reason
Typesense enforces schemas at index time. Undefined models cause import failures or silent indexing of fields.

## Bad Example
```php
// Missing model-settings — import fails
'typesense' => [
    'host' => env('TYPESENSE_HOST'),
],
```

## Good Example
```php
'typesense' => [
    'host' => env('TYPESENSE_HOST'),
    'model-settings' => [
        Product::class => [
            'collection-schema' => [
                'fields' => [
                    ['name' => 'id', 'type' => 'string'],
                    ['name' => 'title', 'type' => 'string'],
                    ['name' => 'price', 'type' => 'float'],
                ],
            ],
        ],
    ],
],
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Import failures, blocked deployments, and emergency fixes.

---
## Rule Name
Use Alias Swap for Schema Migrations

## Category
Architecture

## Rule
Always use the alias swap pattern (create new collection, import, swap alias, drop old) for zero-downtime schema changes.

## Reason
Typesense does not support in-place schema alterations. Direct collection changes require dropping and recreating the index, causing downtime.

## Bad Example
```bash
# Drop and recreate — causes downtime
php artisan scout:flush "App\Models\Product"
# Update schema in config
php artisan scout:import "App\Models\Product"
```

## Good Example
```bash
# 1. Create new collection with updated schema
# 2. Import data to new collection
# 3. Swap alias atomically
# 4. Drop old collection
```

## Exceptions
Development environments where brief downtime is acceptable.

## Consequences Of Violation
Extended search downtime during schema changes and data loss risk.

---
## Rule Name
Cast Model ID to String

## Category
Framework Usage

## Rule
Always cast the model's primary key to string in `toSearchableArray()` for Typesense.

## Reason
Typesense requires string IDs. Integer IDs cause schema validation errors at index time.

## Bad Example
```php
public function toSearchableArray()
{
    return ['id' => $this->id]; // integer — schema error
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
Schema validation errors during import, blocking indexing operations.

---
## Rule Name
Use searchableUsing for Per-Model Engine Selection

## Category
Framework Usage

## Rule
Use the `searchableUsing()` method when different models need different search engines or configurations.

## Reason
Scout defaults to a single engine. `searchableUsing()` enables per-model engine routing without global config changes.

## Bad Example
```php
// All models forced to same Typesense config
class Product extends Model
{
    use Searchable;
}
```

## Good Example
```php
class Product extends Model
{
    use Searchable;

    public function searchableUsing()
    {
        return app(typesenseEngine::class);
    }
}
```

## Exceptions
Applications using a single search engine for all models.

## Consequences Of Violation
Inflexible engine configuration requiring workarounds when models need different backends.
