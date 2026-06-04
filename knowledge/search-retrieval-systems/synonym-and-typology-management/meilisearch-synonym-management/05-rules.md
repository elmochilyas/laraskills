---
## Rule Name
Prefer Bidirectional Synonyms for Genuine Equivalences

## Category
Design

## Rule
Use bidirectional (two-way) synonyms for genuinely interchangeable terms and one-way for specific mappings.

## Reason
Bidirectional synonyms ensure both terms return the same results. Wrong use of one-way causes asymmetric search — searching one term misses results for the other.

## Bad Example
```json
{
  "synonyms": {
    "shoe": ["sneaker", "trainer"]  // Searching "sneaker" won't match "shoe" results
  }
}
```

## Good Example
```json
{
  "synonyms": {
    "shoe": ["sneaker", "trainer"],
    "sneaker": ["shoe", "trainer"],
    "trainer": ["shoe", "sneaker"]  // All three return equivalent results
  }
}
```

## Exceptions
Acronym expansions where "API" → "Application Programming Interface" but not vice versa.

## Consequences Of Violation
Asymmetric search — some variations of the same concept return different or fewer results.

---
## Rule Name
Keep Synonym Sets Lean

## Category
Maintainability

## Rule
Limit synonym groups to 3-5 terms maximum to avoid over-expansion.

## Reason
Broad synonym groups match too many documents, reducing search precision. Each addition exponentially increases the matching scope.

## Bad Example
```json
{
  "shoe": ["sneaker", "trainer", "footwear", "loafer", "boot", "sandal", "heel", "pump", "flat", "wedge"]
}
```

## Good Example
```json
{
  "shoe": ["sneaker", "trainer", "footwear"]
}
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Imprecise search — queries return many irrelevant results from overly broad synonym matching.

---
## Rule Name
Audit Synonyms Regularly

## Category
Maintainability

## Rule
Always review and update synonym sets quarterly to remove outdated mappings.

## Reason
Product catalogs and vocabulary evolve. Outdated synonyms cause irrelevant matches or miss new terminology.

## Bad Example
```bash
# Synonyms created 2 years ago — never reviewed
# "iPod" still mapped as synonym for "music player"
```

## Good Example
```php
$schedule->call(function () {
    $synonyms = Meilisearch::getSynonyms('products');
    Log::info('Current synonyms', ['count' => count($synonyms)]);
    // Review for outdated terms, deprecations
})->quarterly();
```

## Exceptions
Stable vocabulary domains with infrequent terminology changes.

## Consequences Of Violation
Outdated synonyms returning irrelevant results or missing new product terminology.
