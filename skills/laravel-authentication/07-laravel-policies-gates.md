# Laravel Policies & Gates

## Objective

Define production-grade Laravel Policy and Gate implementation standards covering design patterns, organization, authorization testing, and multi-tenant authorization.

## Core Philosophy

Policies and Gates are Laravel's native authorization building blocks. Policies organize authorization logic around Eloquent models. Gates handle non-model operations. Both must enforce the principle of least privilege with explicit, testable rules.

## Architecture Standards

### Policy vs Gate Decision

| Aspect | Policy | Gate |
|--------|--------|------|
| Scope | Model-based | Non-model or cross-model |
| Organization | One class per model | Defined in AuthServiceProvider |
| Auto-discovery | By naming convention | Manual registration |
| Method naming | `view`, `create`, `update`, `delete` | Arbitrary verb-noun |
| Parameters | User + Model instance | User + arbitrary arguments |

**Rule:** Use a Policy when authorizing access to a resource. Use a Gate for everything else.

### Policy Design

```php
// App\Policies\DocumentPolicy.php
class DocumentPolicy
{
    use HandlesAuthorization;

    public function before(User $user, string $ability): ?bool
    {
        // Super-admin bypass — use sparingly
        if ($user->hasRole('super-admin')) {
            return true;
        }

        return null; // Defer to method-specific checks
    }

    public function viewAny(User $user): bool
    {
        return $user->can('documents:read');
    }

    public function view(User $user, Document $document): bool
    {
        return $user->can('documents:read')
            && ($user->id === $document->user_id || $document->sharedWith($user));
    }

    public function create(User $user): bool
    {
        return $user->can('documents:write');
    }

    public function update(User $user, Document $document): bool
    {
        return $user->can('documents:write')
            && $user->id === $document->user_id;
    }

    public function delete(User $user, Document $document): bool
    {
        return $user->can('documents:delete')
            && $user->id === $document->user_id;
    }

    public function restore(User $user, Document $document): bool
    {
        return $user->can('documents:delete')
            && $user->id === $document->user_id;
    }

    public function forceDelete(User $user, Document $document): bool
    {
        return $user->hasRole('admin');
    }

    public function share(User $user, Document $document, User $targetUser): bool
    {
        return $user->id === $document->user_id
            && $user->id !== $targetUser->id
            && !$document->sharedWith($targetUser);
    }
}
```

### Policy Organization

```
app/Policies/
├── DocumentPolicy.php
├── UserPolicy.php
├── TeamPolicy.php
├── CommentPolicy.php
└── InvoicePolicy.php

app/Policies/Concerns/
├── HandlesOwnership.php
├── HandlesTenantScope.php
└── HandlesSoftDeletes.php
```

```php
// App\Policies\Concerns\HandlesOwnership.php
trait HandlesOwnership
{
    protected function ownsResource(User $user, Model $resource, string $ownerKey = 'user_id'): bool
    {
        return $user->id === $resource->{$ownerKey};
    }

    protected function ownsOrAdmin(User $user, Model $resource, string $ownerKey = 'user_id'): bool
    {
        return $this->ownsResource($user, $resource, $ownerKey) || $user->hasRole('admin');
    }
}
```

### Gate Design

```php
// App\Providers\AuthServiceProvider.php
class AuthServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Feature gates
        Gate::define('export-reports', fn (User $user) => $user->can('reports:export'));
        Gate::define('import-data', fn (User $user) => $user->can('data:import'));

        // Department-scoped gate
        Gate::define('view-department-report', function (User $user, Department $department) {
            return $user->can('reports:view')
                && ($user->department_id === $department->id || $user->hasRole('admin'));
        });

        // Resource existence gate
        Gate::define('join-team', function (User $user, Team $team) {
            return $team->isOpen()
                && !$team->isFull()
                && !$team->hasMember($user);
        });
    }
}
```

### Controller Authorization

```php
// 1. Using authorize() — for single model operations
class DocumentController
{
    public function show(Document $document): JsonResource
    {
        $this->authorize('view', $document);
        return new DocumentResource($document);
    }

    public function store(StoreDocumentRequest $request): JsonResource
    {
        $this->authorize('create', Document::class);
        $document = Document::create($request->validated());
        return new DocumentResource($document);
    }

    public function update(UpdateDocumentRequest $request, Document $document): JsonResource
    {
        $this->authorize('update', $document);
        $document->update($request->validated());
        return new DocumentResource($document);
    }
}

// 2. Using authorizeResource() — for resource controllers
class PostController
{
    public function __construct()
    {
        $this->authorizeResource(Post::class, 'post');
    }
}

// 3. Using Gate facade — for non-model operations
class ReportController
{
    public function export(Request $request): BinaryFileResponse
    {
        Gate::authorize('export-reports');
        return $this->reportService->export($request->all());
    }
}

// 4. Using FormRequest authorize() — for scoped validation + authorization
class UpdateDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('document'));
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'content' => ['sometimes', 'string', 'max:100000'],
        ];
    }
}
```

### Blade Authorization

```blade
{{-- @can / @cannot for conditional rendering --}}
@can('update', $document)
    <a href="{{ route('documents.edit', $document) }}">Edit</a>
@endcan

@cannot('update', $document)
    <span class="text-gray-400">Editing not available</span>
@endcannot

{{-- @canany for multiple abilities --}}
@canany(['update', 'delete'], $document)
    <div class="actions">
        @can('update', $document)
            <button>Edit</button>
        @endcan
        @can('delete', $document)
            <button>Delete</button>
        @endcan
    </div>
@endcanany

{{-- @unless for negative checks --}}
@unless (Gate::denies('export-reports'))
    <button>Export Reports</button>
@endunless
```

## Authorization Testing

```php
// tests/Feature/Authorization/DocumentPolicyTest.php
describe('DocumentPolicy', function () {
    beforeEach(function () {
        $this->user = User::factory()->create();
        $this->document = Document::factory()->for($this->user)->create();
    });

    test('owner can view their document', function () {
        expect($this->user->can('view', $this->document))->toBeTrue();
    });

    test('other user cannot view the document', function () {
        $otherUser = User::factory()->create();
        expect($otherUser->can('view', $this->document))->toBeFalse();
    });

    test('shared user can view the document', function () {
        $sharedUser = User::factory()->create();
        $this->document->shareWith($sharedUser);

        expect($sharedUser->can('view', $this->document))->toBeTrue();
    });

    test('admin can view any document', function () {
        $admin = User::factory()->admin()->create();
        $otherDocument = Document::factory()->create();

        expect($admin->can('view', $otherDocument))->toBeTrue();
    });
});

// tests/Feature/Authorization/GateTest.php
describe('Gates', function () {
    test('user with export permission can export reports', function () {
        $user = User::factory()->withPermission('reports:export')->create();
        expect($user->can('export-reports'))->toBeTrue();
    });

    test('user without export permission cannot export reports', function () {
        $user = User::factory()->create();
        expect($user->can('export-reports'))->toBeFalse();
    });
});
```

## Multi-Tenant Authorization

```php
class TenantScopedPolicy
{
    public function view(User $user, Document $document): bool
    {
        // Tenant isolation — must match
        if ($user->tenant_id !== $document->tenant_id) {
            return false;
        }

        // Within tenant, check ownership or sharing
        return $user->id === $document->user_id
            || $document->sharedWith($user)
            || $user->hasTenantRole('admin');
    }
}
```

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
|-------------|---------|----------|
| Giant `before()` method | Policy becomes untestable monolith | Keep `before()` to super-admin only |
| Authorization in models | Model has too many responsibilities | Move to Policy |
| `AllowAll` policy | No actual authorization | Every method must have explicit logic |
| Missing `viewAny` | Listing resources bypasses auth | Always define `viewAny` |
| Auth in middleware | Can't use FormRequest authorization | Use Policy in FormRequest `authorize()` |
| Duplicate logic across policies | DRY violation | Extract traits or base classes |

## AI Coding Agent Rules

1. Every Eloquent model must have a corresponding Policy class
2. Policy methods must be ordered: `viewAny`, `view`, `create`, `update`, `delete`, `restore`, `forceDelete`
3. `before()` must only handle super-admin — all other logic belongs in method-specific checks
4. Gates must use verb-noun naming: `{action}-{resource}`
5. All controller resource operations must use `authorize()` or `authorizeResource()`
6. FormRequest `authorize()` must delegate to a Policy — never inline logic
7. Permission names must follow `{resource}:{action}` convention (`documents:read`)
8. Authorization tests must cover every Policy method
9. Multi-tenant policies must include tenant ID validation in every method
10. Never use `Gate::allowIf(fn () => true)` or equivalent as a placeholder

## Production Checklist

- [ ] Every model has a Policy with all standard methods
- [ ] `before()` method only handles super-admin bypass
- [ ] All controller state-changing operations use `$this->authorize()`
- [ ] FormRequest `authorize()` delegates to Policy
- [ ] Blade templates use `@can` for conditional rendering
- [ ] Authorization tests exist for every Policy method
- [ ] Permission names follow `{resource}:{action}` convention
- [ ] Multi-tenant scope validated in all resource policies
- [ ] Custom Gates documented in AuthServiceProvider
- [ ] Policy-related traits extracted for shared behavior
