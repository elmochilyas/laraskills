# Decision Trees — Class & Method Testing (DTO Factories)

## Decision Tree 1: DTO Factory vs Inline Construction

```
How should this DTO be created in the test?
│
├── DTO has 1-2 simple properties?
│   └── Use inline construction: `new Email('test@example.com')`
│       No factory needed — constructor is clear on its own
│
├── DTO has 3-5 properties used across 2+ tests?
│   └── Use simple function factory with $overrides
│       ```php
│       function validUserDTO(array $overrides = []): UserDTO
│       {
│           return new UserDTO(...['name' => 'Test', 'email' => 'test@ex.com', ...$overrides]);
│       }
│       ```
│
├── DTO has 5+ properties or complex nested structure?
│   └── Use builder pattern class
│       ```php
│       UserDTOFactory::new()
│           ->withName('Admin')
│           ->withPermissions(['all'])
│           ->build();
│       ```
│
└── Is the same DTO configuration used in 2+ tests?
    └── Create named preset method
        `UserDTOFactory::admin()->build()` instead of repeating `->withRole('admin')->withPermissions(['all'])`
```

## Decision Tree 2: How to Maintain DTO Immutability

```
Is the DTO intended to be immutable?
│
├── YES (as it should be for all DTOs)
│   └── Use `with()` pattern for modifications
│       ```php
│       $dto = UserDTOFactory::new()->build();
│       $adminDto = $dto->withRole('admin'); // new instance, original unchanged
│       ```
│       Never: `$dto->role = 'admin'` — violates immutability contract
│
└── NO (explicitly designed as mutable — rare, anti-pattern)
    └── Use setter methods, but prefer refactoring to immutable DTO
        Mutable DTOs cause subtle bugs when instances are shared
        Consider refactoring to use `with()` pattern instead
```

## Decision Tree 3: Where to Place the DTO Factory

```
Where should this DTO factory live?
│
├── Is it a simple one-off factory used in a single test file?
│   └── → Keep it in the test file (local helper function)
│       Only extract when reused across files
│
├── Is it reused across multiple test files?
│   └── → Place in `tests/DTOFactories/{Domain}/`
│       Mirror the DTO's namespace
│       `app/DTOs/Users/UserDTO.php` → `tests/DTOFactories/Users/UserDTOFactory.php`
│
└── Does it need to be available to the entire test suite?
    └── → Use trait in `Tests/Helpers/`
        Import via `use UserDTOFactory;` in test classes
```
