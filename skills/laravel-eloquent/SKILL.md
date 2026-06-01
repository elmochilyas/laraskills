# Laravel 13 Expert Skill: Advanced Eloquent Architecture, Performance & Domain Modeling

## When to Use

Use this skill when building Laravel 13 applications that require deep Eloquent knowledge: complex relationship mapping, query performance optimization, domain-driven model design, and advanced ORM features. This is the definitive reference for Eloquent beyond simple CRUD.

---

## Core Philosophy

### Eloquent Is Not Your Architecture

Eloquent is:
- ORM (Object-Relational Mapper)
- Data Mapper Hybrid
- Query Builder
- Persistence Layer

Eloquent is NOT:
- Business Layer
- Application Layer
- Domain Layer

Models can contain domain behavior, but infrastructure concerns belong elsewhere. Avoid "Fat Models" that mix unrelated business logic, email sending, API calls, and file generation.

### Architecture Flow

```
Controller (thin — validation, auth, response)
    ↓
Action / DTO (orchestration, type-safe data)
    ↓
Domain Service (business logic)
    ↓
Repository / Query Object / Custom Builder
    ↓
Model / Eloquent (persistence)
    ↓
Database
```

---

## 1. Relationships

### General Rules

**Always define explicit relationships** — never access `$post->user_id` directly.

```php
// BAD
$userId = $post->user_id;

// GOOD
$post->user;
```

**Always declare return types** on relationship methods:

```php
public function user(): BelongsTo
{
    return $this->belongsTo(User::class);
}

public function posts(): HasMany
{
    return $this->hasMany(Post::class);
}

public function roles(): BelongsToMany
{
    return $this->belongsToMany(Role::class);
}
```

**Naming conventions:**
- Singular for single relations: `user()`, `profile()`, `company()`, `subscription()`
- Plural for collections: `posts()`, `comments()`, `roles()`, `tags()`

---

### 1.1 Morph Relations (Polymorphic Single)

Use when multiple model types can own a single related model. Best for: comments, media, attachments, activity logs, notifications, likes.

```php
// Comment belongs to Post, Video, or Product
class Comment extends Model
{
    public function commentable(): MorphTo
    {
        return $this->morphTo();
    }
}

class Post extends Model
{
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}

class Video extends Model
{
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}
```

#### Best Practices

**Always use Morph Maps** to avoid storing raw class names in the database:

```php
use Illuminate\Database\Eloquent\Relations\Relation;

Relation::enforceMorphMap([
    'post' => \App\Models\Post::class,
    'video' => \App\Models\Video::class,
    'product' => \App\Models\Product::class,
]);
```

Benefits: cleaner database values, refactor safety (rename classes without migration), shorter payloads in APIs.

Register morph maps in `AppServiceProvider::boot()` or a dedicated `MorphMapServiceProvider`.

**Always index morph columns:**

```php
// Migration
$table->morphs('commentable');
// This creates: commentable_type (VARCHAR) + commentable_id (BIGINT) with a composite index
```

The composite index on `(commentable_type, commentable_id)` is critical for performance. Without it, polymorphic queries scan all rows.

---

### 1.2 Polymorphic Many-to-Many (MorphpToMany)

Use when many model types share a common many-to-many relationship. Best for: tags, categories, permissions, labels, metadata.

```php
// Tag can belong to Post, Product, Video, or Course
class Tag extends Model
{
    public function posts(): MorphedByMany
    {
        return $this->morphedByMany(Post::class, 'taggable');
    }

    public function products(): MorphedByMany
    {
        return $this->morphedByMany(Product::class, 'taggable');
    }
}

// Post can have many Tags
class Post extends Model
{
    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable');
    }
}
```

```php
// Migration for the pivot table
Schema::create('taggables', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
    $table->morphs('taggable'); // taggable_id + taggable_type with index
    $table->unique(['tag_id', 'taggable_id', 'taggable_type']);
});
```

#### Best Practices

**Keep pivot tables lightweight** — store only `taggable_type`, `taggable_id`, `tag_id`. Avoid business data in polymorphic pivots; use a dedicated model if you need extra pivot columns.

**Index every foreign key** in the pivot:

```php
$table->index('tag_id');
$table->morphs('taggable'); // already indexed
```

---

### 1.3 Has One Through

Use for accessing distant relations where the intermediate relationship is guaranteed singular.

```text
User → Account → Subscription
```

```php
class User extends Model
{
    public function subscription(): HasOneThrough
    {
        return $this->hasOneThrough(
            Subscription::class,
            Account::class,
            'user_id',   // Foreign key on accounts table
            'account_id', // Foreign key on subscriptions table
            'id',         // Local key on users table
            'id'          // Local key on accounts table
        );
    }
}

// Usage
$user->subscription; // Subscription model, no intermediate query needed
```

**Use only when the chain is guaranteed singular.** If a user could have multiple accounts, use `HasManyThrough` instead.

---

### 1.4 Has Many Through

Use for accessing distant collections through an intermediate relation. The most common "deep relationship" pattern.

```text
Country → Users → Posts
```

```php
class Country extends Model
{
    public function posts(): HasManyThrough
    {
        return $this->hasManyThrough(
            Post::class,
            User::class,
            'country_id', // Foreign key on users table
            'user_id',    // Foreign key on posts table
            'id',         // Local key on countries table
            'id'          // Local key on users table
        );
    }
}

// Usage — single query, no nested loops
$country->posts; // Collection of all posts from users in this country
```

**Avoid nested loop patterns:**

```php
// BAD — N+1: 1 query for countries + N queries for each country's users + M queries for each user's posts
foreach ($countries as $country) {
    foreach ($country->users as $user) {
        foreach ($user->posts as $post) { ... }
    }
}

// GOOD — single query
$countries = Country::with('posts')->get();
foreach ($countries as $country) {
    foreach ($country->posts as $post) { ... }
}
```

---

### 1.5 Deep / Nested Relationships

Eloquent supports eager loading to arbitrary depth:

```php
// Load nested relations three levels deep
$countries = Country::with([
    'users',
    'users.posts',
    'users.posts.comments',
    'users.posts.comments.author',
])->get();
```

**Rule of thumb:** If a relationship chain exceeds 4 levels, consider:
1. Denormalizing some data for read performance
2. Using a dedicated read model (see Event Sourcing)
3. Caching the aggregated result

---

## 2. Performance

### 2.1 N+1 Prevention

N+1 queries are production bugs. Never ship them.

```php
// BAD — 1 + N queries
$posts = Post::all();
foreach ($posts as $post) {
    echo $post->user->name; // N additional queries
}

// GOOD — 2 queries total
$posts = Post::with('user')->get();

// GOOD — multiple relations
$posts = Post::with(['user', 'comments', 'tags'])->get();
```

**Development Protection — always enable in local/testing:**

```php
// AppServiceProvider::boot()
Model::preventLazyLoading(!$this->app->isProduction());
```

This throws exceptions when lazy loading is detected. Required for all projects with more than a few models.

**Production fallback — log instead of throw:**

```php
Model::preventLazyLoading(false);
Model::handleLazyLoadingViolationUsing(function (Model $model, string $relation) {
    Log::warning("Lazy loading detected", [
        'model' => get_class($model),
        'relation' => $relation,
    ]);
});
```

**Prevent N+1 in serialization** — always load relations before passing to API Resources:

```php
// BAD — lazy loads per resource
PostResource::collection(Post::all());

// GOOD — eager loaded
PostResource::collection(Post::with('user', 'comments')->get());
```

---

### 2.2 Eager Loading Constraints

Load only the records you actually need from relationships:

```php
// BAD — loads ALL posts for every user
User::with('posts')->get();

// GOOD — constrained eager load
User::with([
    'posts' => fn (Builder $query) => $query
        ->where('is_published', true)
        ->whereDate('created_at', '>=', now()->subMonth())
        ->orderBy('created_at', 'desc')
        ->limit(10)
])->get();
```

Benefits: less memory, faster queries, smaller payloads.

**Eager loading with existence checks:**

```php
// Users who HAVE posts (with constraint)
User::has('posts')->get();

// Users with at least 5 published posts
User::has('posts', '>=', 5)->get();

// Users with posts matching a condition
User::whereHas('posts', fn (Builder $q) => $q->where('is_published', true))->get();

// Users who DON'T have posts
User::doesntHave('posts')->get();
User::whereDoesntHave('posts', fn (Builder $q) => $q->where('is_published', true))->get();
```

---

### 2.3 Lazy Eager Loading

Use when relationship requirements are discovered later in request processing:

```php
$users = User::all();

if ($request->boolean('include_posts')) {
    $users->load('posts');
}

if ($request->boolean('include_comments')) {
    $users->load('comments');
}
```

**Prefer normal eager loading whenever possible.** Lazy loading should only be used when the loading decision is conditional.

**Conditional loading with callback:**

```php
$users->load(['posts' => fn (Builder $q) => $q->where('is_published', true)]);
```

---

### 2.4 Selective Columns

**Never use SELECT \* in production queries.**

```php
// BAD — selects all columns (50+ columns on a users table)
User::all();

// GOOD — select only what you need
User::select(['id', 'name', 'email'])->get();

// GOOD — relationship select
User::with(['posts:id,user_id,title,published_at'])->get();
```

**Always specify columns in relationship eager loads** to reduce memory dramatically:

```php
// BAD — loads all post columns
User::with('posts')->get();

// GOOD — loads only needed columns
User::with('posts:id,user_id,title,published_at')->get();
```

**For API responses, use API Resources to control serialization:**

```php
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'posts' => PostResource::collection($this->whenLoaded('posts')),
        ];
    }
}
```

---

### 2.5 Aggregate Relationships

**Prefer database aggregation over collection methods:**

```php
// BAD — loads ALL posts into memory just to count
$user->posts->count();

// GOOD — single SQL COUNT query
User::withCount('posts')->get();
$user->posts_count;

// GOOD — check existence without loading records
User::has('posts', '>=', 3)->get();
```

**Available aggregates:**

```php
User::withCount('posts')              // COUNT
User::withExists('posts')             // EXISTS (boolean)
User::withAvg('ratings', 'score')     // AVG
User::withSum('orders', 'amount')     // SUM
User::withMin('orders', 'amount')     // MIN
User::withMax('orders', 'amount')     // MAX
```

**Combining multiple aggregates in a single query:**

```php
User::withCount('posts')
    ->withSum('orders', 'amount')
    ->withAvg('ratings', 'score')
    ->get();
```

**Always push calculations to the database.** Never load collections for aggregation.

---

## 3. Model Design

### 3.1 DTO Pattern

**Never pass raw request data through application layers.**

```php
// BAD
$service->create($request->all());

// GOOD
$service->create(CreateUserData::fromRequest($request));
```

**DTO definition:**

```php
readonly class CreateUserData
{
    public function __construct(
        public string  $name,
        public string  $email,
        public string  $password,
        public ?Carbon $emailVerifiedAt = null,
        public bool    $isAdmin = false,
    ) {}

    public static function fromRequest(StoreUserRequest $request): self
    {
        return new self(
            name: $request->validated('name'),
            email: $request->validated('email'),
            password: $request->validated('password'),
        );
    }
}
```

**DTOs ensure:**
- Validation safety — validated data enters domain layer
- Type safety — no loose arrays or `mixed` types
- Explicit contracts — every parameter is documented via types
- Immutability — `readonly` properties prevent mutation

---

### 3.2 Value Objects

Use for domain concepts that have intrinsic validation and behavior.

```php
readonly class Email
{
    public function __construct(public string $value)
    {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException("Invalid email: $value");
        }
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }
}

readonly class Money
{
    public function __construct(
        public int    $cents,
        public string $currency = 'USD',
    ) {
        if ($cents < 0) {
            throw new \DomainException('Money cannot be negative');
        }
    }

    public static function fromFloat(float $amount, string $currency = 'USD'): self
    {
        return new self((int) round($amount * 100), $currency);
    }

    public function toFloat(): float
    {
        return $this->cents / 100;
    }

    public function add(self $other): self
    {
        if ($this->currency !== $other->currency) {
            throw new \DomainException('Cannot add different currencies');
        }
        return new self($this->cents + $other->cents, $this->currency);
    }
}

readonly class Address
{
    public function __construct(
        public string $street,
        public string $city,
        public string $postalCode,
        public string $country,
    ) {}
}
```

**Value Object rules:**
- Immutable — all properties `readonly`
- Self-validating — constructor throws on invalid state
- Comparable by value — `equals()` method
- No identity — two objects with same values are considered equal

**Using Value Objects with Eloquent:**

```php
// In model
protected function email(): Attribute
{
    return Attribute::make(
        get: fn (string $value) => new Email($value),
        set: fn (Email $value) => $value->value,
    );
}

// Or with custom cast
protected $casts = [
    'address' => AddressCast::class,
    'price' => MoneyCast::class,
];
```

---

### 3.3 Rich Domain Models

Models may contain domain behavior, but must remain focused on the aggregate root's responsibilities.

**Allowed — domain behavior that belongs on the model:**

```php
class Order extends Model
{
    public function markAsPaid(): void
    {
        $this->status = OrderStatus::Paid;
        $this->paid_at = now();
        $this->save();
    }

    public function cancel(): void
    {
        if ($this->status === OrderStatus::Shipped) {
            throw new \DomainException('Cannot cancel shipped order');
        }
        $this->status = OrderStatus::Cancelled;
        $this->cancelled_at = now();
        $this->save();
    }

    public function archive(): void
    {
        $this->archived_at = now();
        $this->save();
    }

    public function isOverdue(): bool
    {
        return $this->status === OrderStatus::Pending
            && $this->created_at->addDays(30)->isPast();
    }
}
```

**Forbidden — infrastructure concerns on the model:**

```php
// NEVER do this
class Order extends Model
{
    public function sendConfirmationEmail(): void  // INFRASTRUCTURE
    {
        Mail::to($this->user)->send(new OrderConfirmation($this));
    }

    public function generatePdf(): string  // INFRASTRUCTURE
    {
        // PDF generation logic...
    }

    public function uploadToS3(): void  // INFRASTRUCTURE
    {
        Storage::disk('s3')->put(...);
    }

    public function notifyCrm(): void  // INFRASTRUCTURE
    {
        Http::post(config('services.crm.url'), ...);
    }
}
```

**Use Events to decouple model behavior from infrastructure:**

```php
class Order extends Model
{
    protected $dispatchesEvents = [
        'paid' => OrderPaid::class,
        'cancelled' => OrderCancelled::class,
    ];

    public function markAsPaid(): void
    {
        $this->status = OrderStatus::Paid;
        $this->paid_at = now();
        $this->save();

        event(new OrderPaid($this)); // Decoupled — listeners handle email, PDF, CRM
    }
}
```

---

### 3.4 Repository Alternatives

Many Laravel projects overuse the Repository pattern, creating classes that simply wrap Eloquent:

```php
// AVOID — adds zero value
class UserRepository
{
    public function find(int $id): ?User { return User::find($id); }
    public function create(array $data): User { return User::create($data); }
    public function update(User $user, array $data): bool { return $user->update($data); }
    public function delete(User $user): ?bool { return $user->delete(); }
}
```

**Preferred alternatives:**

#### Query Objects

Encapsulate complex, reusable queries:

```php
class PublishedPostQuery
{
    public function __invoke(Builder $query): Builder
    {
        return $query
            ->where('is_published', true)
            ->where('published_at', '<=', now());
    }

    public static function apply(Builder $query): Builder
    {
        return (new self)($query);
    }
}

// Usage in controller or action
$posts = Post::query()->tap(new PublishedPostQuery)->get();
```

#### Actions

Single-purpose operations with explicit DTOs:

```php
class CreateOrderAction
{
    public function __construct(
        private InventoryService $inventory,
        private EventDispatcherInterface $events,
    ) {}

    public function execute(CreateOrderData $dto): Order
    {
        return DB::transaction(function () use ($dto) {
            $order = Order::create([...]);
            $this->inventory->reserve($dto->items);
            $this->events->dispatch(new OrderCreated($order));
            return $order;
        });
    }
}
```

#### Custom Builders

See section 4.3 below — use when query logic grows across models.

#### Domain Services

Use for business logic that spans multiple models but doesn't belong on any single one:

```php
class SubscriptionService
{
    public function __construct(
        private PaymentGatewayInterface $gateway,
        private EventDispatcherInterface $events,
    ) {}

    public function renew(Subscription $subscription): void
    {
        $result = $this->gateway->charge($subscription->price, $subscription->paymentMethod);
        $subscription->renew($result->transactionId);
        $this->events->dispatch(new SubscriptionRenewed($subscription));
    }
}
```

**Decision guide:**
| Need | Solution |
|------|----------|
| Simple CRUD | Eloquent model directly |
| Reusable query logic | Query Object or Custom Builder |
| Single business operation | Action |
| Cross-model orchestration | Domain Service |
| Complex query with joins/reporting | `DB::query()` / Query Builder |

---

## 4. Advanced Features

### 4.1 Global Scopes

Use for constraints that must apply to every query on a model. Best for: multi-tenancy, soft deletes, active-only records, published-only records.

```php
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class ActiveScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $builder->where('is_active', true);
    }
}
```

**Applying via attribute (Laravel 13):**

```php
use Illuminate\Database\Eloquent\Attributes\ScopedBy;

#[ScopedBy(ActiveScope::class)]
class Product extends Model {}
```

**Removing global scopes when needed:**

```php
// Remove one scope
Product::withoutGlobalScope(ActiveScope::class)->get();

// Remove all global scopes
Product::withoutGlobalScopes()->get();

// Remove specific scopes by class
Product::withoutGlobalScopes([ActiveScope::class, AnotherScope::class])->get();
```

**Rules:**
- Global scopes must be predictable and documented
- Provide `withoutGlobalScope()` escape hatches
- Never hide business-altering logic in global scopes
- Consider using local scopes (always explicit) instead when possible

---

### 4.2 Local Scopes

Use for frequently chained query constraints. Prefer local scopes over global scopes for most cases because they are explicit.

```php
class Post extends Model
{
    public function scopePublished(Builder $query): Builder
    {
        return $query->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function scopeFromCategory(Builder $query, string $slug): Builder
    {
        return $query->whereHas('category', fn (Builder $q) => $q->where('slug', $slug));
    }

    public function scopeWithMinimumViews(Builder $query, int $count = 100): Builder
    {
        return $query->where('views_count', '>=', $count);
    }
}
```

**Composable usage:**

```php
$posts = Post::published()
    ->fromCategory('laravel')
    ->withMinimumViews(500)
    ->orderBy('published_at', 'desc')
    ->paginate(20);
```

**Rules:**
- Scopes must be composable — each does ONE thing
- Name scopes as adjectives/adverbs: `published()`, `active()`, `recent()`, `verified()`, `premium()`
- Avoid combined scopes: `publishedRecentPremium()` — break into `published()->recent()->premium()`
- Type-hint `Builder` return type for IDE support

---

### 4.3 Custom Builders

When query logic grows beyond simple scopes, create a custom builder class.

```php
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;

class UserBuilder extends EloquentBuilder
{
    public function premium(): self
    {
        return $this->where('is_premium', true);
    }

    public function verified(): self
    {
        return $this->whereNotNull('email_verified_at');
    }

    public function activeSince(Carbon $date): self
    {
        return $this->where('last_login_at', '>=', $date);
    }

    public function withRecentPosts(int $limit = 5): self
    {
        return $this->with(['posts' => fn (Builder $q) => $q->latest()->limit($limit)]);
    }
}

// Register on the model
class User extends Model
{
    public function newEloquentBuilder($query): UserBuilder
    {
        return new UserBuilder($query);
    }
}
```

**Usage:**

```php
$users = User::query()
    ->premium()
    ->verified()
    ->activeSince(now()->subDays(30))
    ->withRecentPosts()
    ->paginate();
```

**Benefits:** reuse, readability, discoverability, IDE support.

---

### 4.4 Query Macros

Use for application-wide reusable query logic that isn't tied to a single model.

```php
use Illuminate\Database\Eloquent\Builder;

// In AppServiceProvider::boot()
Builder::macro('whereLike', function (string $column, string $value): Builder {
    return $this->where($column, 'LIKE', "%{$value}%");
});

Builder::macro('whereActive', function (): Builder {
    return $this->where('is_active', true);
});

Builder::macro('whereDateRange', function (string $column, ?Carbon $from, ?Carbon $to): Builder {
    if ($from) $this->where($column, '>=', $from);
    if ($to) $this->where($column, '<=', $to);
    return $this;
});
```

**Usage on any model:**

```php
User::whereLike('email', '@example.com')->whereActive()->get();
Post::whereLike('title', 'Laravel')->whereDateRange('created_at', $from, $to)->get();
```

**Good for:** date filtering, search filtering, tenant filtering, status filtering.

**Avoid:** macros that perform joins or complex logic that could be better expressed as a custom builder or scope.

---

### 4.5 Cast Classes & Custom Casts

**Use custom casts for complex data types** instead of manually encoding/decoding everywhere.

#### Custom Cast

```php
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

class AddressCast implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): Address
    {
        $data = json_decode($value, true);
        return new Address(
            street: $data['street'],
            city: $data['city'],
            postalCode: $data['postal_code'],
            country: $data['country'],
        );
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): string
    {
        if ($value instanceof Address) {
            return json_encode([
                'street' => $value->street,
                'city' => $value->city,
                'postal_code' => $value->postalCode,
                'country' => $value->country,
            ]);
        }
        return json_encode($value);
    }
}

// Usage on model
protected $casts = [
    'address' => AddressCast::class,
];
```

#### Value Object Cast

```php
class MoneyCast implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): Money
    {
        return Money::fromFloat((float) $value, $attributes['currency'] ?? 'USD');
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): float
    {
        return $value instanceof Money ? $value->toFloat() : (float) $value;
    }
}

// Usage
protected $casts = [
    'price' => MoneyCast::class,
];
```

#### Inbound Cast (read-only)

```php
class UppercaseCast implements CastsInboundAttributes
{
    public function set(Model $model, string $key, mixed $value, array $attributes): string
    {
        return strtoupper($value);
    }
}
```

---

### 4.6 Encrypted Casts

Use for sensitive data that must be encrypted at rest.

```php
protected $casts = [
    'ssn' => 'encrypted',
    'passport_number' => 'encrypted',
    'tax_id' => 'encrypted',
    'bank_account' => 'encrypted',
    'api_key' => 'encrypted',
];
```

**Security rules:**
- Never encrypt searchable/filterable fields — encrypted fields cannot be indexed efficiently
- Laravel uses AES-256-CBC with the application key
- Add `->unique()` validation alongside encryption for sensitive identifiers
- Consider using a separate encryption key for user data vs application data

**Searching encrypted data:**

```php
// BAD — won't work (encrypted values differ each time)
User::where('ssn', $ssn)->first();

// GOOD — hash the value for lookup
User::where('ssn_hash', hash('sha256', $ssn))->first();

// Store both encrypted + hashed:
protected $casts = [
    'ssn' => 'encrypted',
];
// Also migrate: $table->string('ssn_hash')->index();
```

---

### 4.7 Enum Casts

Use PHP native enums for finite state values.

```php
namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Shipped = 'shipped';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';
    case Refunded = 'refunded';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending Payment',
            self::Paid => 'Payment Received',
            self::Shipped => 'In Transit',
            self::Delivered => 'Completed',
            self::Cancelled => 'Cancelled',
            self::Refunded => 'Refunded',
        };
    }

    public function isPayable(): bool
    {
        return $this === self::Pending;
    }

    public function isCancellable(): bool
    {
        return in_array($this, [self::Pending, self::Paid]);
    }
}
```

**Usage on model:**

```php
protected $casts = [
    'status' => OrderStatus::class,
    'role' => UserRole::class,
    'payment_method' => PaymentMethod::class,
];
```

**Benefits:** type safety, IDE autocompletion, reduced bugs from misspelled strings, business logic centralized on the enum.

**Backed enums** (`: string` or `: int`) automatically serialize to their value in the database and deserialize to the enum instance.

---

### 4.8 Model Events / Observers

#### Model Events

Eloquent fires events throughout the model lifecycle:

| Event | When |
|-------|------|
| `retrieved` | Model fetched from DB |
| `creating` / `created` | Before / after insert |
| `updating` / `updated` | Before / after update |
| `saving` / `saved` | Before / after insert OR update |
| `deleting` / `deleted` | Before / after delete |
| `restoring` / `restored` | Before / after soft delete restore |
| `replicating` | Model being cloned |

```php
class Order extends Model
{
    protected $dispatchesEvents = [
        'paid' => OrderPaid::class,
        'cancelled' => OrderCancelled::class,
    ];
}
```

#### Model Observers

For cleaner organization when handling multiple events for one model:

```php
class PostObserver
{
    public function creating(Post $post): void
    {
        $post->user_id ??= auth()->id();
        $post->slug ??= Str::slug($post->title);
    }

    public function created(Post $post): void
    {
        Log::info('Post created', ['id' => $post->id, 'title' => $post->title]);
        Cache::tags(['posts'])->flush();
    }

    public function updated(Post $post): void
    {
        Cache::tags(['posts'])->flush();
    }

    public function deleted(Post $post): void
    {
        Cache::tags(['posts'])->flush();
    }

    public function saving(Post $post): void
    {
        if ($post->isDirty('title') && !$post->isDirty('slug')) {
            $post->slug = Str::slug($post->title);
        }
    }
}
```

**Registering observers:**

```php
// AppServiceProvider::boot()
Post::observe(PostObserver::class);
```

Alternatively with Laravel 13 attributes:

```php
use Illuminate\Database\Eloquent\Attributes\ObservedBy;

#[ObservedBy(PostObserver::class)]
class Post extends Model {}
```

**Allowed observer responsibilities:**
- Auditing / logging
- Cache invalidation
- Slug / UUID generation
- Search index updates

**Forbidden observer responsibilities:**
- Payment processing
- Email sending (use events + listeners instead)
- External API calls (use events + listeners)
- Complex business workflows

Observers should remain lightweight. Heavy side effects belong in event listeners.

---

### 4.9 Domain Events

Business events decouple workflows. Instead of a service that directly calls multiple subsystems:

```php
class OrderService
{
    // BAD — tightly coupled, hard to extend
    public function markAsPaid(Order $order): void
    {
        $order->markAsPaid();
        Mail::to($order->user)->send(new OrderConfirmation($order));
        $this->crm->syncOrder($order);
        $this->analytics->trackOrder($order);
        $this->inventory->decrement($order);
    }
}
```

**Use domain events:**

```php
// 1. Define the event
class OrderPaid
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly Order $order) {}
}

// 2. Dispatch from model or action
class OrderService
{
    public function markAsPaid(Order $order): void
    {
        $order->markAsPaid();
        event(new OrderPaid($order));
    }
}

// 3. Handle in listeners (each is independent, testable)
class SendOrderConfirmationListener
{
    public function handle(OrderPaid $event): void
    {
        Mail::to($event->order->user)->send(...);
    }
}

class SyncCrmListener
{
    public function handle(OrderPaid $event): void
    {
        $this->crm->syncOrder($event->order);
    }
}

class UpdateInventoryListener
{
    public function handle(OrderPaid $event): void
    {
        $this->inventory->decrement($event->order);
    }
}

class TrackAnalyticsListener
{
    public function handle(OrderPaid $event): void
    {
        $this->analytics->trackOrder($event->order);
    }
}

// 4. No EventServiceProvider needed — auto-discovery handles it
// when the handle method type-hints the event class
```

**Benefits:**
- Decoupled workflows — add/remove listeners without modifying core logic
- Testable in isolation — each listener is a single-responsibility class
- Queued listeners — implement `ShouldQueue` for async processing
- Multiple channels — same event can trigger email, SMS, Slack, and database updates

---

### 4.10 Event Sourcing Patterns

Use event sourcing when full audit history, temporal queries, or complex compliance is required.

#### Full Event Sourcing (with a dedicated package like `spatie/laravel-event-sourcing`)

```text
Command
   ↓
Aggregate Root (business logic)
   ↓
Domain Events (facts)
   ↓
Event Store (append-only)
   ↓
Projectors (build read models)
   ↓
Read Models (query-optimized)
```

#### Pattern: Stored Model Events (lightweight audit trail)

For applications that need audit history without full event sourcing infrastructure:

```php
// Migration
Schema::create('model_events', function (Blueprint $table) {
    $table->id();
    $table->morphs('eventable');            // Polymorphic — any model
    $table->string('event_type');           // 'created', 'updated', 'paid', 'cancelled'
    $table->json('old_values')->nullable(); // Before state
    $table->json('new_values');             // After state
    $table->text('notes')->nullable();      // Human-readable description
    $table->foreignId('user_id')->nullable(); // Who performed the action
    $table->timestamps();

    $table->index('event_type');
    $table->index(['eventable_type', 'eventable_id']);
});

// Model
class ModelEvent extends Model
{
    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    public function eventable(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

**Recording events:**

```php
class OrderObserver
{
    public function saved(Order $order): void
    {
        if ($order->wasRecentlyCreated) {
            $this->recordEvent($order, 'created');
            return;
        }

        if ($order->isDirty('status')) {
            $this->recordEvent($order, 'status_changed', [
                'old' => $order->getOriginal('status'),
                'new' => $order->status,
            ]);
        }
    }

    public function deleted(Order $order): void
    {
        $this->recordEvent($order, 'deleted');
    }

    private function recordEvent(Model $model, string $type, ?array $extra = null): void
    {
        $model->morphMany(ModelEvent::class, 'eventable')->create([
            'event_type' => $type,
            'old_values' => $model->getOriginal(),
            'new_values' => $extra ?? $model->getAttributes(),
            'user_id' => auth()->id(),
            'notes' => $extra['notes'] ?? null,
        ]);
    }
}
```

**Use when:**
- Full audit history is legally required (finance, healthcare, compliance)
- Temporal queries needed: "what did this record look like last Tuesday?"
- Complex state machines need undo/redo capabilities
- Debugging distributed system interactions

**Avoid over-engineering:** For most CRUD applications, simple logging or `updated_at` timestamps are sufficient.

---

## Enterprise Eloquent Checklist

Before merging any code involving Eloquent models or queries:

- [ ] No N+1 queries — all relations eager loaded where accessed
- [ ] `Model::preventLazyLoading()` enabled in development
- [ ] All heavy relations use constrained eager loading
- [ ] Route model binding used instead of manual `findOrFail`
- [ ] DTOs used to cross service boundaries (no raw arrays/request data)
- [ ] Value objects used for domain concepts (Email, Money, Address)
- [ ] Enums used for all finite state fields
- [ ] Custom casts used for complex data types
- [ ] Sensitive fields encrypted (`encrypted` cast)
- [ ] Global scopes documented and escapable via `withoutGlobalScope()`
- [ ] Local scopes are composable (single responsibility per scope)
- [ ] Aggregate calculations pushed to SQL (withCount, withSum, etc.)
- [ ] No SELECT \* — specific columns selected
- [ ] Morph maps configured for all polymorphic relations
- [ ] Morph columns indexed
- [ ] Observers remain lightweight (cache invalidation, logging only)
- [ ] Domain events decouple side effects from core logic
- [ ] Queries paginated (cursorPaginate for large datasets)
- [ ] Eloquent remains a persistence layer, not the application architecture

---

## References

- See skill: `laravel-patterns` for Actions, DTOs, Services, and Architecture patterns
- See skill: `laravel-tdd` for testing Eloquent models, scopes, casts, and events with Pest 4
- See skill: `laravel-core-internals` for Service Container, DI, Providers, and Contracts
- See skill: `laravel-database` for SQL optimization, indexing strategy, PostgreSQL features, and transaction management
- See rule: `rules/laravel/eloquent.md` for enforced Eloquent rules
- See rule: `rules/laravel/database.md` for enforced database engineering rules
- See rule: `rules/laravel/patterns.md` for general Laravel patterns
- See agent: `laravel-eloquent` for automated Eloquent optimization assistance
- See agent: `laravel-database` for automated database engineering assistance
