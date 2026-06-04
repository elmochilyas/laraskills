# Decision Trees: Form Request Testing

## Tree 1: Testing Level Selection

```
What aspect of the FormRequest are you testing?
├── Validation rules in isolation → Unit test with Validator::make(). Fast, precise, no HTTP.
├── Full request lifecycle (middleware, auth) → Integration test via HTTP endpoint.
├── authorize() method logic → Dedicated authorize test class. Test each permission scenario.
├── prepareForValidation() transformation → Unit or integration test. Verify mutated input.
├── failedValidation() error format → Integration test via HTTP. Verify error response shape.
└── validationData() input scoping → Unit test. Verify correct data is passed to validator.
```

## Tree 2: Unit vs Integration Balance

```
How many rules does this FormRequest have?
├── 1-5 rules → Unit test all rules + 1 HTTP test for error format. Fast and comprehensive.
├── 5-15 rules → Unit test all rules via Validator::make(). 2-3 HTTP tests for key scenarios.
├── 15+ rules → Unit test all rules. Test via parameterized data providers. 1 HTTP smoke test.
└── Conditional / complex rules → Unit test each condition. HTTP test for each condition branch.
```

## Tree 3: Negative Test Coverage

```
What invalid data should be tested for each rule?
├── Empty/null → Always test. Most common invalid input.
├── Exceeds max length/range → Test upper boundary. Off-by-one is common.
├── Below min length/range → Test lower boundary.
├── Wrong type (string for integer, object for string) → Test type mismatch. Most common coersion issue.
├── Invalid format (email, URL, date) → Test format validation with clearly invalid values.
└── Special characters / Unicode / SQL injection attempts → Test security boundaries.
```

## Tree 4: Authorization Testing

```
What authorization scenarios does this endpoint have?
├── Public (return true) → Single test: confirm authorize() returns true.
├── Authenticated only → Two tests: authenticated passes, guest fails.
├── Role-based (admin vs user) → Test each role: admin passes, user fails (or vice versa).
├── Owner-based (own resource only) → Test: owner passes, non-owner fails, guest fails.
├── Policy-based → Test each Policy method scenario via Gate facade.
└── Multiple conditions → Test each combination. Combinatorial explosion = restructure authorize().
```

## Tree 5: Error Response Shape Testing

```
What format does the API use for validation errors?
├── JSON:API → Test: response has errors array, each with status, code, title, detail, source.pointer.
├── Custom envelope → Test: response matches documented envelope structure exactly.
├── Flat array → Test: response is array of { field, message } objects.
├── Field-keyed → Test: response is object with field names as keys, messages as values.
└── Minimal → Test: response is array of message strings. Verify correct order.
```
