---
## Rule Name
Manage Synonyms via Typesense API Directly

## Category
Architecture

## Rule
Always use the Typesense SDK directly for synonym CRUD operations — Scout has no synonym abstraction for Typesense.

## Reason
Scout's `scout:sync-index-settings` does not manage Typesense synonyms. Attempting to use Scout for synonym management will silently fail.

## Bad Example
```php
// Scout does not manage Typesense synonyms — silently fails
TypesenseProduct::search($query)->options(['synonyms' => [...]]);
```

## Good Example
```php
$typesense = app(Typesense::class);
$synonyms = $typesense->collections['products']->synonyms;
$synonyms->upsert('laptop_synonyms', [
    'synonyms' => ['laptop', 'notebook', 'ultrabook'],
    'root' => 'laptop',
    'type' => 'multi_way',
]);
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Synonyms silently not applied — search misses equivalent terminology.

---
## Rule Name
Use multi_way for Genuine Equivalences

## Category
Design

## Rule
Use `multi_way` for genuinely interchangeable terms and `one_way` for directional mappings.

## Reason
`multi_way` ensures all terms in the group return equivalent results. `one_way` is for terms that should expand to targets without reverse mapping.

## Bad Example
```json
{
  "type": "one_way",
  "root": "shoe",
  "synonyms": ["sneaker", "trainer"]
}
// Searching "sneaker" doesn't match "shoe" results
```

## Good Example
```json
{
  "type": "multi_way",
  "synonyms": ["shoe", "sneaker", "trainer"]
}
// All terms return equivalent results
```

## Exceptions
Acronym expansions where reverse matching is incorrect.

## Consequences Of Violation
Asymmetric search results — some terminology variations miss relevant documents.

---
## Rule Name
Version-Control Synonym Configurations

## Category
Maintainability

## Rule
Always store Typesense synonym definitions in version-controlled JSON files.

## Reason
Synonyms managed through the API alone have no history. Version-controlled files enable rollback, review, and deployment via CI/CD.

## Bad Example
```bash
# Synonyms created through API calls only — no history, no rollback
```

## Good Example
```json
// stored in database/synonyms/products.json
[
  {"type": "multi_way", "synonyms": ["laptop", "notebook", "ultrabook"]},
  {"type": "one_way", "root": "nike", "synonyms": ["air max", "jordan"]}
]
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Loss of synonym configuration history and inability to roll back problematic changes.
