# Decision Trees: Validation Error Test Patterns

## Tree 1: Validation Test Coverage

```
How many validation rules does the field have?
├── 1 rule → One test for rule failure + one positive test
├── 2-3 rules → One test per rule + one positive test
├── 4-6 rules → One test per rule + one positive test + one bulk failure test
└── 7+ rules → Prioritize by risk:
    │   Security-critical (unique, exists, max filesize) → Test first
    │   Format rules (email, url, date) → Test second
    │   Constraint rules (min, max, between) → Test third
    │   Presence rules (required, nullable) → Always test
```

## Tree 2: Validation Error Assertion Strategy

```
What needs to be verified about the validation error?
├── Error exists for a specific field → assertJsonValidationErrors(['name'])
├── Error details are correct → assertJsonValidationErrorFor('name')
│   └── Check specific message → $response->assertJsonFragment(['message' => '...'])
├── Multiple errors exist → assertJsonValidationErrors(['name', 'email', 'age'])
├── Specific error count → $response->assertJsonCount(3, 'errors')
└── No validation error for a field → $response->assertJsonMissingValidationErrors('name')
```

## Tree 3: Conditional Validation Testing

```
Does validation depend on other fields?
├── required_if → Test: condition true + field missing (error), condition false + field missing (no error)
├── required_with → Test: other field present + missing (error), other field absent + missing (no error)
├── required_unless → Test: condition false + missing (error), condition true + missing (no error)
├── prohibited_if → Test: condition true + field present (error), condition false + field present (success)
└── Custom conditional → Test both branches of the condition + edge cases
```
