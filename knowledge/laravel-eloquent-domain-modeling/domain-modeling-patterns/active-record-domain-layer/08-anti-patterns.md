# Active Record as Domain Layer — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Active Record as Domain Layer |
| Focus | Anti-patterns in using Active Record models as domain entities |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Anemic Domain Model With Scattered Business Logic | Design | Critical |
| 2 | Raw `update()` Calls With Status Arrays From Controllers | Design | High |
| 3 | Domain Methods Performing External Side Effects | Architecture | High |
| 4 | Missing Strict Mode Leading to Production N+1 | Performance | Medium |
| 5 | `$guarded = []` Disabling Mass Assignment Protection | Security | Critical |
| 6 | No `$hidden` Causing Sensitive Attribute Leakage | Security | Critical |

## Repository-Wide Cross-Cutting Patterns

- Controllers calling `$model->update(['status' => '...'])` instead of expressive domain methods is the most common pattern
- External side effects (email, dispatch, logging) inside model domain methods create testing nightmares
- Mass assignment protection is frequently disabled with `$guarded = []` in legacy code

---

## 1. Anemic Domain Model With Scattered Business Logic

### Category
Design

### Description
Eloquent models that serve only as data containers with public getters and setters, while all business logic resides in controllers, services, Blade templates, or helper functions. The model becomes a passive data bag with no behavioral responsibilities.

### Why It Happens
The Active Record pattern's focus on persistence (save, delete, relationships) can overshadow domain behavior. Controllers naturally accumulate logic over time. "Just one more check" in the controller or service is quicker than adding a method to the model. Rapid prototyping leaves models anemic.

### Warning Signs
- Controllers with lengthy conditionals checking model state: `if ($post->status === 'draft' && $post->user_id === auth()->id())`
- Controllers calling `$model->update(['status' => 'published', 'published_at' => now()])` directly
- The same state transition logic repeated in multiple controllers or Blade templates
- Model class with no methods other than relationships, scopes, and `$casts`
- Service classes that accept models and perform operations that could be model methods
- Blade templates with complex `@if` conditions that duplicate business rules

### Why Harmful
- Business rules are duplicated across controllers, services, and views — a change must be made in N places
- No single point of enforcement for invariants — some code paths may skip validation
- Adding a new controller or API endpoint requires reimplementing business logic
- Testing business logic requires controller integration tests instead of simple model unit tests
- The model's purpose is unclear: is it a domain entity or a persistence wrapper?

### Consequences
- Business rule violations as codebases grow and duplicated logic drifts
- Higher maintenance cost: each business rule change requires updating multiple files
- Fragile code: adding a new feature may break existing business rules in a different controller
- Onboarding difficulty: new developers must understand business rules scattered across the codebase
- Difficult refactoring: extracting domain logic later requires untangling from controllers

### Preferred Alternative
```php
class Post extends Model
{
    public function publish(): void
    {
        if ($this->status !== self::STATUS_DRAFT) {
            throw new \DomainException('Only draft posts can be published.');
        }
        $this->status = self::STATUS_PUBLISHED;
        $this->published_at = now();
        $this->save();
    }
}
```

### Refactoring Strategy
1. Identify inline state transitions in controllers: `$model->update(['status' => ...])`
2. Extract each into a named domain method on the model
3. Replace magic strings with model constants
4. Move conditional business logic (checks, guards) into the model methods
5. Update controllers to call expressive methods: `$post->publish()` instead of `$post->update(['status' => 'published'])`
6. Remove duplicated logic from services and Blade templates

### Detection Checklist
- [ ] Search for `->update(['status'` in controllers
- [ ] Check for external `if` conditions checking model attribute values
- [ ] Count model methods excluding relationships, scopes, and casts
- [ ] Review Blade templates for duplicated business conditionals
- [ ] Check service classes for logic that belongs on the model

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Encapsulate State Mutation Behind Expressive Domain Methods |
| Skill | `06-skills.md` — Add Domain Methods to an Eloquent Model |
| Decision Tree | `07-decision-trees.md` — Rich vs Anemic Domain Model |

---

## 2. Raw `update()` Calls With Status Arrays From Controllers

### Category
Design

### Description
Calling `$order->update(['status' => 'paid', 'paid_at' => now()])` directly in controllers instead of calling a named domain method like `$order->markAsPaid()`. The `update()` call bypasses invariant enforcement and scatters business logic.

### Why It Happens
Convenience: `update()` is a one-liner that works. Developers may not know the business rules surrounding status transitions. The controller "just sets the status" — the developer assumes no invariants need enforcement.

### Warning Signs
- `$model->update(['status' => ...])` in controllers, actions, or livewire components
- Multiple controllers duplicating the same `update()` call for the same status
- No model methods for standard status transitions (markAsPaid, cancel, archive)
- Business rules about transitions implemented in controller conditionals before `update()`
- Missing `updated_at` or other timestamps that should be set alongside status changes

### Why Harmful
- Each `update()` is a potential invariant bypass — business rules may be missed
- Controllers grow fat with business logic that belongs in the model
- Changing a transition's behavior requires updating every controller that uses it
- The model's public API is raw data manipulation instead of expressive behavior
- Automated status changes (cron jobs, queues) may repeat controller logic incorrectly

### Consequences
- Invariants violated when controllers forget a step in a multi-attribute update
- Business rule changes require hunting down every `update()` call with the same status
- Code review misses: a new `update()` call may look innocuous but skips validation
- Inconsistent behavior: some callers use `update()`, others use the model method
- Harder to test business rules in isolation

### Preferred Alternative
```php
class Order extends Model
{
    public function markAsPaid(): void
    {
        $this->status = 'paid';
        $this->paid_at = now();
        $this->save();
    }
}

// In controller:
$order->markAsPaid();
```

### Refactoring Strategy
1. Search for all `->update(['status' =>` patterns in the codebase
2. For each unique status value, add a domain method on the model
3. Replace `update()` calls with the appropriate domain method
4. Verify invariants are enforced in the new methods
5. Remove stale documentation about "remember to check X before updating status"

### Detection Checklist
- [ ] Search for `->update([` in controllers, actions, jobs, and commands
- [ ] Cross-reference status values with allowed transitions in domain requirements
- [ ] Check if any `update()` call sets derived attributes (totals, timestamps) that could be missed
- [ ] Verify model has domain methods for all status transitions
- [ ] Audit tests for business rule coverage — do they test model methods or controller responses?

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Encapsulate State Mutation Behind Expressive Domain Methods |
| Skill | `06-skills.md` — Add Domain Methods to an Eloquent Model |

---

## 3. Domain Methods Performing External Side Effects

### Category
Architecture

### Description
Model domain methods that call external services, dispatch jobs, send emails, log to external systems, or perform any I/O beyond the database. The model becomes coupled to infrastructure, making testing brittle and violating single responsibility.

### Why It Happens
It seems convenient: "when an order is paid, send a confirmation email." The model method is the natural place to do "everything" related to the state change. Developers may not realize that domain methods should focus on state validation and mutation only.

### Warning Signs
- `Mail::send()`, `Notification::send()`, `dispatch()`, `Log::info()` inside model methods
- Model methods accepting injected services or facades as dependencies
- Tests that must mock mail, queues, or logging to call a model method
- Exceptions from external services (SMTP failure, queue down) propagating from model methods
- Model methods with side effects that execute during test setup or seeding

### Why Harmful
- Testing requires mocking external services for even simple model operations
- Side effects execute in contexts where they shouldn't (seeding, factories, maintenance commands)
- Domain logic and infrastructure concerns are inseparable — changing email content requires modifying the model
- Side effects cannot be easily moved to async processing (queues)
- The model violates the Single Responsibility Principle

### Consequences
- Test suite brittle: model method tests require mail, queue, or log mocking
- Side effects trigger during data seeding, slowing down development
- Changing email template or notification channel requires modifying domain code
- External service failures crash business operations (order processing fails because SMTP is down)
- Harder to reprocess failed operations separately from their external effects

### Preferred Alternative
```php
// Model method — pure state mutation only
class Order extends Model
{
    public function markAsPaid(): void
    {
        $this->status = 'paid';
        $this->paid_at = now();
        $this->save();
    }
}

// Side effects in event listener or controller
$order->markAsPaid();
Event::dispatch(new OrderPaid($order->id));
```

### Refactoring Strategy
1. Identify external side effects in model methods (dispatch, Mail, Log, Http, Storage)
2. Replace side effects with domain events dispatched after the state change
3. Create event listeners or subscribers for each side effect
4. Update tests to verify domain event dispatch instead of side effect execution
5. Remove mocked dependencies from model method tests

### Detection Checklist
- [ ] Search for `dispatch(`, `Mail::`, `Log::`, `Notification::`, `Http::`, `Storage::` in model methods
- [ ] Check if model methods have dependencies injected (constructor or method parameters)
- [ ] Review test setup for mock/fake setup related to external services
- [ ] Profile test suite for slow model operations due to side effects
- [ ] Check for side effects triggered during `factory()->create()` calls

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Keep Domain Methods Free of External Side Effects |
| Skill | `06-skills.md` — Add Domain Methods to an Eloquent Model |
| Knowledge | `04-standardized-knowledge.md` — Domain methods use $this->attribute and $this->save() |

---

## 4. Missing Strict Mode Leading to Production N+1

### Category
Performance

### Description
Failing to enable `Model::shouldBeStrict()` in non-production environments, allowing lazy loading N+1 queries to go undetected during development. The performance problem reaches production before it's discovered.

### Why It Happens
Developers may not know about `shouldBeStrict()`. The method was added in Laravel 9.x and may not be in older codebases. Some teams intentionally disable it because third-party packages trigger false positives. The performance impact of N+1 isn't obvious during development with small datasets.

### Warning Signs
- No `Model::shouldBeStrict()` or `Model::preventLazyLoading()` in `AppServiceProvider`
- N+1 queries appearing in production monitoring tools (Debugbar, Telescope, Clockwork)
- Controllers accessing `$model->relation->name` without eager loading
- Repeated database queries for the same relationship in a loop
- Page load times increasing as the dataset grows, with no corresponding query count increase

### Why Harmful
- N+1 queries multiply database load: 1 query for 100 users + 100 queries for their profiles = 101 queries instead of 2
- Production traffic amplifies the problem: 10 concurrent users on a page with N+1 = 1,010 queries/minute
- Database connections saturate under load, causing cascading failures across the application
- The N+1 pattern is invisible in development with small datasets
- Fixing N+1 retroactively in production requires code changes under pressure

### Consequences
- Slow page loads under production traffic
- Database server overload from excessive query counts
- Application timeouts and 502 errors during traffic spikes
- Emergency hotfixes to add eager loading when performance is already degraded
- Increased hosting costs from unnecessary database connections

### Preferred Alternative
```php
// In AppServiceProvider
use Illuminate\Database\Eloquent\Model;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Model::shouldBeStrict(! $this->app->isProduction());
    }
}
```

### Refactoring Strategy
1. Add `Model::shouldBeStrict()` to `AppServiceProvider::boot()`
2. Address any lazy loading exceptions triggered by the change
3. Add `with()` or `load()` relationships where lazy loading was detected
4. For third-party package issues, use individual prevention methods instead
5. Monitor query counts in development to ensure the fix works

### Detection Checklist
- [ ] Check `AppServiceProvider::boot()` for strict mode configuration
- [ ] Enable `Model::preventLazyLoading()` temporarily and run the test suite
- [ ] Search for relationship access in Blade templates and views
- [ ] Review API resource `toArray()` methods for relationship access without eager loading
- [ ] Check Telescope/Debugbar for duplicate queries in development

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Enable Strict Mode to Catch Lazy Loading Early |
| Decision Tree | `07-decision-trees.md` — Strict Mode Configuration |

---

## 5. `$guarded = []` Disabling Mass Assignment Protection

### Category
Security

### Description
Setting `$guarded = []` on an Eloquent model, which disables mass assignment protection entirely. Any column in the database table can be written through `create()` or `update()` from request input.

### Why It Happens
Convenience during development: `$guarded = []` allows any attribute to be filled without maintaining the `$fillable` list. The code "works" without errors. Developers may not understand the security implications of mass assignment.

### Warning Signs
- `protected $guarded = [];` on any model
- No `$fillable` array defined on the model
- `create()` or `update()` called with `$request->all()` or `$request->validated()` directly
- Admin models where sensitive columns like `is_admin`, `role`, or `balance` are not in `$fillable`
- Models where both `$fillable` and `$guarded` are absent (both default to empty)

### Why Harmful
- Mass assignment injection: a user can send `is_admin => true` in a POST request and gain admin privileges
- Any column is writable through `create()` or `update()` — the only protection is form field omission
- Adding a new column to the database table makes it immediately writable through mass assignment
- The security boundary is opt-out instead of opt-in: every column is assumed safe unless explicitly excluded
- Sensitive columns like `password`, `api_token`, `balance` are writable by any request

### Consequences
- Privilege escalation: users setting their own `role` or `is_admin` fields
- Data corruption: users writing to columns they shouldn't (internal notes, audit fields)
- Security breach requiring emergency data remediation
- Legal liability from unauthorized data modification
- PCI-DSS or HIPAA compliance violations from unprotected sensitive fields

### Preferred Alternative
```php
protected $fillable = [
    'name', 'email', 'password',
];
```

### Refactoring Strategy
1. Identify all models with `$guarded = []` or missing `$fillable`
2. For each model, define `$fillable` with only the attributes that should be mass-assignable
3. Review all `create()` and `update()` calls to ensure only fillable attributes are used
4. Test registration, profile update, and admin flows to ensure no broken functionality
5. Remove `$guarded = []` line

### Detection Checklist
- [ ] Search for `$guarded = []` or `$guarded = array(` in all model files
- [ ] Check for models without `$fillable` AND without `$guarded`
- [ ] Review controllers using `$request->all()` in `create()` or `update()` calls
- [ ] Audit models with sensitive columns (is_admin, role, balance, api_token) for proper fillable definition
- [ ] Test mass assignment attacks: `POST /users {"name":"test","is_admin":true}`

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Protect Mass Assignment with Explicit Fillable Attributes |
| Knowledge | `04-standardized-knowledge.md` — Mass assignment protection |

---

## 6. No `$hidden` Causing Sensitive Attribute Leakage

### Category
Security

### Description
Failing to define `$hidden` on Eloquent models, causing sensitive attributes (passwords, tokens, API keys) to be included in JSON and array serialization. This leaks secrets through API responses, logs, and queue jobs.

### Why It Happens
The model "works fine" without `$hidden` — sensitive data is there but not exposed in the UI. Developers may not realize that `toArray()` and `toJson()` include all attributes by default. Security review catches the issue later, if at all.

### Warning Signs
- No `$hidden` array on models with password, token, or other sensitive columns
- API responses showing `password`, `api_token`, `remember_token`, or `secret` fields
- Log files containing serialized model data with exposed secrets
- Queue job payloads with sensitive model attributes visible in the queue dashboard
- `toArray()` or `toJson()` output in Telescope/debug toolbar containing sensitive data

### Why Harmful
- Password hashes exposed in API responses — attackers can attempt offline cracking
- API tokens leaked — users can impersonate other users
- Secrets in log files persist for log retention periods, creating a long-term security risk
- Queue system UIs (Horizon, RabbitMQ) display serialized job data, exposing secrets to operators
- Third-party integrations receiving serialized models get sensitive data they shouldn't have

### Consequences
- Account takeover via leaked password hashes or API tokens
- Security breach requiring password resets for all users
- PCI-DSS compliance violations from exposed credentials
- Reputation damage from disclosed security incident
- Legal liability from exposed personal access tokens

### Preferred Alternative
```php
protected $hidden = [
    'password', 'api_token', 'remember_token', 'secret_key',
];
```

### Refactoring Strategy
1. Identify all models with columns containing sensitive data but no `$hidden` array
2. Add `$hidden` with all sensitive attribute names
3. For models that need selective exposure, use `$visible` or `makeVisible()` for specific contexts
4. Check API Resources that may override `$hidden` — ensure they don't re-expose hidden attributes
5. Clear any log files or monitoring data that may contain the leaked attributes

### Detection Checklist
- [ ] Search for models with `password` column but no `password` in `$hidden`
- [ ] Check for `api_token`, `secret`, `token`, `key` columns in migrations and cross-ref with `$hidden`
- [ ] Test `$model->toArray()` output for models with sensitive columns
- [ ] Review API Resources for `makeVisible()` calls that could expose sensitive data
- [ ] Inspect Telescope/Horizon data for exposed model attributes

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Hide Sensitive Attributes from Serialization |
| Knowledge | `04-standardized-knowledge.md` — Sensitive attributes should be $hidden |
