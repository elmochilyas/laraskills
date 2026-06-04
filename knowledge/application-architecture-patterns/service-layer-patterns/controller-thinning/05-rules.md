## Aim For The Three-Line Controller Pattern
---
## Architecture
---
## Rule
Aim for the Three-Line Controller pattern: receive validated request, call a service/action, return a response. If a controller method is longer, extract the logic.
---
## Reason
Three-line controllers are boring to read, trivial to test, and force business logic into appropriate abstraction layers.
---
## Bad Example
```php
class UserController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8',
        ]);
        $user = User::create($validated);
        $user->assignRole('member');
        $user->sendEmailVerificationNotification();
        event(new UserRegistered($user));
        return response()->json(['user' => $user, 'token' => $user->createToken('auth')->plainTextToken], 201);
    }
}
```
---
## Good Example
```php
class UserController extends Controller
{
    public function __construct(private UserService $userService) {}

    public function register(RegisterUserRequest $request): JsonResponse
    {
        $user = $this->userService->register($request->validated());

        return response()->json($user, 201);
    }
}
```
---
## Exceptions
Prototype-stage applications. Controllers that are already simple proxies with no additional logic to extract.
---
## Consequences Of Violation
Fat controllers with business logic, untestable HTTP-coupled code, difficult maintenance, violated separation of concerns.

## Always Use Form Requests For Validation
---
## Architecture
---
## Rule
Always use Form Request classes for validation. Do not use `$request->validate()` in controller methods.
---
## Reason
Form Requests make validation testable, reusable across controllers and endpoints, and keep controller methods focused on orchestration.
---
## Bad Example
```php
class UserController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8|confirmed',
        ]);
        // ...
    }
}
```
---
## Good Example
```php
class RegisterUserRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8|confirmed',
        ];
    }
}

class UserController extends Controller
{
    public function register(RegisterUserRequest $request): JsonResponse
    {
        // $request->validated() is already validated
        $user = $this->userService->register($request->validated());
        return response()->json($user, 201);
    }
}
```
---
## Exceptions
No common exceptions. Form Requests are always preferred.
---
## Consequences Of Violation
Untestable validation logic, unreusable validation rules, controller bloat.

## Controllers Must Not Contain Business Logic
---
## Architecture
---
## Rule
Controllers must not contain business logic. If code does not involve HTTP request/response handling, it does not belong in a controller.
---
## Reason
Business logic in controllers is untestable without HTTP simulation, unreusable from CLI/queue, and violates separation of concerns.
---
## Bad Example
```php
class OrderController extends Controller
{
    public function store(StoreOrderRequest $request): JsonResponse
    {
        $order = new Order();
        $order->user_id = Auth::id();
        $order->total = collect($request->items)->sum(fn($item) => $item['price'] * $item['qty']);
        $order->status = 'pending';
        $order->save();
        foreach ($request->items as $item) {
            $order->items()->create($item);
            Product::whereId($item['product_id'])->decrement('stock', $item['qty']);
        }
        return response()->json($order, 201);
    }
}
```
---
## Good Example
```php
class OrderController extends Controller
{
    public function __construct(private OrderService $orderService) {}

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $order = $this->orderService->placeOrder(
            $request->validated(),
            Auth::user()
        );

        return response()->json($order, 201);
    }
}
```
---
## Exceptions
Simple view controllers that return Blade views without data transformation.
---
## Consequences Of Violation
Untestable business logic, HTTP-coupled code, unreusable from CLI/queue, difficult onboarding.

## Use API Resources For Response Transformation
---
## Architecture
---
## Rule
Use API Resource classes for response transformation. Do not format responses inline in controllers.
---
## Reason
API Resources centralize response transformation logic, making it testable, reusable across endpoints, and keeping controllers thin.
---
## Bad Example
```php
class UserController extends Controller
{
    public function show(int $id): JsonResponse
    {
        $user = User::with('posts.comments')->findOrFail($id);
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'post_count' => $user->posts->count(),
            'recent_comments' => $user->posts->flatMap->comments->take(5),
        ]);
    }
}
```
---
## Good Example
```php
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'post_count' => $this->posts->count(),
            'recent_comments' => CommentResource::collection($this->posts->flatMap->comments->take(5)),
        ];
    }
}

class UserController extends Controller
{
    public function show(int $id): UserResource
    {
        return new UserResource(User::with('posts.comments')->findOrFail($id));
    }
}
```
---
## Exceptions
Simple scalar responses where a resource class adds unnecessary ceremony.
---
## Consequences Of Violation
Response logic scattered across controllers, untestable transformations, inconsistent response formats.

## Authorization Belongs In Policies
---
## Security
---
## Rule
Put authorization logic in Policy classes, not in controllers. Use Form Request's `authorize()` method or `Gate` facade.
---
## Reason
Policies centralize authorization logic, making it testable, reusable across controllers and commands, and visible in a single location.
---
## Bad Example
```php
class PostController extends Controller
{
    public function update(Request $request, Post $post): JsonResponse
    {
        if ($post->user_id !== Auth::id() && !Auth::user()->isAdmin()) {
            abort(403);
        }
        // ...
    }
}
```
---
## Good Example
```php
class PostPolicy
{
    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id || $user->isAdmin();
    }
}

class UpdatePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('post'));
    }
}

class PostController extends Controller
{
    public function update(UpdatePostRequest $request, Post $post): JsonResponse
    {
        $this->postService->update($post, $request->validated());
        return response()->json($post);
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Scattered authorization logic, untestable permissions, duplicated checks, authorization bypass vulnerabilities.

## Establish Max Lines Limits Per Controller And Method
---
## Maintainability
---
## Rule
Establish and enforce maximum lines per controller (50 lines) and per method (10 lines). Enforce via automated tools or code review.
---
## Reason
Line limits provide a clear signal that logic needs extraction. Without limits, controllers grow by accretion until they become unmanageable.
---
## Bad Example
```php
class UserController extends Controller
{
    // 15 methods, 300+ lines total
    public function register(Request $request): JsonResponse { /* 25 lines */ }
    public function login(Request $request): JsonResponse { /* 20 lines */ }
    public function updateProfile(Request $request): JsonResponse { /* 30 lines */ }
    public function changePassword(Request $request): JsonResponse { /* 15 lines */ }
    // ...
}
```
---
## Good Example
```php
class UserController extends Controller
{
    public function __construct(private UserService $userService) {}

    public function register(RegisterUserRequest $request): JsonResponse
    {
        $user = $this->userService->register($request->validated());
        return response()->json($user, 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $token = $this->userService->login($request->validated());
        return response()->json(['token' => $token]);
    }
    // Each method ≤ 5 lines, controller ≤ 50 lines
}
```
---
## Exceptions
No common exceptions. If a controller exceeds these limits consistently, the architecture needs review.
---
## Consequences Of Violation
Fat controllers, inconsistent thinning across team, code review fatigue, difficulty onboarding new developers.

## Avoid Over-Extraction
---
## Maintainability
---
## Rule
Do not extract every conditional to a separate class. Keep simple 3-4 line code blocks inline or use a simple service method.
---
## Reason
Over-extraction creates indirection without benefit, increasing file count and making the codebase harder to navigate without improving testability.
---
## Bad Example
```php
// A simple conditional extracted to its own class
class IsUserActiveChecker
{
    public function check(User $user): bool
    {
        return $user->status === 'active';
    }
}
// Used in controller for a single if statement
```
---
## Good Example
```php
// Keep simple conditionals inline or in a model method
class User extends Model
{
    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}

// Controller uses it directly
if ($user->isActive()) { /* ... */ }
```
---
## Exceptions
Logic that is used in multiple places (extract for reuse) or logic that is genuinely complex and benefits from isolation.
---
## Consequences Of Violation
Class explosion, unnecessary indirection, difficulty understanding the codebase, reduced productivity.
