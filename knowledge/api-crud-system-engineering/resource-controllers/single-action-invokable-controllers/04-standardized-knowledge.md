| Section | Field | Content |
|---|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Resource Controllers |
| **Metadata** | Knowledge Unit | Single-Action Invokable Controllers |
| **Metadata** | Difficulty | Foundation |
| **Metadata** | Dependencies | Controller Fundamentals, Route Registration Basics |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Laravel invokable controllers handle a single action via the `__invoke` magic method, eliminating class boilerplate by removing the need to name a method. Routes point directly to the controller class without a `@method` suffix: `Route::get('/dashboard', DashboardController::class)`. This pattern is ideal for focused, single-purpose endpoints — search, webhook handlers, form submissions, dashboards. Invokable controllers encourage small, single-responsibility classes that are easier to test, understand, and maintain while remaining fully cacheable (unlike closures).

## Core Concepts

- **__invoke Method**: The single method handling the incoming request. No other public methods should exist.
- **No-Method Route Registration**: `Route::get('/url', SomeController::class)` without `@method`.
- **Single Responsibility**: Each invokable controller does exactly one thing — the class is its own route handler.
- **Auto-Resolution**: `ControllerDispatcher::dispatch()` checks for the named method first and falls back to `__invoke`.
- **Full Feature Support**: Invokable controllers support constructor DI, method injection, middleware, and form requests.
- **Descriptive Naming**: Typically verb-first: `SearchPostsController`, `RestorePostController`, `ShowDashboardController`.

## When To Use

- Single-action endpoints: search, restore, archive, export, dashboard, redirect.
- Webhook handlers (Stripe webhook receiver, Mailgun callback).
- Simple form submission endpoints.
- API callbacks and OAuth redirect handlers.
- Any endpoint that does exactly one thing and has no natural sibling actions.

## When NOT To Use

- Multi-action CRUD resources — use resource controllers with seven default methods.
- Endpoints that share related functionality — group related actions in a single resource controller.
- Closure routes that are simple enough to not need a class — but remember closures cannot be cached.
- Endpoints that may grow additional actions in the future — start with a resource controller.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Name descriptively with verb-first: `SearchPostsController` | Communicates purpose at a glance; keeps the action verb prominent |
| Use `php artisan make:controller --invokable` | Generates the correct skeleton with `__invoke` signature |
| Keep under 20-30 lines; delegate to services/actions if it grows | Invokable controllers are not an excuse to inline business logic |
| Never add a second public method to an invokable controller | Adding methods violates single-responsibility; convert to resource controller or split |
| Use invokable instead of closures for cacheable routes | Closures cannot be serialized for route caching; invokable controllers are fully cacheable |

## Architecture Guidelines

- Place invokable controllers in a dedicated directory per context: `Controllers/Api/V1/Search/`.
- File-per-action is acceptable — do not fight the single-responsibility pattern to save files.
- Invokable controllers belong in the controller layer: they receive HTTP input and return HTTP responses.
- Do not confuse invokable controllers with action classes — actions return domain objects, controllers return HTTP responses.
- Register invokable controllers with HTTP-verb-prefixed routes: `Route::get()`, `Route::post()`, etc.

## Performance Considerations

- Performance is identical to named-method controllers — the `__invoke` fallback resolves once and caches.
- Route caching works identically: `php artisan route:cache` serializes the FQCN.
- No reflection overhead after first request — Laravel caches controller method resolution.
- Invokable controllers are fully opcode-cacheable, unlike closures.

## Security Considerations

- Constructor dependencies in invokable controllers must not be request-aware — request-scoped bindings may resolve incorrectly with cached routes.
- Authorization must be applied via middleware, policies, or form request `authorize()`.
- Avoid passing the full `Request` object to delegated services — pass validated data only.
- Ensure `__invoke` exists before deployment — missing method causes 500 at dispatch time.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Adding a second public method to an invokable controller | Gradually expanding the controller's scope | Violates SRP; route registration becomes ambiguous | Convert to a resource controller or split into multiple invokable controllers |
| Defining `index()` instead of `__invoke()` | Habit from resource controller patterns | 500 error — `ControllerDispatcher` cannot find the method | Use `php artisan make:controller --invokable` to generate the skeleton |
| Using invokable where resource controller belongs | Over-application of invokable pattern | Proliferation of files; non-standard route registration | Use `Route::resource()` unless the endpoint is genuinely standalone |
| Constructor dependencies that are request-aware | Not considering route caching behavior | Different behavior between cached and non-cached routes | Avoid request-aware constructor dependencies in invokable controllers |

## Anti-Patterns

- **Invokable controller with 100+ lines**: Same problem as a fat resource controller — delegate to services/actions.
- **Invokable for every endpoint**: Using 10 invokable controllers where one resource controller would suffice.
- **Invokable controller calling `Model::all()` directly**: Still violates thin controller principle — delegate to services/repositories.
- **Mixing `__invoke` with named methods**: A controller that has both `__invoke` and `store()` creates ambiguity about which route maps to which method.

## Examples

- **Basic invokable controller**: `class ShowDashboardController extends Controller { public function __invoke() { return view('dashboard', ['stats' => DashboardStats::get()]); } }` — Route: `Route::get('/dashboard', ShowDashboardController::class);`
- **Invokable with DI**: `class SearchPostsController extends Controller { public function __invoke(SearchRequest $request, PostRepository $posts) { return PostResource::collection($posts->search($request->validated())); } }`
- **Invokable for API endpoint**: `class RestoreTrashedPostController extends Controller { public function __invoke(Post $post) { $post->restore(); return response()->noContent(); } }`
- **Invokable route registration**: `Route::post('/webhooks/stripe', StripeWebhookController::class);`

## Related Topics

- Controller Action Delegation — Delegating from invokable controllers to action/services
- Controller Dependency Injection — Constructor and method injection in invokable controllers
- Partial Resource Routes — Complementing resource routes with invokable custom actions
- Controller Testing Strategies — Testing invokable controllers via HTTP tests

## AI Agent Notes

- Generate invokable controllers with `php artisan make:controller --invokable`.
- Use invokable controllers for search, webhook, restore, export, and dashboard endpoints.
- Never add a second public method to an invokable controller — split or convert to resource.
- Keep `__invoke` under 20-30 lines; delegate business logic to services or actions.
- Register invokable routes before resource routes to avoid wildcard parameter capture.

## Verification

- [ ] Invokable controller has ONLY `__invoke` method (no other public methods)
- [ ] Route registered without `@method` suffix: `Route::get('/url', Controller::class)`
- [ ] `__invoke` method exists and is callable (tested with HTTP request)
- [ ] Controller stays under 20-30 lines; delegates business logic
- [ ] Constructor dependencies are NOT request-aware (safe for route caching)
- [ ] `php artisan route:cache` works without errors
