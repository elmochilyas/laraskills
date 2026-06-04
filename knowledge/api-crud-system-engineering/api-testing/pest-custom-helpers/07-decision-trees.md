# Decision Trees: Pest Custom Helpers

## Tree 1: When To Extract a Helper

```
Has this pattern appeared multiple times in the test suite?
├── 0-2 times → Keep inline. Premature abstraction adds indirection.
├── 3-5 times → Extract to test file helper. Scope to the resource.
├── 6-10 times → Extract to shared trait. Use across related test files.
└── 10+ times → Extract to global expectation or Pest.php helper. Single source of truth.
```

## Tree 2: Helper Placement

```
Where is the helper needed?
├── Single test file → File-level function or local trait
├── Multiple files in same directory → Shared trait in a Helpers directory
├── Multiple directories (cross-domain) → Global helper in Pest.php
└── Assertion on TestResponse → expect()->extend() custom expectation
```

## Tree 3: Expectation vs Helper Function

```
What does the helper do?
├── Asserts a condition on a value → expect()->extend() custom expectation
├── Sets up test state → Helper function (e.g., actingAsUser())
├── Creates test data → Factory trait or helper function
└── Combines multiple assertions → Trait method with clear single responsibility
```
