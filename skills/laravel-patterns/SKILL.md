# Laravel 13 Patterns

## When to Use

Use this skill when building Laravel 13 applications to ensure consistent, maintainable architecture. It covers the full spectrum of Laravel patterns: from attribute-driven models and modular structure to Actions, Services, DTOs, Eloquent best practices, Queues, Caching, API Resources, and Event-driven design.

## Laravel 13 Model Attributes

Laravel 13 introduces PHP 8 attribute-driven model configuration, replacing traditional property declarations.

```php
use Illuminate\Database\Eloquent\Attributes\{
    Table, Fillable, Hidden, Casts, Connection,
    Tries, Timeout, MaxExceptions, ScopedBy
};
use Illuminate\Database\Eloquent\Model;

#[Table('users', key: 'user_id')]
#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
#[Casts([
    'email_verified_at' => 'datetime',
    'is_admin' => 'boolean',
    'settings' => 'array',
])]
#[Connection('mysql')]
class User extends Model
{
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }
}
```

### Queue Job Attributes

Queue jobs also use attributes instead of property declarations:

```php
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\Attributes\{
    Connection, Tries, Timeout, MaxExceptions, Backoff
};

#[Connection('redis')]
#[Tries(5)]
#[Timeout(120)]
#[MaxExceptions(3)]
#[Backoff(30)]
class ProcessPodcast implements ShouldQueue
{
    public function handle(): void
    {
        // ...
    }
}
```

### Console Command Attributes

```php
use Illuminate\Console\Command;
use Symfony\Component\Console\Attribute\AsCommand;

#[AsCommand('mail:send {user}')]
class MailSend extends Command
{
    public function handle(): void
    {
        $this->info('Sent!');
    }
}
```

## Modular/Domain Structure

Organize by feature, not by type. Each domain is self-contained.

```
app/
  Modules/
    User/
      Actions/
        CreateUserAction.php
        UpdateUserAction.php
        DeleteUserAction.php
      DTOs/
        CreateUserDTO.php
        UpdateUserDTO.php
      Models/
        User.php
        UserProfile.php
      Policies/
        UserPolicy.php
      Resources/
        UserResource.php
        UserCollection.php
      Controllers/
        UserController.php
      Requests/
        StoreUserRequest.php
        UpdateUserRequest.php
      Tests/
        CreateUserTest.php
        UpdateUserTest.php
    Order/
      Actions/
        PlaceOrderAction.php
        CancelOrderAction.php
      DTOs/
        PlaceOrderDTO.php
      Models/
        Order.php
        OrderItem.php
      Enums/
        OrderStatus.php
      Events/
        OrderPlaced.php
      Listeners/
        SendOrderConfirmation.php
```

### Registering Module Routes

```php
class UserServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Route::middleware('api')
            ->prefix('api/users')
            ->group(__DIR__ . '/routes.php');
    }
}
```

## Actions vs Services

### When to Use Actions

Use Actions for single-purpose operations that:
- Do exactly one thing (CreateUser, SendWelcomeEmail, ArchivePost)
- Need to be testable in isolation
- May be reused from multiple entry points (CLI, HTTP, Job)

```php
namespace App\Modules\User\Actions;

use App\Modules\User\DTOs\CreateUserDTO;
use App\Modules\User\Models\User;
use Illuminate\Support\Facades\Hash;

class CreateUserAction
{
    public function execute(CreateUserDTO $dto): User
    {
        return User::create([
            'name' => $dto->name,
            'email' => $dto->email,
            'password' => Hash::make($dto->password),
        ]);
    }
}
```

### When to Use Services

Use Services for:
- Grouping related operations that share dependencies
- Orchestrating multiple actions
- Business logic that spans multiple entities

```php
namespace App\Modules\Order\Services;

use App\Modules\Order\Actions\PlaceOrderAction;
use App\Modules\Order\Actions\SendOrderConfirmationAction;
use App\Modules\Order\Actions\UpdateInventoryAction;
use App\Modules\Order\DTOs\PlaceOrderDTO;

class OrderService
{
    public function __construct(
        private PlaceOrderAction $placeOrder,
        private SendOrderConfirmationAction $sendConfirmation,
        private UpdateInventoryAction $updateInventory,
    ) {}

    public function placeOrder(PlaceOrderDTO $dto): Order
    {
        $order = $this->placeOrder->execute($dto);
        $this->updateInventory->execute($order);
        $this->sendConfirmation->execute($order);
        return $order;
    }
}
```

### When to Use Queued Actions

For actions that can run asynchronously, dispatch them as jobs:

```php
use Illuminate\Foundation\Bus\Dispatchable;

class SendWelcomeEmailAction
{
    use Dispatchable;

    public function __construct(
        private readonly User $user,
    ) {}

    public function handle(): void
    {
        // send email ...
    }
}

// Usage
SendWelcomeEmailAction::dispatch($user);
```

## DTOs and Value Objects

### DTOs for Request Data

DTOs ensure type safety and validation before data reaches domain logic.

```php
namespace App\Modules\User\DTOs;

use Illuminate\Support\Carbon;

class CreateUserDTO
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly string $password,
        public readonly ?Carbon $emailVerifiedAt = null,
        public readonly bool $isAdmin = false,
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

### Value Objects

```php
namespace App\Domain\ValueObjects;

class Email
{
    public function __construct(
        public readonly string $value,
    ) {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException("Invalid email: $value");
        }
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }
}

class Price
{
    public function __construct(
        public readonly int $cents,
        public readonly string $currency = 'USD',
    ) {}

    public static function fromFloat(float $amount, string $currency = 'USD'): self
    {
        return new self((int) round($amount * 100), $currency);
    }

    public function toFloat(): float
    {
        return $this->cents / 100;
    }
}
```

## Eloquent Best Practices

### Scoped Bindings

Always scope route model bindings to prevent access to resources owned by other users.

```php
Route::get('/users/{user}/posts/{post}', function (User $user, Post $post) {
    return $post;
})->scopeBindings();
```

### Query Scopes

```php
class Post extends Model
{
    public function scopePublished(Builder $query): Builder
    {
        return $query->whereNotNull('published_at');
    }

    public function scopeRecent(Builder $query): Builder
    {
        return $query->orderBy('created_at', 'desc');
    }
}

// Usage
Post::published()->recent()->get();
```

### Global Scopes

```php
class ActiveScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $builder->where('is_active', true);
    }
}

#[ScopedBy(ActiveScope::class)]
class Product extends Model {}
```

### Eager Loading (Prevent N+1)

```php
// BAD — N+1 queries
$orders = Order::all();
foreach ($orders as $order) {
    echo $order->user->name;
}

// GOOD — eager load
$orders = Order::with('user', 'items.product')->get();

// GOOD — lazy eager load when needed later
$orders = Order::all();
if ($needsUsers) {
    $orders->load('user');
}

// GOOD — prevent N+1 with once
$orders = Order::all();
$orders->each(fn ($order) => $order->once('user', fn () => $order->user));
```

### Constrained Eager Loading

```php
$users = User::with(['posts' => function (Builder $query) {
    $query->where('is_published', true)->orderBy('created_at', 'desc');
}])->get();
```

### Select Specific Columns

```php
// BAD
$users = User::all();

// GOOD
$users = User::select('id', 'name', 'email')->get();
```

### Cursor-Based Pagination for Large Datasets

```php
$users = User::orderBy('id')->cursorPaginate(25);
// Returns: data[], next_cursor, prev_cursor
```

### Model::query() for Type Safety

```php
// GOOD — better static analysis
User::query()->where('active', true)->get();
```

## Form Requests

Form Requests centralize validation and authorization logic.

```php
namespace App\Modules\User\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', User::class);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'This email is already registered.',
        ];
    }

    public function toDto(): CreateUserDTO
    {
        return CreateUserDTO::fromRequest($this);
    }
}
```

### Using Form Requests in Controllers

```php
class UserController extends Controller
{
    public function __construct(
        private readonly CreateUserAction $createUser,
    ) {}

    public function store(StoreUserRequest $request): UserResource
    {
        $user = $this->createUser->execute($request->toDto());
        return UserResource::make($user);
    }
}
```

## API Resources

Consistent API response envelope.

```php
namespace App\Modules\User\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
```

### Resource Collection

```php
class UserCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        return [
            'data' => UserResource::collection($this->collection),
            'meta' => [
                'total' => $this->total(),
                'per_page' => $this->perPage(),
                'current_page' => $this->currentPage(),
            ],
        ];
    }
}
```

## Queues

### Job Structure

```php
#[Connection('redis')]
#[Tries(5)]
#[Timeout(120)]
#[MaxExceptions(3)]
#[Backoff([30, 60, 120])]
class ProcessPodcast implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public Podcast $podcast,
    ) {}

    public function handle(AudioProcessor $processor): void
    {
        $processor->process($this->podcast);
    }

    public function failed(\Throwable $e): void
    {
        Log::error('Podcast processing failed', [
            'podcast_id' => $this->podcast->id,
            'error' => $e->getMessage(),
        ]);
    }
}
```

### Job Batching

```php
use Illuminate\Bus\Batch;
use Illuminate\Support\Facades\Bus;

$batch = Bus::batch([
    new ProcessPodcast($podcast1),
    new ProcessPodcast($podcast2),
    new ProcessPodcast($podcast3),
])->then(function (Batch $batch) {
    // All jobs completed successfully
})->catch(function (Batch $batch, \Throwable $e) {
    // First job failure detected
})->finally(function (Batch $batch) {
    // Batch finished (success or failure)
})->name('process-podcasts')->dispatch();
```

### Unique Jobs

```php
class ProcessPodcast implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public Podcast $podcast,
    ) {}

    public function uniqueId(): string
    {
        return $this->podcast->id;
    }
}
```

## Events and Listeners

```php
namespace App\Modules\Order\Events;

use App\Modules\Order\Models\Order;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderPlaced
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Order $order,
    ) {}
}
```

```php
namespace App\Modules\Order\Listeners;

use App\Modules\Order\Events\OrderPlaced;

class SendOrderConfirmation
{
    public function __construct(
        private readonly Mailer $mailer,
    ) {}

    public function handle(OrderPlaced $event): void
    {
        $this->mailer->sendOrderConfirmation($event->order);
    }
}
```

### Registering Events

```php
class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        OrderPlaced::class => [
            SendOrderConfirmation::class,
            UpdateInventory::class,
        ],
    ];
}
```

Or with Laravel 13 attributes:

```php
#[Listen(OrderPlaced::class, SendOrderConfirmation::class)]
class EventServiceProvider extends ServiceProvider {}
```

## Caching

### Cache Tags

```php
// Set
Cache::tags(['users', 'active'])->put('count', 100, 3600);

// Get
$count = Cache::tags(['users', 'active'])->get('count');

// Flush specific tag
Cache::tags(['users'])->flush();
```

### Remember Pattern

```php
$users = Cache::remember('users.active', 3600, function () {
    return User::where('is_active', true)->get();
});
```

### Model Cache Invalidation with Observers

```php
class UserObserver
{
    public function saved(User $user): void
    {
        Cache::tags(['users'])->flush();
    }

    public function deleted(User $user): void
    {
        Cache::tags(['users'])->flush();
    }
}
```

## Policies and Gates

```php
namespace App\Modules\User\Policies;

use App\Modules\User\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_admin;
    }

    public function view(User $user, User $model): bool
    {
        return $user->is_admin || $user->id === $model->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, User $model): bool
    {
        return $user->is_admin || $user->id === $model->id;
    }

    public function delete(User $user, User $model): bool
    {
        return $user->is_admin && $user->id !== $model->id;
    }
}
```

### Using Policies

```php
// In controller
$this->authorize('update', $user);

// In Blade
@can('update', $user)
    <a href="{{ route('users.edit', $user) }}">Edit</a>
@endcan

// In FormRequest
public function authorize(): bool
{
    return $this->user()->can('update', $this->route('user'));
}
```

## Pipeline Pattern

```php
use Illuminate\Pipeline\Pipeline;

class ProcessOrderPipeline
{
    public function run(Order $order): Order
    {
        return app(Pipeline::class)
            ->send($order)
            ->through([
                ValidateOrder::class,
                CalculateTotals::class,
                ApplyDiscounts::class,
                ReserveInventory::class,
            ])
            ->thenReturn();
    }
}
```

Each pipe:

```php
class ValidateOrder
{
    public function handle(Order $order, \Closure $next): mixed
    {
        if ($order->items->isEmpty()) {
            throw new \InvalidArgumentException('Order has no items');
        }
        return $next($order);
    }
}
```

## Service Container

### Contextual Binding

```php
$this->app->when(OrderService::class)
    ->needs(ReportRepository::class)
    ->give(function () {
        return new PdfReportRepository();
    });

$this->app->when(InvoiceService::class)
    ->needs(ReportRepository::class)
    ->give(CsvReportRepository::class);
```

### Tagging

```php
$this->app->tag([
    ProcessPayment::class,
    SendConfirmation::class,
    UpdateInventory::class,
], 'order.handlers');

// Resolve tagged
$this->app->tagged('order.handlers');
```

### Singletons

```php
$this->app->singleton(FileStorage::class, function () {
    return new FileStorage(storage_path('app'));
});
```

## Rate Limiting

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
});

RateLimiter::for('login', function (Request $request) {
    return Limit::perMinute(5)->by($request->input('email') . '|' . $request->ip());
});
```

### Applying to Routes

```php
Route::middleware('throttle:api')->group(function () {
    Route::apiResource('users', UserController::class);
});

Route::post('login', [AuthController::class, 'login'])
    ->middleware('throttle:login');
```

## Blade Components

```php
namespace App\View\Components;

use Illuminate\View\Component;

class Alert extends Component
{
    public function __construct(
        public string $type = 'info',
        public ?string $message = null,
    ) {}

    public function render(): View
    {
        return view('components.alert');
    }
}
```

```blade
<div class="alert alert-{{ $type }}" role="alert">
    {{ $message }}
    {{ $slot }}
</div>
```

## Testing Actions

Actions are easy to test because they have a single `execute()` method:

```php
test('create user action creates a user', function () {
    $dto = new CreateUserDTO(
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Secret123!',
    );

    $user = app(CreateUserAction::class)->execute($dto);

    expect($user)
        ->toBeInstanceOf(User::class)
        ->and($user->name)->toBe('John Doe')
        ->and($user->email)->toBe('john@example.com')
        ->and(Hash::check('Secret123!', $user->password))->toBeTrue();
});
```

## References

- See skill: `laravel-tdd` for testing these patterns with Pest 4
- See skill: `laravel-security` for securing these patterns
- See rules/php/patterns.md for general PHP patterns
- See rules/laravel/patterns.md for Laravel-specific rule supplements
