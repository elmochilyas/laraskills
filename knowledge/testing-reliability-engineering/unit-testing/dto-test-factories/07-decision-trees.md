# Decision Trees — DTO Test Factories

## Decision Tree 1: Simple Factory vs Builder Pattern

```
How complex is the DTO?
│
├── DTO has 1-5 properties
│   └── Use function factory with $overrides array
│       ```php
│       function validUserDTO(array $overrides = []): UserDTO
│       {
│           return new UserDTO(...array_merge([
│               'name' => 'Test User',
│               'email' => 'test@example.com',
│           ], $overrides));
│       }
│       ```
│
├── DTO has 5+ properties
│   └── Use builder pattern class
│       ```php
│       UserDTOFactory::new()
│           ->withName('Admin')
│           ->withRole('admin')
│           ->withPermissions(['all'])
│           ->build();
│       ```
│       Benefits: IDE autocompletion, self-documenting
│
└── DTO has 1-2 properties
    └── Use `new DTO(...)` directly
        `new EmailDTO('test@example.com')` — no factory needed
```

## Decision Tree 2: Deterministic vs Random Defaults

```
What should the factory default values be?
│
├── Will the default value appear in assertions?
│   └── YES → Use explicit fixed string
│       `'email' => 'test@example.com'`
│       Never: `'email' => fake()->email()` — flaky assertion failures
│
├── Does the DTO have validation constraints?
│   └── YES → Align factory defaults with those constraints
│       If email validation requires `*.gov`, default must be `test@gov.example`
│       Mismatch → tests fail during setup, not assertion
│
└── Is the field irrelevant to the test scenario?
    └── Still use deterministic defaults
        No Faker, no `uniqid()`, no `now()`
        Fixed values make test failures reproducible
```

## Decision Tree 3: Preset Method vs Inline Overrides

```
When to create a named preset method?
│
├── Is the same DTO config used in 2+ tests?
│   └── YES → Extract to named preset
│       ```php
│       class UserDTOFactory {
│           public static function admin(): self
│           {
│               return self::new()->withRole('admin');
│           }
│       }
│       ```
│       Usage: `UserDTOFactory::admin()->build()`
│       Instead of: `UserDTOFactory::new()->withRole('admin')->build()` repeated everywhere
│
└── Is the config used in only one test?
    └── Keep inline at the call site
        No premature extraction
        Refactor when duplication appears
```
