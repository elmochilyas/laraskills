# Laravel 13 TDD with Pest 4

## When to Use

Use this skill when testing Laravel 13 applications. It covers Pest 4 installation and configuration, feature tests, model factories, HTTP tests, authentication tests, mocking with Laravel fakes, architecture tests, parallel testing, snapshot testing, Dusk browser tests, and CI integration. Target test split: 80% feature tests / 20% unit tests.

## Pest 4 Setup

Laravel 13 ships with Pest 4 as the first-class test framework.

```bash
# Pest 4 is included by default in Laravel 13
composer create-project laravel/laravel:^13.0 my-app

# If upgrading from an older version
composer require pestphp/pest:^4.0 --dev
composer require pestphp/pest-plugin-laravel:^4.0 --dev
./vendor/bin/pest --init
```

### phpunit.xml Configuration

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true"
>
    <testsuites>
        <testsuite name="Feature">
            <directory>tests/Feature</directory>
        </testsuite>
        <testsuite name="Unit">
            <directory>tests/Unit</directory>
        </testsuite>
    </testsuites>
    <source>
        <include>
            <directory>app</directory>
        </include>
    </source>
    <php>
        <env name="APP_ENV" value="testing"/>
        <env name="BCRYPT_ROUNDS" value="4"/>
        <env name="CACHE_STORE" value="array"/>
        <env name="DB_DATABASE" value="testing"/>
        <env name="MAIL_MAILER" value="array"/>
        <env name="QUEUE_CONNECTION" value="sync"/>
        <env name="SESSION_DRIVER" value="array"/>
        <env name="TELESCOPE_ENABLED" value="false"/>
    </php>
</phpunit>
```

### tests/Pest.php

```php
uses(
    Tests\TestCase::class,
    Illuminate\Foundation\Testing\RefreshDatabase::class,
)->in('Feature');

uses(
    Tests\TestCase::class,
)->in('Unit');
```

## Test File Naming and Organization

```
tests/
  Feature/
    User/
      CreateUserTest.php
      UpdateUserTest.php
      DeleteUserTest.php
      UserListingTest.php
    Order/
      PlaceOrderTest.php
      CancelOrderTest.php
  Unit/
    Actions/
      CreateUserActionTest.php
    DTOs/
      CreateUserDTOTest.php
    Services/
      OrderServiceTest.php
  Architect/
    test.php             # Architecture tests
  Browser/               # Dusk tests
    LoginTest.php
```

## Basic Test Structure

```php
<?php

use App\Modules\User\Models\User;

test('users can be created', function () {
    $response = $this->post('/api/users', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'password' => 'Secret123!',
        'password_confirmation' => 'Secret123!',
    ]);

    $response->assertStatus(201);
    $this->assertDatabaseHas('users', [
        'email' => 'john@example.com',
    ]);
});
```

### Using describe() Groups

```php
describe('User creation', function () {
    test('requires authentication', function () {
        $response = $this->postJson('/api/users', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'Secret123!',
            'password_confirmation' => 'Secret123!',
        ]);

        $response->assertUnauthorized();
    });

    test('validates required fields', function () {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/users', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name', 'email', 'password']);
    });
});
```

## Model Factories

```php
class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
            'is_admin' => false,
            'remember_token' => Str::random(10),
        ];
    }

    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_admin' => true,
        ]);
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
```

### Factory Sequences

```php
$users = User::factory()
    ->count(3)
    ->sequence(
        ['name' => 'Alice', 'email' => 'alice@example.com'],
        ['name' => 'Bob', 'email' => 'bob@example.com'],
        ['name' => 'Charlie', 'email' => 'charlie@example.com'],
    )
    ->create();
```

### Factory afterCreating

```php
class OrderFactory extends Factory
{
    public function configure(): static
    {
        return $this->afterCreating(function (Order $order) {
            OrderItem::factory()
                ->count(3)
                ->forOrder($order)
                ->create();
        });
    }
}
```

### Factory Relationships

```php
// HasMany
$user = User::factory()
    ->has(Post::factory()->count(5))
    ->create();

// BelongsTo
$post = Post::factory()
    ->for(User::factory()->admin())
    ->create();

// Magic methods
$user = User::factory()
    ->hasPosts(5)
    ->create();
```

## Database Testing

```php
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;

uses(RefreshDatabase::class, WithFaker::class);

test('database has users', function () {
    User::factory()->count(3)->create();

    $this->assertDatabaseCount('users', 3);
});

test('assert model exists', function () {
    $user = User::factory()->create();

    $this->assertModelExists($user);
});

test('soft deleted model is missing', function () {
    $user = User::factory()->create();
    $user->delete();

    $this->assertModelMissing($user);
    $this->assertDatabaseHas('users', ['id' => $user->id]);
    $this->assertSoftDeleted($user);
});
```

## HTTP Tests

```php
test('lists users with pagination', function () {
    User::factory()->count(25)->create();

    $response = $this->actingAs(User::factory()->admin()->create())
        ->getJson('/api/users?per_page=10');

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'name', 'email'],
            ],
            'meta' => ['total', 'per_page', 'current_page'],
        ])
        ->assertJsonCount(10, 'data');
});
```

### Asserting Exact JSON Shape

```php
use Illuminate\Testing\Fluent\AssertableJson;

test('returns user in expected format', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->getJson("/api/users/{$user->id}");

    $response->assertJson(fn (AssertableJson $json) =>
        $json->where('id', $user->id)
            ->where('name', $user->name)
            ->where('email', $user->email)
            ->has('created_at')
            ->has('updated_at')
            ->missing('password')
    );
});
```

### Asserting Status Codes

```php
$response->assertOk();                // 200
$response->assertCreated();           // 201
$response->assertNoContent();         // 204
$response->assertUnauthorized();      // 401
$response->assertForbidden();         // 403
$response->assertNotFound();          // 404
$response->assertStatus(422);         // Validation error
```

### Validation Error Assertions

```php
test('validates email format', function () {
    $response = $this->actingAs(User::factory()->create())
        ->postJson('/api/users', [
            'email' => 'not-an-email',
        ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrorFor('email');
    $response->assertInvalid(['email']);
    $response->assertValid(['name']);
});
```

### Inertia Assertions

```php
test('renders user list page', function () {
    $users = User::factory()->count(5)->create();

    $response = $this->actingAs($users->first())
        ->get('/dashboard');

    $response->assertInertia(fn ($assert) =>
        $assert->component('User/Index')
            ->has('users.data', 5)
            ->where('users.data.0.name', $users[0]->name)
    );
});
```

## Authentication Tests

```php
test('authenticated user can access profile', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->getJson('/api/user');

    $response->assertOk()
        ->assertJsonPath('email', $user->email);
});

test('unauthenticated user gets 401', function () {
    $response = $this->getJson('/api/user');
    $response->assertUnauthorized();
});

test('guest cannot create users', function () {
    $response = $this->postJson('/api/users', [
        'name' => 'Hacker',
        'email' => 'hacker@evil.com',
        'password' => 'hack123',
        'password_confirmation' => 'hack123',
    ]);

    $response->assertUnauthorized();
});
```

### Sanctum Token Tests

```php
test('api token authentication works', function () {
    $user = User::factory()->create();
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withToken($token)
        ->getJson('/api/user');

    $response->assertOk();
});
```

## Mocking with Laravel Fakes

### HTTP Fake

```php
use Illuminate\Support\Facades\Http;

test('fetches external user data', function () {
    Http::fake([
        'api.github.com/*' => Http::response([
            'login' => 'octocat',
            'id' => 1,
        ], 200),
    ]);

    $service = app(GitHubService::class);
    $user = $service->fetchUser('octocat');

    expect($user['login'])->toBe('octocat');
});
```

### Mail Fake

```php
use Illuminate\Support\Facades\Mail;

test('sends welcome email on registration', function () {
    Mail::fake();

    $user = User::factory()->create();

    $response = $this->postJson('/api/register', [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'password' => 'Secret123!',
        'password_confirmation' => 'Secret123!',
    ]);

    Mail::assertSent(WelcomeEmail::class, function ($mail) use ($user) {
        return $mail->hasTo($user->email);
    });
});
```

### Queue Fake

```php
use Illuminate\Support\Facades\Queue;

test('dispatches podcast processing job', function () {
    Queue::fake();

    $podcast = Podcast::factory()->create();

    $this->postJson("/api/podcasts/{$podcast->id}/process");

    Queue::assertPushed(ProcessPodcast::class, function ($job) use ($podcast) {
        return $job->podcast->id === $podcast->id;
    });
});
```

### Notification Fake

```php
use Illuminate\Support\Facades\Notification;

test('sends order confirmation notification', function () {
    Notification::fake();

    $order = Order::factory()->create();
    $this->actingAs($order->user)
        ->postJson("/api/orders/{$order->id}/confirm");

    Notification::assertSentTo(
        $order->user,
        OrderConfirmationNotification::class,
    );
});
```

### Storage Fake

```php
use Illuminate\Support\Facades\Storage;

test('uploads avatar', function () {
    Storage::fake('avatars');

    $response = $this->actingAs(User::factory()->create())
        ->postJson('/api/avatar', [
            'avatar' => UploadedFile::fake()->image('avatar.jpg', 100, 100),
        ]);

    $response->assertOk();
    Storage::disk('avatars')->assertExists('avatars/' . auth()->id() . '.jpg');
});
```

### Event Fake

```php
use Illuminate\Support\Facades\Event;

test('dispatches order placed event', function () {
    Event::fake();

    $order = Order::factory()->create();
    $response = $this->actingAs($order->user)
        ->postJson("/api/orders/{$order->id}/place");

    Event::assertDispatched(OrderPlaced::class, function ($event) use ($order) {
        return $event->order->id === $order->id;
    });
});
```

### Bus Fake

```php
use Illuminate\Support\Facades\Bus;

test('batches podcast processing jobs', function () {
    Bus::fake();

    $podcasts = Podcast::factory()->count(3)->create();

    $this->postJson('/api/podcasts/batch-process', [
        'ids' => $podcasts->pluck('id'),
    ]);

    Bus::assertBatched(function (Batch $batch) {
        return $batch->jobs->count() === 3;
    });
});
```

## Architecture Tests (Pest)

Pest architecture tests enforce project-wide conventions.

```php
test('strict types')
    ->arch()
    ->expect('App')
    ->toUseStrictTypes();

test('no die and dump')
    ->arch()
    ->expect('App')
    ->not->toUse(['dd', 'dump', 'var_dump', 'exit']);

test('controllers extend base controller')
    ->arch()
    ->expect('App\Http\Controllers')
    ->toExtend(\App\Http\Controllers\Controller::class);

test('actions have execute method')
    ->arch()
    ->expect('App\Actions')
    ->toHaveMethods(['execute']);

test('services have invoke method')
    ->arch()
    ->expect('App\Services')
    ->toHaveMethods(['__invoke']);

test('DTOs are readonly classes')
    ->arch()
    ->expect('App\DTOs')
    ->toBeReadonly();

test('form requests extend FormRequest')
    ->arch()
    ->expect('App\Http\Requests')
    ->toExtend(\Illuminate\Foundation\Http\FormRequest::class);

test('models extend Eloquent Model')
    ->arch()
    ->expect('App\Models')
    ->toExtend(\Illuminate\Database\Eloquent\Model::class);

test('policies are plain classes')
    ->arch()
    ->expect('App\Policies')
    ->toHaveMethods(['view', 'create', 'update', 'delete']);

test('no raw SQL in services')
    ->arch()
    ->expect('App\Services')
    ->not->toUse(['DB::raw', 'DB::statement', 'DB::unprepared']);

test('resources extend JsonResource')
    ->arch()
    ->expect('App\Http\Resources')
    ->toExtend(\Illuminate\Http\Resources\Json\JsonResource::class);

test('enums are backed by string or int')
    ->arch()
    ->expect('App\Enums')
    ->toBeEnums();
```

### Global Architecture Tests

```php
// tests/Architect/GlobalArchTest.php
arch('globals')
    ->expect('dd')
    ->not->toBeUsed();
```

## Datasets (Pest)

```php
dataset('valid users', [
    ['name' => 'John Doe', 'email' => 'john@example.com', 'password' => 'Secret123!'],
    ['name' => 'Jane Smith', 'email' => 'jane@example.com', 'password' => 'Str0ng!Pass'],
    ['name' => 'Bob Wilson', 'email' => 'bob@example.com', 'password' => 'Passw0rd#1'],
]);

test('stores valid users', function (string $name, string $email, string $password) {
    $response = $this->actingAs(User::factory()->create())
        ->postJson('/api/users', [
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'password_confirmation' => $password,
        ]);

    $response->assertCreated();
    $this->assertDatabaseHas('users', ['email' => $email]);
})->with('valid users');
```

### Validation Datasets

```php
dataset('invalid emails', [
    'not an email' => ['email' => 'not-email'],
    'empty string' => ['email' => ''],
    'too long' => ['email' => str_repeat('a', 256) . '@b.com'],
    'missing domain' => ['email' => 'user@'],
    'missing tld' => ['email' => 'user@domain'],
]);

test('rejects invalid emails', function (string $email) {
    $response = $this->actingAs(User::factory()->create())
        ->postJson('/api/users', [
            'email' => $email,
            'name' => 'Test',
            'password' => 'Secret123!',
            'password_confirmation' => 'Secret123!',
        ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrorFor('email');
})->with('invalid emails');
```

## Snapshot Testing

```php
test('user resource matches snapshot', function () {
    $user = User::factory()->create([
        'name' => 'John Doe',
        'email' => 'john@example.com',
    ]);

    $resource = UserResource::make($user)->toArray(request());

    expect($resource)->toMatchSnapshot();
});
```

## Parallel Testing

```bash
# Run all tests in parallel
php artisan test --parallel

# Run with specific processes
php artisan test --parallel --processes=6

# Run with coverage
php artisan test --parallel --coverage
```

### Bail on First Failure (CI)

```bash
# Stop on first failure
php artisan test --bail --parallel
```

### Test Splitting

```php
// config/test-splitting.php — optional manual splitting
test('process A', function () {
    // Only runs on process 1
})->onlyOn('p1');
```

## Browser Tests (Pest 4 / Playwright)

Pest 4 includes first-party browser testing powered by Playwright — the recommended approach for new projects.

```bash
composer require pestphp/pest pestphp/pest-plugin-browser --dev
npx playwright install
```

```php
<?php

use function Pest\Laravel\actingAs;

test('users can log in', function () {
    $user = User::factory()->create([
        'email' => 'john@example.com',
        'password' => Hash::make('Secret123!'),
    ]);

    $browser = browser()->visit('/login');
    $browser->fill('[name="email"]', $user->email);
    $browser->fill('[name="password"]', 'Secret123!');
    $browser->press('Log In');
    $browser->assertPathIs('/dashboard');
    $browser->assertSee('Dashboard');
});

test('modal loads after button click', function () {
    browser()
        ->visit('/modal')
        ->click('#open-modal')
        ->waitFor('#modal-content')
        ->assertSeeIn('#modal-content', 'Modal loaded');
});

test('form saves after button is enabled', function () {
    browser()
        ->visit('/form')
        ->fill('[name="name"]', 'John')
        ->click('#submit-btn')
        ->waitForText('Saved');
});
```

## Action Tests

```php
test('create user action', function () {
    $dto = new CreateUserDTO(
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Secret123!',
    );

    $user = app(CreateUserAction::class)->execute($dto);

    expect($user)
        ->toBeInstanceOf(User::class);
    $this->assertDatabaseHas('users', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
    ]);
});
```

## Service Tests

```php
test('order service places order successfully', function () {
    $product = Product::factory()->create(['price' => 1000]);
    $user = User::factory()->create();
    $dto = new PlaceOrderDTO(
        userId: $user->id,
        items: [['product_id' => $product->id, 'quantity' => 2]],
    );

    Mail::fake();
    Queue::fake();

    $order = app(OrderService::class)->placeOrder($dto);

    expect($order->total)->toBe(2000);
    $this->assertDatabaseCount('orders', 1);

    Mail::assertSent(OrderConfirmationMail::class);
});
```

## Coverage Targets and CI

```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ALLOW_EMPTY_PASSWORD: yes
          MYSQL_DATABASE: testing
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3

    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
          extensions: mbstring, pdo_mysql, pcov
      - run: composer install --no-progress
      - run: cp .env.example .env
      - run: php artisan key:generate
      - run: php artisan migrate --env=testing
      - run: php artisan test --parallel --coverage --min=80
      - run: ./vendor/bin/pint --test
      - run: ./vendor/bin/phpstan analyse
```

## PHPStan for Tests

```neon
# phpstan.neon
includes:
    - vendor/phpstan/phpstan/conf/bleeding-edge.neon
    - vendor/nunomaduro/larastan/extension.neon

parameters:
    level: 6
    paths:
        - app
        - tests
    checkMissingIterableValueType: false
```

## References

- See skill: `laravel-patterns` for the architecture patterns to test
- See skill: `laravel-security` for security-focused tests
- See rules/php/testing.md for general PHP testing rules
- See rules/laravel/testing.md for Laravel-specific testing rules
