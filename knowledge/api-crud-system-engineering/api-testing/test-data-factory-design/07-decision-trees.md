# Decision Trees — Test Data Factory Design

## Tree 1: Factory State vs Inline Override

**Decision Context**: Whether to use factory states or inline overrides for test data customization.

**Decision Criteria**:
- State reusability across tests
- Number of distinct states per model
- Test readability requirements

**Decision Tree**:
```
Is this model state used in 3+ different tests?
├── YES → Define a factory state: PostFactory::new()->published()->create()
└── NO → Is the override a single field (e.g., 'status' => 'archived')?
    ├── YES → Use inline override: Post::factory()->create(['status' => 'archived'])
    └── NO → Is the override a combination of fields that represent a meaningful state?
        ├── YES → Define a factory state for clarity and maintainability
        └── NO → Use inline overrides (simple, one-off customization)
```

**Rationale**: Factory states improve readability and reduce duplication for commonly used states. Inline overrides are fine for one-off test data variations.

**Recommended Default**: Factory states for states used across 3+ tests; inline overrides for single-use customizations.

**Risks**: Inline overrides everywhere create inconsistent test data across files. Too many factory states create a maintenance burden.

---

## Tree 2: Factory Relationship Strategy

**Decision Context**: How to define and use factory relationships — has/for/magic methods vs afterCreating callbacks vs manual creation in tests.

**Decision Criteria**:
- Relationship depth (1 level vs nested)
- Performance requirements
- Test readability

**Decision Tree**:
```
Is the relationship a direct parent-child (User has many Posts)?
├── YES → Use factory relationship methods: User::factory()->hasPosts(3)->create()
└── NO → Is the relationship many-to-many with pivot data?
    ├── YES → Use afterCreating() callback: $this->afterCreating(fn($post) => $post->tags()->attach(...))
    └── NO → Is the relationship a belongsTo (Post belongs to User)?
        ├── YES → Use inline relationship in definition: 'user_id' => User::factory() (Laravel auto-creates)
        └── NO → Create relationships manually in test after base model creation
```

**Rationale**: Factory relationship methods are the most readable and performant. `afterCreating` callbacks add overhead (run per record). Manual creation is flexible but verbose.

**Recommended Default**: `has()`/`for()` methods for direct relationships; inline `User::factory()` in `definition()` for belongsTo.

**Risks**: `afterCreating` callbacks on `factory()->count(N)->create()` run N times — O(N) overhead. Circular relationship definitions cause infinite recursion.
