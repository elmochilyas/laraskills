# Decision Trees — Database Assertion Methods

## Decision Tree 1: Which Database Assertion to Use

```
What database state needs verification?
│
├── Does the operation CREATE a record?
│   └── Use `assertDatabaseHas($table, $data)` — verify record exists with correct values
│       Include key fields: `['name' => 'John', 'email' => 'john@test.com']`
│       Don't just check ID — verify the actual data was persisted
│
├── Does the operation UPDATE a record?
│   └── Use `assertDatabaseHas($table, $data)` — verify changed field values
│       `['id' => $user->id, 'name' => 'Jane Doe']`
│
├── Does the operation DELETE a record?
│   ├── Hard delete → Use `assertDatabaseMissing($table, $data)`
│   │   `assertDatabaseMissing('posts', ['id' => $post->id])`
│   └── Soft delete → Use `assertSoftDeleted($table, $data)`
│       `assertSoftDeleted('users', ['id' => $user->id])`
│       NEVER use `assertDatabaseMissing` for soft-delete models!
│
├── Does the operation affect the aggregate count?
│   └── Use `assertDatabaseCount($table, $count)` or `assertDatabaseEmpty($table)`
│       `assertDatabaseCount('users', 5)` — useful after bulk operations
│
└── Does the operation need complex row verification?
    └── Use Eloquent/query builder + PHPUnit assertions
        `$user = User::find($id); expect($user->name)->toBe('John')`
```

## Decision Tree 2: Model Class vs String Table Name

```
How should the table be referenced in assertions?
│
├── Does the table have an Eloquent model?
│   └── YES → Use model class reference: `assertDatabaseHas(User::class, [...])`
│       Survives table renames — if `users` table becomes `accounts`, no test changes needed
│
├── Is it a pivot table (no model)?
│   └── Use string table name: `assertDatabaseHas('role_user', [...])`
│       Pivot tables typically don't have models
│
└── Is it a custom table without a model?
    └── Use string table name
        Document why the model doesn't exist
```

## Decision Tree 3: Timestamp Assertion Strategy

```
How should timestamps be asserted in database checks?
│
├── Is `Carbon::setTestNow()` frozen in this test?
│   └── YES → Can use exact equality (time is deterministic)
│       `assertDatabaseHas('users', ['created_at' => now()])`
│
├── Is time NOT frozen?
│   └── Use range-based comparison
│       `assertDatabaseHas('users', ['created_at' => now()->subSecond()])`
│       Allows 1-second tolerance for processing delay
│
└── Are you comparing against a model's timestamp?
    └── Use Carbon comparison, not database assertion
        `$user->fresh(); expect($user->created_at->isSameMinute(now()))->toBeTrue()`
```
