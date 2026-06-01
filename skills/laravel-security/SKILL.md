# Laravel 13 Security

## When to Use

Use this skill when building or auditing Laravel 13 applications for security. It covers mass assignment protection (Laravel 13 attributes), SQL injection prevention, XSS/PAO (PHP Attribute Output), CSRF, authentication (Breeze/Jetstream/Fortify), authorization (Gates/Polices), FormRequest validation, rate limiting, HTTP security headers, session security, CORS, file uploads, dependency auditing, APP_KEY rotation, and production hardening.

## Mass Assignment Protection

### Laravel 13 Attribute-Driven Mass Assignment

Laravel 13 uses PHP 8 attributes instead of `$fillable` / `$guarded` properties.

```php
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name', 'email', 'password'])]
class User extends Model {}

// Or use Guarded to exclude specific fields
#[Guarded(['is_admin'])]
class User extends Model {}

// Never use #[Unguarded] in production — it's the equivalent of turning off all protection
// #[Unguarded]  ← DANGEROUS
```

### Legacy Property Approach (Still Works)

```php
class User extends Model
{
    protected $fillable = ['name', 'email', 'password'];
    // protected $guarded = ['is_admin'];
}
```

### Never Trust User Input for Mass Assignment

```php
// DANGEROUS — user could pass is_admin: true
User::create($request->all());

// SAFE — only allow explicitly listed fields
User::create($request->only(['name', 'email', 'password']));

// SAFEST — use DTO
User::create($dto->toArray());
```

## SQL Injection Prevention

### Always Use Eloquent or Query Builder

```php
// SAFE — Eloquent uses parameterized queries
$users = User::where('email', $request->input('email'))->get();

// SAFE — Query Builder uses parameterized queries
$users = DB::table('users')->where('email', $request->input('email'))->get();

// SAFE — Parameterized raw queries
$users = DB::select('SELECT * FROM users WHERE email = ?', [$request->input('email')]);

// SAFE — Named bindings
$users = DB::select('SELECT * FROM users WHERE email = :email', [
    'email' => $request->input('email'),
]);
```

### DANGEROUS — Never String-Build SQL

```php
// DANGEROUS — SQL injection
$users = DB::select("SELECT * FROM users WHERE email = '{$request->input('email')}'");

// DANGEROUS — order by injection
$users = User::orderBy($request->input('sort'))->get();
// SAFER — whitelist
$allowedSorts = ['name', 'email', 'created_at'];
$sort = in_array($request->input('sort'), $allowedSorts) ? $request->input('sort') : 'id';
$users = User::orderBy($sort)->get();
```

### Like Clauses

```php
// SAFE — escape the like value
$search = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $request->input('search')) . '%';
$users = User::where('name', 'like', $search)->get();
```

## XSS Prevention

### Blade Auto-Escaping (Default)

```php
{{-- SAFE — Blade auto-escapes HTML --}}
{{ $user->name }}

{{-- DANGEROUS — unescaped output --}}
{!! $user->bio !!}
```

### When You Need Raw HTML

```php
// SAFE — use a whitelist-based HTML sanitizer
use Illuminate\Support\Str;

// Option 1: Strip all tags
{!! Str::of($user->bio)->stripTags() !!}

// Option 2: Allow specific tags
{!! Str::of($user->bio)->inlineMarkdown() !!}

// Option 3: Use a proper HTML purifier
// composer require mews/purifier
{!! clean($user->bio) !!}
```

### JavaScript Context

```php
{{-- SAFE — JSON encoding for JavaScript --}}
<script>
    const user = @json($user);
    const settings = {{ Illuminate\Support\Js::from($settings) }};
</script>

{{-- DANGEROUS — direct interpolation --}}
<script>
    const name = '{{ $user->name }}'; // XSS if name contains ' or </script>
</script>
```

### URL Context

```php
{{-- SAFE — URL encoding --}}
<a href="{{ url($user->profile_url) }}">Profile</a>

{{-- DANGEROUS --}}
<a href="{{ $user->profile_url }}">Profile</a> {{-- javascript:alert(1) --}}
```

## CSRF Protection

### Blade Forms

```php
{{-- SAFE — Blade automatically generates CSRF token --}}
<form method="POST" action="/users">
    @csrf
    <input name="name" value="John">
</form>
```

### API / SPA

```php
// API routes (not web) are stateless — use Sanctum
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/orders', [OrderController::class, 'store']);
});

// SPA with Sanctum — CSRF via cookie
// axios interceptors read XSRF-TOKEN cookie
```

### Always Verify the Token

```php
// VerifyCsrfToken middleware is included in web group by default
// Never exclude routes from CSRF protection unless absolutely necessary

// If you must exclude (e.g., webhook), validate origin:
class VerifyCsrfToken extends Middleware
{
    protected $except = [
        'webhook/*',  // validated via signature instead
    ];
}
```

## Authentication

### Breeze (Scaffolding)

```bash
composer require laravel/breeze:^2.0 --dev
php artisan breeze:install blade
php artisan migrate
npm install && npm run build
```

### Breeze with Inertia or API

```bash
php artisan breeze:install inertia
# or
php artisan breeze:install api
```

### Fortify (Headless Auth)

```php
// config/fortify.php
return [
    'features' => [
        Features::registration(),
        Features::resetPasswords(),
        Features::emailVerification(),
        Features::updateProfileInformation(),
        Features::updatePasswords(),
        Features::twoFactorAuthentication([
            'confirm' => true,
            'confirmPassword' => true,
        ]),
    ],
];
```

### Password Validation

```php
// In RegisterRequest
public function rules(): array
{
    return [
        'password' => [
            'required',
            'string',
            Password::min(8)
                ->mixedCase()
                ->numbers()
                ->symbols()
                ->uncompromised(), // checks against known data breaches
            'confirmed',
        ],
    ];
}
```

### Rate Limiting Login Attempts

```php
RateLimiter::for('login', function (Request $request) {
    $key = Str::transliterate(Str::lower($request->input('email'))) . '|' . $request->ip();
    $maxAttempts = 5;

    return Limit::perMinute($maxAttempts)->by($key)->response(function () {
        return back()->withErrors([
            'email' => 'Too many login attempts. Please try again in 60 seconds.',
        ]);
    });
});
```

## Authorization

### Gates

```php
// In AppServiceProvider
Gate::define('create-order', function (User $user) {
    return $user->is_active && !$user->is_banned;
});

Gate::define('view-order', function (User $user, Order $order) {
    return $user->id === $order->user_id || $user->is_admin;
});
```

### Using Gates

```php
// In controller
if (Gate::denies('create-order')) {
    abort(403);
}

// Or
$this->authorize('create-order');

// In Blade
@can('view-order', $order)
    <a href="{{ route('orders.show', $order) }}">View</a>
@endcan

@cannot('view-order', $order)
    <span>Restricted</span>
@endcannot
```

### Policies

```php
class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Order $order): bool
    {
        return $user->id === $order->user_id || $user->is_admin;
    }

    public function create(User $user): bool
    {
        return $user->is_active && !$user->is_banned;
    }

    public function update(User $user, Order $order): bool
    {
        return $user->id === $order->user_id && $order->status === 'pending';
    }

    public function delete(User $user, Order $order): bool
    {
        return $user->id === $order->user_id && $order->status === 'pending';
    }
}
```

### Policy Auto-Discovery

Policies are auto-discovered by convention in Laravel 13:

```php
// Provider registers automatically when model/policy follow naming conventions
// User model → UserPolicy in App\Policies

// Only register manually if you have custom naming
protected $policies = [
    Order::class => OrderPolicy::class,
];
```

## Input Validation

### FormRequest with authorize()

```php
class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Order::class);
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:100'],
            'shipping_address' => ['required', 'string', 'max:500'],
            'payment_method_id' => ['required', 'exists:payment_methods,id'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'user_id' => $this->user()->id,
        ]);
    }
}
```

### Custom Validation Rules

```php
use Illuminate\Validation\Rule;

// In FormRequest
public function rules(): array
{
    return [
        'email' => [
            'required',
            'email',
            Rule::unique('users', 'email')->ignore($this->user?->id),
        ],
        'role' => [
            'required',
            Rule::in(['admin', 'editor', 'viewer']),
        ],
        'status' => [
            'required',
            Rule::when($this->user()->is_admin, ['string'], ['string', 'in:active,inactive']),
        ],
    ];
}
```

### Rule Objects

```php
use Illuminate\Contracts\Validation\ValidationRule;

class AllowedDomain implements ValidationRule
{
    public function __construct(
        private readonly array $allowedDomains,
    ) {}

    public function validate(string $attribute, mixed $value, \Closure $fail): void
    {
        $domain = substr(strrchr($value, '@'), 1);
        if (!in_array($domain, $this->allowedDomains)) {
            $fail('The :attribute must be from an allowed domain.');
        }
    }
}

// Usage
'email' => ['required', 'email', new AllowedDomain(['example.com'])],
```

## Rate Limiting

### API Rate Limiting

```php
// In AppServiceProvider::boot() or RouteServiceProvider
RateLimiter::for('api', function (Request $request) {
    $user = $request->user();
    $key = $user ? $user->id : $request->ip();

    return Limit::perMinute(60)->by($key);
});

RateLimiter::for('orders', function (Request $request) {
    return Limit::perMinute(10)->by($request->user()?->id);
});

RateLimiter::for('uploads', function (Request $request) {
    return Limit::perHour(5)->by($request->user()?->id);
});
```

### Named Rate Limiters

```php
RateLimiter::for('login', function (Request $request) {
    return Limit::perMinute(5)->by($request->input('email') . '|' . $request->ip());
});

RateLimiter::for('register', function (Request $request) {
    return Limit::perHour(3)->by($request->ip());
});
```

### Applying to Routes

```php
Route::middleware('throttle:api')->group(function () {
    Route::apiResource('users', UserController::class);
});

Route::post('/orders', [OrderController::class, 'store'])
    ->middleware('throttle:orders');

Route::post('/upload', [UploadController::class, 'store'])
    ->middleware('throttle:uploads');

// Dynamic limit
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1'); // 5 requests per minute
```

## HTTP Security Headers

### Recommended Headers (via middleware)

```php
namespace App\Http\Middleware;

class SecurityHeaders
{
    public function handle(Request $request, \Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Content Security Policy
        $response->headers->set('Content-Security-Policy', $this->cspPolicy());

        // Permissions Policy
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        // Strict Transport Security (only in production over HTTPS)
        if (app()->environment('production')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        return $response;
    }

    private function cspPolicy(): string
    {
        $nonce = app(\Illuminate\Foundation\Vite::class)->cspNonce();

        return implode('; ', [
            "default-src 'self'",
            "script-src 'self' 'nonce-{$nonce}'",
            "style-src 'self' 'nonce-{$nonce}'",
            "img-src 'self' data: https:",
            "font-src 'self'",
            "connect-src 'self'",
            "frame-src 'none'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ]);
    }
}
```

### Register Middleware

```php
// In Kernel or bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(SecurityHeaders::class);
})
```

### HSTS in .env

```php
// Laravel 13 automatically handles HSTS via APP_ENV=production
// For custom: config/security.php
return [
    'hsts' => env('APP_ENV') === 'production',
];
```

## Session Security

### Secure Session Configuration

```php
// config/session.php
return [
    'driver' => env('SESSION_DRIVER', 'database'),  // Use database or redis, not file in production
    'secure' => env('SESSION_SECURE_COOKIE', true),  // HTTPS only
    'http_only' => true,                              // Not accessible via JavaScript
    'same_site' => 'lax',                            // 'strict' for max security, 'lax' for usability
    'encrypt' => env('SESSION_ENCRYPT', true),        // Encrypt session data
];
```

### Session Regeneration

```php
// After login — always regenerate
public function authenticate(Request $request): RedirectResponse
{
    if (Auth::attempt($request->only('email', 'password'))) {
        $request->session()->regenerate();
        return redirect()->intended('/dashboard');
    }

    return back()->withErrors([
        'email' => 'Invalid credentials.',
    ]);
}

// After password change — invalidate other sessions
Auth::logoutOtherDevices($currentPassword);
```

## CORS

Laravel 13 has built-in CORS configuration.

```php
// config/cors.php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000')],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

## File Uploads

### Validation

```php
class UploadAvatarRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'avatar' => [
                'required',
                'file',
                'image',                   // Must be an image
                'mimes:jpg,jpeg,png,webp', // Only allow specific formats
                'max:2048',                // Max 2MB
                'dimensions:min_width=100,min_height=100,max_width=4096,max_height=4096',
            ],
        ];
    }
}
```

### Malicious File Detection

```php
use Illuminate\Http\UploadedFile;

class SafeFileUpload
{
    public function store(UploadedFile $file, string $path): string
    {
        // 1. Validate real MIME type (not just extension)
        $mimeType = $file->getMimeType();
        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

        if (!in_array($mimeType, $allowedMimes)) {
            throw new \InvalidArgumentException('Invalid file type.');
        }

        // 2. Scan for malware (extend with ClamAV in production)
        // exec("clamscan {$file->path()}");

        // 3. Strip EXIF data for images
        $image = \Intervention\Image\ImageManager::imagick()->read($file->path());
        $image->removeFrames();

        // 4. Store with a generated name (never user-provided)
        $fileName = Str::uuid() . '.' . $file->extension();

        return $file->storeAs($path, $fileName, 'public');
    }
}
```

## Dependency Security

### composer audit

```bash
# Check for known vulnerabilities
composer audit

# Check with JSON output for CI
composer audit --format=json

# CI gate — fail if vulnerabilities found
```

### Enlightn Security Scanner

```bash
composer require enlightn/enlightn --dev
php artisan enlightn
```

### .env Protection

```php
// Never commit .env to version control
// APP_KEY must be unique per environment
// APP_KEY rotation:
// 1. php artisan key:generate --show
// 2. Copy new key
// 3. Update .env with new APP_KEY
// 4. php artisan config:clear
// 5. php artisan config:cache
```

## Production Hardening Checklist

```php
// config/app.php
'env' => env('APP_ENV', 'production'),
'debug' => (bool) env('APP_DEBUG', false),  // Never true in production
```

### Configuration Caching

```bash
# Run in deployment
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

### Maintenance Mode

```bash
# During deployments
php artisan down --secret="deploy-key-here"
# Access via https://example.com/deploy-key-here

# Bring back up
php artisan up
```

### Full Checklist

- [ ] `APP_ENV=production` and `APP_DEBUG=false` in production
- [ ] `config:cache`, `route:cache`, `view:cache`, `event:cache` run
- [ ] `composer install --no-dev --optimize-autoloader`
- [ ] All models have `#[Fillable]` or `#[Guarded]`
- [ ] All controllers use FormRequest for validation
- [ ] All state-changing actions have `$this->authorize()`
- [ ] Blade uses `{{ }}` not `{!! !!}` unless sanitized
- [ ] CSRF protection enabled on all web forms
- [ ] Rate limiting on all API endpoints
- [ ] HTTPS enforced (HSTS in production)
- [ ] Session secure cookies enabled
- [ ] `APP_KEY` is unique and not default
- [ ] `composer audit` passes with no vulnerabilities
- [ ] PHPStan at level 6+ with no errors
- [ ] Pest tests at 80%+ coverage
- [ ] File uploads validated (type, size, MIME)

## References

- See skill: `laravel-patterns` for architecture context
- See skill: `laravel-database` for SQL injection prevention at the database level
- See skill: `laravel-tdd` for writing security tests
- See skill: `laravel-authentication` for comprehensive authentication & authorization standards
- See rules/php/security.md for general PHP security rules
- See rules/laravel/security.md for Laravel-specific security rules
- See rules/laravel/authentication.md for authentication & authorization rules
