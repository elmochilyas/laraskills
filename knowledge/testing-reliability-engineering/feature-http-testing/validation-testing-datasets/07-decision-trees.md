# Decision Trees — Validation Testing with Datasets

## Decision Tree 1: How to Test Each Field

```
What scenarios does a single field need?
│
├── Is the field required?
│   └── Test: valid value passes + missing field fails
│       `['valid email' => ['user@ex.com', true]]`
│       `['missing email' => ['', false]]`
│
├── Does the field have format validation (email, url, numeric)?
│   └── Test: one representative invalid format fails
│       `['invalid format' => ['not-an-email', false]]`
│       Don't test every possible invalid format
│
├── Does the field have length/size boundaries?
│   └── Test boundaries: N-1 passes, N passes, N+1 fails
│       For `max:255`: lengths 254, 255, 256
│       Don't test every value from 1 to 255
│
└── Is the field security-sensitive (email, password, file)?
    └── Include: XSS payload, SQL injection, special characters
        `['XSS payload' => ['<script>alert(1)</script>', false]]`
```

## Decision Tree 2: Direct Form Request Test vs HTTP Test

```
How should validation be tested?
│
├── Are you testing the core validation rule logic?
│   └── Use direct Form Request test (faster: <5ms)
│       ```php
│       $request = new StoreUserRequest();
│       $request->setUserResolver(fn() => User::factory()->create());
│       $this->assertValidationFails($request, ['email' => '']);
│       ```
│       Coverage: 90% of scenarios
│
├── Are you testing validation integration (CSRF, middleware, auth)?
│   └── Use HTTP test (slower: ~30-50ms)
│       ```php
│       $response = $this->postJson('/api/users', []);
│       $response->assertJsonValidationErrors(['email']);
│       ```
│       Coverage: remaining 10% of scenarios
│
└── Are you testing a custom ValidationRule object?
    └── Use unit test (fastest: <1ms)
        ```php
        $rule = new UppercaseRule();
        $failed = false;
        $rule->validate('name', 'john', fn($msg) => $failed = true);
        assertTrue($failed);
        ```
```

## Decision Tree 3: Dataset Structure and Naming

```
How should test datasets be organized?
│
├── Is the dataset used across multiple test files?
│   └── Extract to a shared dataset function
│       ```php
│       function validEmails(): array
│       {
│           return ['simple' => ['a@b.com'], ...];
│       }
│       ```
│       Reuse across Form Request and controller tests
│
├── Is the dataset specific to one test file?
│   └── Use inline named dataset with descriptive keys
│       ```php
│       ->with([
│           'valid email' => ['user@ex.com', true],
│           'empty string' => ['', false],
│           'missing @ sign' => ['not-an-email', false],
│       ]);
│       ```
│       Named keys appear in test failure output
│
└── Is there a valid data base that only needs field-level overrides?
    └── Create a `validData()` helper function
        Tests override specific fields for invalid scenarios
        Reduces duplication across dataset rows
```
