# Anti-Patterns: Modular Monolith Basics

## 1. Premature Feature-Based Structure

Adopting feature-based structure for a simple project that doesn't need it.

Creating `app/Features/Billing/`, `app/Features/Users/`, `app/Features/CMS/` for a 5-model blog application. Feature-based structure adds directory overhead and requires customized Artisan stubs. For small projects, layer-based is simpler, faster to navigate, and better supported by Laravel's generators. Feature-based structure must be earned by complexity, never chosen by preference — migrate only when the application reaches 10+ models across distinct business domains.

## 2. Direct Cross-Feature Model Access

Importing and using models directly from another feature's namespace instead of going through a service layer.

```php
use App\Features\Billing\Models\Invoice;

class ReportGenerator
{
    public function generate(): array
    {
        return Invoice::where('status', 'paid')->pluck('amount')->toArray();
    }
}
```

Each feature is a bounded context owning its models, controllers, services, and routes. Direct model access creates tight coupling that prevents independent refactoring — Feature B cannot change its model structure without breaking Feature A. Always go through service interfaces or events defined in the shared kernel.

## 3. Mixed Structure Adoption

Some controllers in `app/Http/Controllers/` while others are in `app/Features/Billing/Controllers/`.

This creates ambiguity about where to put new code. Developers waste time deciding and checking. New team members cannot predict the convention. If using feature-based structure, all controllers, models, requests, and services must live inside feature directories. Do not leave some controllers in the global directory while others are in features. Commit fully or not at all.

## 4. Feature as Empty Scaffolding

Creating feature directories with all possible subdirectories (Events/, Listeners/, Jobs/, Notifications/) even when they contain no files.

Empty directories communicate "we expected to have events here" rather than the truth: "this feature has no events." They add visual clutter and make the feature appear more complex than it is. Create directories only when they contain files. A minimal feature needs only Controllers/, Models/, and a routes.php.

## 5. Feature at Wrong Granularity

Creating features that are too small (single file) or too large (50+ files in one directory).

A feature with 1-2 files creates directory overhead without benefit — a PasswordReset feature with a single controller doesn't justify its own directory. A feature with 50+ files collapses into the same navigational difficulty as layer-based structure. A feature directory should contain at least 3 files (to justify the overhead) and at most ~20 files (before it should be split into sub-features).

## 6. No Shared Kernel

Placing cross-cutting code arbitrarily inside a feature, forcing all other features to depend on that feature.

Without a shared directory (`app/Shared/` or `app/Kernel/`), base controllers, shared models, and helpers either duplicate across features or get placed arbitrarily in one feature. This creates implicit dependencies and violates DRY. Maintain an `app/Shared/` directory for code consumed by multiple features.

## 7. Circular Feature Dependencies

Feature A depends on Feature B, and Feature B depends on Feature A, creating a cycle.

Circular dependencies make features untestable in isolation, prevent feature extraction, and create tight coupling. Ensure the feature dependency graph is a directed acyclic graph. Resolve cycles by extracting the shared concern into the shared kernel or restructuring the features.
