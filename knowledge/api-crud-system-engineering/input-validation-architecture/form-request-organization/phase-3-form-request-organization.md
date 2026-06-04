# Form Request Organization

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 3 (Production Hardening & Integration)
- **Tags:** form-request, directory-structure, organization, testing, production

## Executive Summary
Phase 3 covers production enforcement of directory standards, automated organization validation in CI, cross-team convention alignment, and integration with API documentation generators. The directory structure must be enforced, not merely suggested.

## Core Concepts

### Enforced Convention Over Voluntary Convention
Directory organization must be validated automatically in CI. A GitHub Action or Laravel command should verify that every API route has a corresponding FormRequest and that naming follows the project standard.

### Filesystem = API Map
The directory tree under `App\Http\Requests\Api\V1\` should be **isomorphic** to the API route tree. Any mismatch between routes and request files indicates a missing or deprecated validation class.

## Internal Mechanics

### CI Convention Check
```php
// Artisan command: php artisan requests:check-conventions
class CheckRequestConventions extends Command
{
    public function handle(): int
    {
        $requests = glob(app_path('Http/Requests/Api/V1/**/*Request.php'));
        $routes = collect(Route::getRoutes())->filter(fn ($r) => str_starts_with($r->uri(), 'api/v1'));

        $missing = $routes->filter(fn ($route) => !$this->hasRequest($route, $requests));

        if ($missing->isNotEmpty()) {
            $this->error('Missing FormRequests for routes:');
            $missing->each(fn ($r) => $this->line($r->uri()));
            return self::FAILURE;
        }

        $this->info('All routes have corresponding FormRequests.');
        return self::SUCCESS;
    }
}
```

### Request Map Generation
```php
class RequestMapService
{
    public function build(): array
    {
        $map = [];
        $files = File::allFiles(app_path('Http/Requests/Api/V1'));

        foreach ($files as $file) {
            $class = $this->fileToClass($file);
            $action = $this->classToAction($class);
            $map[$action] = $class;
        }

        return $map;
    }

    private function classToAction(string $class): string
    {
        return Str::of(class_basename($class))
            ->beforeLast('Request')
            ->pluralize()
            ->kebab()
            ->prepend('/api/v1/')
            ->toString();
    }
}
```

## Patterns

### Resource-Specific Request Contract Interface
```php
interface HasPaginationValidation
{
    public function paginationRules(): array;
}

interface HasSortingValidation
{
    public function sortingRules(): array;
}

class IndexPostsRequest extends ApiRequest implements HasPaginationValidation, HasSortingValidation
{
    public function paginationRules(): array
    {
        return [
            'page' => ['integer', 'min:1'],
            'per_page' => ['integer', 'min:1', 'max:100'],
        ];
    }

    public function sortingRules(): array
    {
        return [
            'sort' => ['string', Rule::in(['created_at', 'title', '-created_at', '-title'])],
        ];
    }
}
```

### Auto-Resolving Requests via Route-to-Class Convention
```php
// AppServiceProvider::boot()
Route::matched(function (RouteMatched $event) {
    $route = $event->route;
    $action = $route->getActionMethod();
    $controller = class_basename($route->getControllerClass());
    $resource = Str::of($controller)->before('Controller')->singular()->studly();
    $requestClass = "App\\Http\\Requests\\Api\\V1\\{$resource}\\{$action}{$resource}Request";

    if (class_exists($requestClass)) {
        $route->setAction('request', $requestClass);
    }
});
```

## Architectural Decisions

| Decision | Rationale |
|---|---|
| CI enforcement via custom Artisan command | Prevents convention drift without requiring manual reviews |
| Request map service for documentation | Single source of truth for OpenAPI spec generation |
| Interface-based capability tagging | Allows generic middleware to detect request capabilities without instanceof checks |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Automated convention check | Catches missing requests in CI | Additional CI step; false positives for non-REST routes |
| Route-to-class auto-resolution | Zero boilerplate in controller | Magic binding obscures request class used; hard to grep |
| Interface tagging | Enables generic middleware (pagination, sorting) | Every request must declare capabilities explicitly |

## Performance Considerations
- Convention check command runs only in CI — zero production impact.
- Route-to-class resolution adds ~2ms per request — acceptable for most APIs.
- File globbing in production should be avoided; use class map cache.

## Production Considerations
- Run `requests:check-conventions` as part of deployment gates.
- Include directory structure documentation in onboarding guide.
- Use a `REQUESTS.md` file at `app/Http/Requests` root explaining the convention.
- Archive orphaned request files (no longer referenced by any route) rather than deleting immediately.

## Common Mistakes
- Naming files differently from action (`CreatePostRequest.php` instead of `StorePostRequest.php`).
- Placing requests outside the `Api\V1` namespace and wondering why auto-resolution fails.
- Having orphaned request files that are no longer used by any route.
- Creating request files for internal commands that should not be exposed via API.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| Convention drift | Some endpoints use inline validation | CI check must be mandatory, not optional |
| Auto-resolution with wrong class | Wrong validation applied | Unit test the route matcher with all routes |
| Orphaned request files | Confusion during refactoring | Run `php artisan requests:find-orphans` quarterly |
| Cross-team naming inconsistency | Merge conflicts in request directory | Publish and enforce a naming convention RFC |

## Ecosystem Usage

### OpenAPI / Scribe Integration
```php
// Scribe extracts FormRequest rules for documentation
class PostController extends Controller
{
    /**
     * @bodyParam title string required Post title.
     * @bodyParam body string required Post body.
     */
    public function store(StorePostRequest $request) { ... }
}
```

Scribe automatically parses FormRequest `rules()` to generate OpenAPI parameters.

### Laravel Data (Spatie) Integration with Organization
```php
// File: App/Http/Requests/Api/V1/Posts/StorePostRequest.php
class StorePostRequest extends DataRequest
{
    protected string $dataClass = PostData::class;
}

// Spatie generates rules() from PostData definition
// No manual rules() override needed — organization is preserved
```

### IDE Helper for Auto-Discovery
```bash
composer require --dev barryvdh/laravel-ide-helper
php artisan ide-helper:models
php artisan ide-helper:generate
```

Generates meta file for IDE autocompletion across deeply namespaced FormRequests.

## Related Knowledge Units

### Prerequisites
- **form-request-design-for-apis** — the content being organized by these conventions.
- **form-request-organization** — Phase 2 basics of directory structure.

### Related Topics
- **dto-integration-payload-method** — DTO return type integration within organized requests.
- **conditional-validation-patterns** — organizing conditional rules across request hierarchy.

### Advanced Follow-up Topics
- **validation-rule-array-design** — complex nested rule design fitting into organized requests.
- **manual-validator-creation** — when organized request structure is insufficient.

## Research Notes

### Source Analysis
Laravel's `Route` class stores the `FormRequest` as a string in the action array. When a request comes in, the framework resolves it via the container. This means the request class must exist and be autoloadable at resolution time — the directory structure directly impacts the framework's ability to validate.

### Key Insight
The best FormRequest organization creates a **1:1 mapping between HTTP route, filesystem path, and PHP namespace**. This triple isomorphism makes the codebase self-documenting and eliminates ambiguity about where validation lives.

### Version-Specific Notes
- PHP 8.1+: `readonly` classes work well for Request classes that expose validated data as read-only.
- Laravel 10: No directory structure constraints — fully flexible.
- Laravel 11: Same; convention remains team-defined.
