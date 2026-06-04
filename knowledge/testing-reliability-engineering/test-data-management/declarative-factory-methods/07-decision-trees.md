# Decision Trees — Declarative Factory Methods

## Decision Tree 1: When to Extract a Declarative Factory Method

```
Is a declarative factory method needed?
│
├── Is the same creation pattern used in 3+ tests?
│   └── YES → Extract to declarative method
│       Steps: 1) Create trait, 2) Add named method, 3) Use in tests
│
├── Is the Arrange section longer than Act + Assert combined?
│   └── YES → Extract to declarative method
│       Aim: `$this->createSubscribedUser()` instead of 10 lines of factory chaining
│
├── Does the setup involve multiple related models?
│   └── YES → Extract to declarative method returning all objects
│       `[$team, $admin] = $this->createTeamWithAdminAndMember()`
│
└── Is it a simple single-model creation with no special state?
    └── YES → Do NOT extract
        `User::factory()->create()` is clear enough
        Declarative method would add abstraction without benefit
```

## Decision Tree 2: How to Structure the Declarative Method

```
What structure should the declarative method use?
│
├── Does it create a single model?
│   └── YES → Return the model directly
│       ```php
│       private function createAdminUser(): User
│       {
│           return User::factory()->admin()->create();
│       }
│       ```
│
├── Does it create multiple related models?
│   └── YES → Return as array for destructuring
│       ```php
│       private function createTeamWithAdminAndMember(): array
│       {
│           $admin = User::factory()->admin()->create();
│           $team = Team::factory()->hasAttached($admin, ['role' => 'admin'])->create();
│           return [$team, $admin];
│       }
│       // Usage: [$team, $admin] = $this->createTeamWithAdminAndMember();
│       ```
│
└── Does the method need parameterization?
    ├── Few variations (1-3 params) → Use parameters with defaults
    │   `private function createUserWithRole(string $role = 'member'): User`
    └── Many variations → Use `array $overrides = []`
        `private function createUser(array $overrides = []): User`
```

## Decision Tree 3: Where to Place the Method

```
Where should the declarative method live?
│
├── Is it specific to a single domain (User, Team, Post)?
│   └── YES → Domain-specific trait in Tests/Helpers/
│       ├── Tests/Helpers/UserFactory.php
│       ├── Tests/Helpers/TeamFactory.php
│       └── Usage: `class InvoiceTest extends TestCase { use UserFactory, TeamFactory; }`
│
├── Is it used across almost every test in the application?
│   └── YES → Base test class (sparingly)
│       Only for truly global helpers like `createAdminUser()`
│
└── Is it complex with many interrelated methods?
    └── YES → Dedicated factory class
        Full builder pattern for complex object creation
```
