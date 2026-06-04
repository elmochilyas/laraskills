# Factory Callbacks — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Factories & Seeders |
| Knowledge Unit | Factory Callbacks |
| Focus | Anti-patterns in afterCreating/afterMaking callback usage |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Side Effects in Factory `definition()` | Architecture | Critical |
| 2 | Expensive Operations in Factory Callbacks | Performance | High |
| 3 | Callbacks Registered in `definition()` Instead of `configure()` | Code Organization | Medium |
| 4 | Using Callbacks When Relationship Methods Would Suffice | Maintainability | Medium |
| 5 | Multi-Purpose God Callbacks | Maintainability | Medium |
| 6 | `afterMaking` Used for Persistence-Dependent Logic | Reliability | High |

## Repository-Wide Cross-Cutting Patterns

- The most critical anti-pattern is putting side effects (relationship creation, file I/O, API calls) directly in `definition()`, causing phantom records on `make()` and hidden coupling
- Expensive operations in callbacks scale linearly with model count, turning fast seeding into slow operations
- Using manual relationship setup in `afterCreating()` callbacks instead of declarative `has()`/`for()`/`hasAttached()` replicates framework logic

---

## 1. Side Effects in Factory `definition()`

### Category
Architecture

### Description
Including side effects (database writes, file creation, API calls, event dispatching) in the factory's `definition()` method instead of keeping it as a pure attribute array and moving side effects to `afterMaking()` or `afterCreating()` callbacks.

### Why It Happens
Definitions with inline `Model::factory()` calls or direct persistence seem convenient — "create the related model right here." The developer may not be aware that `definition()` runs during both `make()` and `create()`.

### Warning Signs
- `definition()` contains `Model::factory()->create()` or `Model::factory()->make()` calls
- `definition()` calls `Storage::put()`, `Http::post()`, or other I/O operations
- `definition()` dispatches events or writes logs
- `definition()` modifies relationships or calls `->save()` on the model
- Calling `Factory::raw()` triggers database writes or external side effects
- Tests using `make()` unexpectedly create database records

### Why Harmful
- `make()` (which only instantiates, not persists) triggers database writes
- `Factory::raw()` returns attribute arrays but also creates related records
- `definition()` cannot be called purely — it has hidden side effects
- Tests using `make()` for non-persisted models still pollute the database
- The factory's attribute array is unreliable because side effects run during generation

### Consequences
- `Post::factory()->make()` creates a User record in the database via `'user_id' => User::factory()`
- A test using `make()` for 100 models creates 100 users that persist after the test
- `Post::factory()->raw()` triggers media uploads because `definition()` calls `addMedia()`
- Calling `make()` on a factory with callback-like logic in `definition()` duplicates records

### Preferred Alternative
```php
public function definition(): array
{
    return ['title' => fake()->sentence()];
}

public function configure(): static
{
    return $this->afterCreating(fn (Post $post) => $post->addMedia(...));
}
```

### Detection Checklist
- [ ] Search for `::factory()->` inside `definition()` methods
- [ ] Check for `Storage::`, `Http::`, `Mail::`, `Event::` in `definition()` methods
- [ ] Call `Factory::raw()` — does it trigger any database writes?
- [ ] Call `Factory::make()` — does it create unexpected database records?
- [ ] Verify `definition()` returns only a plain attribute array

### Related
| Rule | `05-rules.md` — Keep definition() Pure — No Side Effects |
| Skill | `06-skills.md` — Implement afterCreating Factory Callback |
| Knowledge | `04-standardized-knowledge.md` — Factory Callbacks |

---

## 2. Expensive Operations in Factory Callbacks

### Category
Performance

### Description
Performing expensive operations (HTTP API calls, file uploads, bulk database operations, external service calls) inside `afterCreating()` or `afterMaking()` callbacks. Each model creation triggers the expensive operation, scaling linearly.

### Why It Happens
Developers put necessary setup logic in callbacks without considering the performance impact at scale. An API call that takes 200ms works fine for 1 model but becomes 200 seconds for 1000 models.

### Warning Signs
- HTTP calls (`Http::post()`, `Http::get()`) inside factory callbacks
- File uploads or image processing in callbacks
- External service integrations (Slack, email, SMS) in callbacks
- Slow test suites when using `Factory::count(N)` with callbacks
- Callbacks that query external APIs or perform heavy computations
- Seeder scripts that take minutes to run due to callback overhead

### Why Harmful
- 500 models × 300ms API call = 150 seconds of factory creation time
- External API failures cause factory creation to fail entirely
- File uploads in callbacks fill storage with test artifacts
- Test suite speed degrades proportionally to data volume
- The expensive operation runs even when the data isn't needed

### Preferred Alternative
```php
// In test or seeder instead of callback:
$users = User::factory()->count(100)->create();
Http::pool(fn (Pool $pool) => $users->map(
    fn ($user) => $pool->post('https://api.example.com/users', $user->toArray())
));
```

### Detection Checklist
- [ ] Search for `Http::`, `Storage::`, `Mail::`, `Queue::` in callback closures
- [ ] Measure factory creation time with count(100) vs count(1)
- [ ] Check if callbacks perform operations that should be batched
- [ ] Review callback logic for network I/O or heavy computation
- [ ] Profile slow seeders for callback-related bottlenecks

### Related
| Rule | `05-rules.md` — Do Not Perform Expensive Operations in Factory Callbacks |
| Skill | `06-skills.md` — Implement afterCreating Factory Callback |

---

## 3. Callbacks Registered in `definition()` Instead of `configure()`

### Category
Code Organization

### Description
Calling `$this->afterCreating()` or `$this->afterMaking()` inside the `definition()` method instead of in the dedicated `configure()` method.

### Why It Happens
PHP allows calling `$this->afterCreating()` from any method, and `definition()` is the first place developers go to configure a factory. The developer may not know about the `configure()` method.

### Warning Signs
- `$this->afterCreating()` or `$this->afterMaking()` calls inside `definition()`
- `definition()` method that both returns attributes AND registers callbacks
- Factory classes with no `configure()` method (callbacks placed elsewhere)
- Confusion about whether callback registration belongs in `definition()` or `configure()`
- `definition()` that mixes `return [...]` with callback setup

### Why Harmful
- Callbacks are hidden inside the attribute definition rather than in the designated location
- `definition()` has two responsibilities: returning data and registering behavior
- Extending the factory requires overriding both the callback registration and the attributes
- New developers look for callbacks in `configure()` first (convention) and miss them in `definition()`

### Preferred Alternative
```php
public function definition(): array
{
    return ['title' => fake()->sentence()];
}

public function configure(): static
{
    return $this->afterCreating(fn (Post $post) => ...);
}
```

### Detection Checklist
- [ ] Search for `$this->afterCreating` and `$this->afterMaking` — are they inside `definition()`?
- [ ] Check if `configure()` method exists and contains callbacks
- [ ] Verify `definition()` only returns attribute arrays
- [ ] Review factory classes for callback placement consistency

### Related
| Rule | `05-rules.md` — Register Callbacks in configure() — Not in definition() |
| Decision Tree | `07-decision-trees.md` — Callback Placement |

---

## 4. Using Callbacks When Relationship Methods Would Suffice

### Category
Maintainability

### Description
Using `afterCreating()` callbacks to manually create and attach related models when the declarative `has()`, `for()`, or `hasAttached()` methods would handle the same relationship more cleanly.

### Why It Happens
Developers learn callbacks first and use them as a general-purpose tool. The declarative relationship methods (`has()`, `for()`) may not be as well-known. The callback approach "works" so there's no incentive to change.

### Warning Signs
- `afterCreating()` callbacks that create related models via `factory()->create(['fk' => $model->id])`
- Manual foreign key assignment in callbacks
- No use of `has()`, `for()`, or `hasAttached()` in the codebase
- Callbacks that replicate what `has(Related::factory()->count(N))` does
- Factory classes with multiple relationship callbacks that could be call-site methods

### Why Harmful
- Manual FK resolution replicates what the framework handles automatically
- Callback-based relationships run on every creation, even when not needed
- Call-site flexibility is lost — the relationship is embedded in the factory
- More verbose and error-prone than declarative alternatives

### Preferred Alternative
```php
// At call site instead of callback:
User::factory()->has(Post::factory()->count(3))->create();
```

### Detection Checklist
- [ ] Count `afterCreating` callbacks vs `has()`/`for()` usage
- [ ] Review callbacks that create related models manually
- [ ] Check if callbacks use `->create(['fk' => $model->id])` patterns
- [ ] Determine if callbacks could be replaced with call-site relationship methods

### Related
| Rule | `05-rules.md` — Use Factory Relationship Methods Instead of Callbacks When Possible |
| Decision Tree | `07-decision-trees.md` — afterCreating vs has() for Child Setup |

---

## 5. Multi-Purpose God Callbacks

### Category
Maintainability

### Description
A single `afterCreating()` or `afterMaking()` callback that performs multiple unrelated operations (creating relationships, dispatching events, writing files, logging). The callback is a "god closure" doing everything.

### Why It Happens
Developers add operations to an existing callback rather than creating separate ones. It's convenient to have all post-creation logic in one place. The callback grows over time as new requirements are added.

### Warning Signs
- Single callback with 10+ lines doing multiple distinct operations
- Callback that both creates relationships AND dispatches events AND writes logs
- Factory states that need to override only part of the callback behavior but can't
- Callbacks with comments separating "sections" of logic
- Difficulty understanding what the factory does after creating a model
- Tests that mock or disable the entire callback to avoid only part of it

### Why Harmful
- States cannot override individual operations — must override the entire callback
- Testing the factory requires setting up conditions for all callback operations
- The callback is brittle: changing one operation risks breaking another
- Readability decreases as unrelated logic is grouped in one closure
- Partial failure is hard to handle — one operation failing aborts subsequent ones

### Preferred Alternative
```php
public function configure(): static
{
    return $this
        ->afterCreating(fn (Post $post) => $post->comments()->saveMany(...))
        ->afterCreating(fn (Post $post) => $post->addMedia(...)->toMediaCollection('featured'))
        ->afterCreating(fn (Post $post) => event(new PostCreated($post)));
}
```

### Detection Checklist
- [ ] Count operations per callback — more than 2 is a warning
- [ ] Check if states can selectively enable/disable parts of the callback
- [ ] Review if callback operations could be split into separate concerns
- [ ] Check for comment separators within a single callback body

### Related
| Rule | `05-rules.md` — Keep Callback Logic Short and Single-Purpose |
| Skill | `06-skills.md` — Implement afterCreating Factory Callback |

---

## 6. `afterMaking` Used for Persistence-Dependent Logic

### Category
Reliability

### Description
Using `afterMaking()` for logic that requires the model to have a database ID (e.g., creating child relationships, attaching files that need an ID path). The callback runs on `make()` where the model has no ID.

### Why It Happens
Developers choose `afterMaking()` because "it runs earlier" or they don't distinguish between setup that needs an ID and setup that doesn't. The error may not surface immediately if the code doesn't immediately use the ID.

### Warning Signs
- `afterMaking()` callbacks that create database records referencing the model
- `afterMaking()` callbacks that use `$model->id` or `$model->getKey()`
- Errors like `Cannot insert NULL into 'model_id'` when using `make()`
- Tests using `make()` that fail with relationship-related errors
- Callbacks in `afterMaking()` that save or persist related data

### Why Harmful
- `make()` creates models without IDs — related records get null foreign keys
- Foreign key constraint violations when the related record tries to reference the main model
- Silent data corruption if the FK is nullable — related records have null references
- Tests using `make()` expect in-memory models but get database-related side effects

### Preferred Alternative
```php
public function configure(): static
{
    return $this->afterCreating(function (Post $post) {
        $post->comments()->saveMany(Comment::factory()->count(3)->make());
    });
}
```

### Detection Checklist
- [ ] Search for `afterMaking` callbacks that access `$model->id` or `$model->getKey()`
- [ ] Check if `afterMaking` callbacks create related database records
- [ ] Test factories with `make()` — do they produce errors?
- [ ] Verify `afterMaking` only does setup that doesn't require persistence
- [ ] Review which callbacks should be `afterCreating` instead

### Related
| Rule | `05-rules.md` — Use afterCreating for Persistence-Dependent Logic |
| Rule | `05-rules.md` — Use afterMaking for Non-Persisted Setup |
| Decision Tree | `07-decision-trees.md` — afterCreating vs afterMaking |
