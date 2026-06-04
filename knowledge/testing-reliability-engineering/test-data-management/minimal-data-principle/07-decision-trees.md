# Decision Trees — Minimal Data Principle

## Decision Tree 1: How Many Records to Create

```
How many records does the test need?
│
├── Is it an existence/ownership test?
│   └── YES → 1 record
│       Example: "User can view own profile" → 1 User
│
├── Is it a boundary/scoping test?
│   └── YES → 2-3 records
│       Example: "User only sees own posts" → 1 owner, 1 other
│
├── Is it a pagination test?
│   └── YES → per_page + 1 records (e.g., 11 for per_page=10)
│       Example: "Paginates at 10 per page" → 11 Posts
│
├── Is it a sorting/complex behavior test?
│   └── YES → enough diverse values for meaningful order
│       Exception: needs more data than minimal principle normally allows
│
└── Is it a performance/load test?
    └── YES → production-like data volumes
        Exception: minimal data principle doesn't apply
```

## Decision Tree 2: How to Specify Attributes

```
How to provide attribute values for records?
│
├── Will the attribute appear in an assertion?
│   └── YES → Use explicit fixed value
│       ├── Good: `->create(['email' => 'test@example.com'])`
│       │   Then: `assertDatabaseHas('users', ['email' => 'test@example.com'])`
│       └── Bad: `->create()` then `assertDatabaseHas('users', ['email' => $user->email])`
│           Reason: Faker value in assertion creates flaky failures
│
├── Is it a commonly reused attribute set?
│   └── YES → Use factory state method
│       `Post::factory()->published()->create()`
│       vs inline: `Post::factory()->create(['status' => 'published', 'published_at' => now()])`
│
└── Is it a one-off value not used in assertions?
    └── YES → Use factory defaults (no explicit value needed)
        `$user = User::factory()->create()` — name, email come from Faker defaults
```

## Decision Tree 3: What Relationships to Create

```
Does the test need related models?
│
├── Is the relationship directly tested?
│   └── YES → Create the relationship explicitly
│       Example: "Post belongs to User" → create User + Post with user_id
│       Use: `Post::factory()->for($user)->create()`
│
├── Is the relationship required for the behavior?
│   └── YES → Create minimum needed, nothing more
│       Example: "Invoice total calculation" → Invoice + 1 line item
│       Don't create: User, Team, PaymentMethod along with invoice
│
└── Is the relationship NOT needed for the test?
    └── YES → Do NOT create it
        Use `Invoice::factory()->create(['user_id' => User::factory()])`
        Instead of creating a full User with Team, Profile, etc.
```
