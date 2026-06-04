# Decision Trees — Factory States and Sequences

## Decision Tree 1: State Method vs Inline Attributes

```
How to apply custom attributes in a factory?
│
├── Is the attribute set used across 3+ tests?
│   └── YES → Create a state method
│       ```php
│       public function published(): static
│       {
│           return $this->state(['status' => 'published', 'published_at' => Carbon::yesterday()]);
│       }
│       ```
│       Usage: `Post::factory()->published()->create()`
│
├── Is it a one-off attribute override?
│   └── YES → Use inline `->create(['key' => 'value'])`
│       `Post::factory()->create(['title' => 'Unique Test Title'])`
│
└── Is the attribute set a common domain concept?
    └── YES → Create a named state method
        Published, draft, archived, admin, member, subscribed
        Map domain vocabulary to factory states
```

## Decision Tree 2: Sequence vs Explicit Loop

```
How to create multiple models with different attributes?
│
├── Are there 2-10 models with simple variations?
│   └── YES → Use `->sequence()` with explicit arrays
│       ```php
│       User::factory(4)->sequence(
│           ['role' => 'admin'],
│           ['role' => 'editor'],
│           ['role' => 'member'],
│           ['role' => 'viewer'],
│       )->create();
│       ```
│
├── Are there 2-10 models with index-based variations?
│   └── YES → Use `->sequence()` with callback
│       ```php
│       Post::factory(10)->sequence(fn $seq => [
│           'title' => "Article {$seq->index}",
│       ])->create();
│       ```
│
└── Are there 10+ models with complex logic?
    └── YES → Use explicit loop
        ```php
        foreach (range(1, 50) as $i) {
            $role = $i < 40 ? 'member' : 'admin';
            User::factory()->create(['role' => $role]);
        }
        ```
```

## Decision Tree 3: `->has()` vs `afterCreating` for Relationships

```
How to create related models in factories?
│
├── Is the relationship needed for every instance of this model?
│   └── YES → Use `afterCreating` hook (with documentation)
│       Example: Order always needs at least one LineItem
│       Document: `// afterCreating: creates a default line item. Required for Order to be valid.`
│
├── Is the relationship test-scenario-specific?
│   └── YES → Use `->has()` at the call site
│       `User::factory()->has(Profile::factory())->create()`
│       Reader can see the relationship being created
│
└── Is it unclear whether the relationship is always needed?
    └── Prefer `->has()` initially → Refactor to `afterCreating` only when proven always needed
        Rule of thumb: default to `->has()` for transparency
```
