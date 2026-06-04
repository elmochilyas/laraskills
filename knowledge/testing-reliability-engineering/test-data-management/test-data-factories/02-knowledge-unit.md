# Metadata
- **Domain:** Testing & Reliability Engineering
- **Subdomain:** Test Data Management
- **Knowledge Unit:** Test Data Factories (States & Sequences)
- **KU Code:** ku-01-test-data-factories
- **Last Updated:** 2026-06-02

---

# Executive Summary
Laravel model factory states and sequences provide a declarative DSL for creating test data with specific attributes and ordered variations. States (`->state()`) define reusable attribute presets (draft, published, archived). Sequences (`->sequence()`) apply different attribute sets to each created model in order. These features reduce test setup verbosity, encode domain vocabulary, and improve test readability. They are the primary mechanism for creating focused, intent-revealing test data in Laravel applications.

---

# Core Concepts
- **State:** A named attribute configuration defined as a factory method returning `$this->state([...])`.
- **`->state()`:** Applies a state to a factory instance. Can be chained. Last state wins on attribute conflicts.
- **`->sequence()`:** Applies different attribute sets to each created model sequentially. Wraps around if more models than sequence items.
- **`$sequence` callback:** Receives `$sequence` object with 0-based `index` and `count` properties for dynamic values.
- **`afterCreating` / `afterMaking`:** Factory callbacks that execute after model persistence or instantiation.
- **`->has()`:** Declarative relationship creation preferred over `afterCreating` for scenario-specific data.

---

# Mental Models
- **State as adjective:** `published()` modifies a model the way an adjective modifies a noun. The base factory is the noun; states add descriptive qualities.
- **Sequence as iteration:** A sequence is a concise `foreach` loop. Use it when creating N models that need N different variations.
- **Attribute precedence ladder:** `create()` overrides > last-applied state > first-applied state > base factory definition.

---

# Internal Mechanics
- **State chaining:** Each `->state()` returns a new factory instance with merged attribute overrides. `Factory::state()` calls `mergeAttributes()` internally.
- **Sequence iteration:** Laravel tracks sequence state per `create()` call. Each `create()` has an independent sequence pointer.
- **afterCreating execution:** Runs after the model's `save()`. The model has an ID. Use for relationships that require the parent's primary key.
- **Factory model resolution:** Laravel resolves the factory class for a model via `Factory::factoryForModel()` or the `HasFactory` trait convention.

---

# Patterns
- **State chaining:** `Post::factory()->published()->featured()->create()`
- **Dynamic sequence callback:** `User::factory(5)->sequence(fn ($seq) => ['email' => "user{$seq->index}@example.com"])->create()`
- **afterCreating for required relationships:** Profile creation on user signup that always exists.
- **State-as-domain-verb:** `published()` not `statusPublished()`.

---

# Architectural Decisions
| Decision | Rationale |
|----------|-----------|
| States over inline attributes for reuse | Encodes domain vocabulary; DRY across tests |
| `->has()` over `afterCreating` for scenarios | Explicit at call site; no hidden side effects |
| Sequences over explicit loops for 2-10 items | More concise; less boilerplate |
| Deterministic over Faker values in states | Prevents flaky tests from time-varying data |

---

# Tradeoffs
| Tradeoff | Pros | Cons |
|----------|------|------|
| many small states | Highly expressive combinations | State explosion if every combo gets a method |
| afterCreating convenience | Automatic relationship setup | Hidden side effects; reader can't see what's created |
| Sequence wrapping | No error on overflow | Surprise values if count mismatch |

---

# Performance Considerations
- **State evaluation:** Attribute array merge. Negligible overhead.
- **Sequence iteration:** O(n) linear. Fine for <100 items.
- **afterCreating hooks:** Add model creation time. For large batches (100+), consider `HasMany` via `->has()` for bulk inserts.
- **Factory resolution:** Cached per test class via `Factory::resolveFactoryName()`.

---

# Production Considerations
- **Deterministic data is security:** States should not produce sensitive or PII-like placeholder data.
- **afterCreating side effects:** Hooks may trigger notifications, emails, or external API calls. Use `->withoutEvents()` when appropriate.
- **Factory state docs:** Document available states in factory class docblocks so team discovers them.

---

# Common Mistakes
- **Non-deterministic state data:** Using `now()` instead of `Carbon::yesterday()` or frozen time.
- **Overusing afterCreating:** Creating related models for every test when only some need them.
- **State name collisions:** Two states overriding the same attribute — last one wins silently.
- **Sequence wrapping assumption:** Assuming creating more models than sequence items throws an error.

---

# Failure Modes
- **State attribute becomes invalid:** A state references a removed/deprecated database column. Factory creation fails on migration.
- **Sequence state leak:** Assuming sequence pointer persists across unrelated `create()` calls. Each call is independent.
- **afterCreating infinite loop:** Callback creates the same model type (e.g., User afterCreating creates another User). Stack overflow.

---

# Ecosystem Usage
- **Laravel factories:** Built-in via `Illuminate\Database\Eloquent\Factories\Factory`
- **Pest factories:** `use Pest\Datasets;` for shared factory data across tests
- **Test data builders:** Third-party packages like `sashakh/generator` for complex object graphs

---

# Related Knowledge Units
- ku-02-test-data-seeding (Declarative factory methods)
- ku-03-test-data-cleanup (Minimal data principle)
- ku-04-test-data-relationships (Relationship factories)
- ku-05-test-data-dto (DTO test factories)

---

# Research Notes
- Laravel docs (2026): States are the recommended pattern for reusable test data. Sequences preferred for small batches.
- Origin Main (2026): Factory states encode domain vocabulary — `published()` is more expressive than `['status' => 'published']`.
- Benjamin Crozat (2026): "Prefer `->has()` over `afterCreating` for all scenario-specific relationships."
