# Strict Mode Configuration — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Design |
| Knowledge Unit | Strict Mode Configuration |
| Focus | Anti-patterns in shouldBeStrict(), lazy loading, silent discarding, and missing attribute prevention |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Strict Mode Not Enabled in Non-Production | Reliability | High |
| 2 | All-or-Nothing Strict Mode in Production | Scalability | Medium |
| 3 | Admin Panel Crashes from Unhandled Lazy Loading | Reliability | High |
| 4 | Silent Lazy Loading in Production (No Logging) | Performance | High |
| 5 | Strict Mode Configuration in AppServiceProvider | Code Organization | Low |
| 6 | `preventSilentlyDiscardingAttributes` Not Enabled Everywhere | Security | Critical |

## Repository-Wide Cross-Cutting Patterns

- The most critical anti-pattern is not enabling `preventSilentlyDiscardingAttributes` everywhere — silent data loss from mass-assignment mismatches goes completely undetected
- Failing to enable strict mode in non-production environments allows N+1 queries, silent discarding, and missing attribute bugs to reach production
- Admin panels crash when `preventLazyLoading` throws exceptions on routes that dynamically access unloaded relationships

---

## 1. Strict Mode Not Enabled in Non-Production

### Category
Reliability

### Description
Not calling `Model::shouldBeStrict()` (or the individual protections) in local, staging, and testing environments, allowing lazy loading, silent attribute discarding, and missing attribute access to go undetected during development.

### Why It Happens
Strict mode is opt-in — it's not enabled by default. Developers may not know about `shouldBeStrict()` or may not realize its importance for catching data-integrity issues early.

### Warning Signs
- No `Model::shouldBeStrict()` call anywhere in the application
- N+1 queries detected in production that were never caught during development
- Mass-assignment attempts silently fail in tests without errors
- `$model->non_existent_attribute` returns null without warning during development

### Why Harmful
- N+1 queries degrade production performance silently — no warning during development
- Silently discarded mass-assignment attributes cause data loss without errors
- Missing attribute access produces null propagation bugs that are hard to trace

### Preferred Alternative
```php
// In AppServiceProvider or ModelStrictServiceProvider:
public function boot(): void
{
    Model::shouldBeStrict(! app()->isProduction());
}
```

### Detection Checklist
- [ ] Search for `shouldBeStrict`, `preventLazyLoading`, `preventSilentlyDiscardingAttributes`, `preventAccessingMissingAttributes`
- [ ] Verify it's enabled for `local`, `testing`, `staging` environments
- [ ] Add if missing

### Related
| Rule | `05-rules.md` — Enable `Model::shouldBeStrict()` in Non-Production Environments |
| Rule | `05-rules.md` — Enable Strict Mode in Test Environment |
| Decision Tree | `07-decision-trees.md` — Strict Mode Enablement Scope |

---

## 2. All-or-Nothing Strict Mode in Production

### Category
Scalability

### Description
Using `Model::shouldBeStrict(true)` in production, which enables all three protections indiscriminately, without the ability to selectively disable individual features for performance or compatibility.

### Why It Happens
Developers use the convenient `shouldBeStrict()` method everywhere, including production, not realizing that each protection has different performance and compatibility implications.

### Warning Signs
- `Model::shouldBeStrict(true)` in production
- No individual control over lazy loading, silent discarding, or missing attribute prevention
- Performance impact from `preventAccessingMissingAttributes` (minor but measurable)
- No ability to customize the lazy loading handler for admin panels

### Preferred Alternative
```php
if (app()->isProduction()) {
    Model::preventSilentlyDiscardingAttributes();
    Model::preventLazyLoading();
    // preventAccessingMissingAttributes: evaluate performance tradeoff
}
```

### Detection Checklist
- [ ] Check if `shouldBeStrict()` is used in production context
- [ ] Replace with individual controls for granularity
- [ ] Evaluate each protection separately for production compatibility

### Related
| Rule | `05-rules.md` — Use Individual Controls for Fine-Grained Production Configuration |

---

## 3. Admin Panel Crashes from Unhandled Lazy Loading

### Category
Reliability

### Description
Enabling `preventLazyLoading()` without a custom handler, causing admin panels (Nova, Filament, custom dashboards) to throw exceptions when they access unloaded relationships for dynamic display columns.

### Why It Happens
Admin panels use lazy loading extensively for performance — they load relationship data on demand for table columns and detail views. Strict mode's default behavior (throw exception) breaks these pages.

### Warning Signs
- Admin panel pages throw `LazyLoadingViolationException`
- Admin features that worked before strict mode now return 500 errors
- Developers disable strict mode entirely to fix admin panel issues
- Comments like "we had to turn off lazy loading prevention because of Nova"

### Preferred Alternative
```php
Model::preventLazyLoading(
    throw: fn () => request()->is('admin/*') ? false : true
);
```

### Detection Checklist
- [ ] Check admin panel routes for `LazyLoadingViolationException`
- [ ] Implement custom throw callback for admin routes
- [ ] Verify admin panels function correctly with lazy logging instead of throwing

### Related
| Rule | `05-rules.md` — Use Custom Handler for Admin Panel Lazy Loading |
| Decision Tree | `07-decision-trees.md` — Lazy Loading Prevention Configuration |

---

## 4. Silent Lazy Loading in Production (No Logging)

### Category
Performance

### Description
Allowing lazy loading to occur silently in production without any logging or monitoring, so N+1 query problems degrade performance without visibility.

### Why It Happens
Developers either disable lazy loading prevention in production (to avoid exceptions) or never set it up, assuming the application is N+1-free. There's no safety net to detect new lazy loading violations introduced by code changes.

### Warning Signs
- No `preventLazyLoading()` configuration in production
- N+1 query problems detected only through slow database monitoring or customer complaints
- Performance regressions from lazy loading go unnoticed for days or weeks
- No audit trail of lazy loading violations

### Preferred Alternative
```php
Model::preventLazyLoading(
    throw: function () {
        Log::warning('Lazy loading violation', [
            'url' => request()->url(),
            'trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 5),
        ]);
        return false; // Log and continue
    }
);
```

### Detection Checklist
- [ ] Check for lazy loading prevention/logging in production
- [ ] Implement logging handler for all environments
- [ ] Set up alerts on lazy loading log entries

### Related
| Rule | `05-rules.md` — Log Instead of Silently Allow Lazy Loading in Production |

---

## 5. Strict Mode Configuration in AppServiceProvider

### Category
Code Organization

### Description
Placing all strict mode configuration in `AppServiceProvider::boot()` alongside pagination, validation, mail, and other unrelated boot configuration, making it harder to find and maintain.

### Why It Happens
`AppServiceProvider` is the default location for boot configuration. Developers add strict mode there without considering whether it deserves its own provider.

### Warning Signs
- `Model::shouldBeStrict()` buried among `Paginator::useBootstrapFive()`, `Validator::extend()`, etc.
- No `ModelStrictServiceProvider` in the project
- `AppServiceProvider::boot()` has 10+ unrelated concerns
- Onboarding developers miss strict mode configuration because it's mixed with other code

### Preferred Alternative
```php
// App\Providers\ModelStrictServiceProvider.php
class ModelStrictServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Model::shouldBeStrict(! app()->isProduction());
    }
}
```

### Detection Checklist
- [ ] Check if `AppServiceProvider::boot()` contains model strict configuration
- [ ] Extract to a dedicated `ModelStrictServiceProvider`
- [ ] Register the new provider in `config/app.php`

### Related
| Rule | `05-rules.md` — Create a Dedicated Service Provider for Strict Mode |
| Skill | `06-skills.md` — Enable Eloquent Strict Mode Across Environments |

---

## 6. `preventSilentlyDiscardingAttributes` Not Enabled Everywhere

### Category
Security

### Description
Failing to enable `preventSilentlyDiscardingAttributes` in any environment, allowing mass-assignment attempts for non-fillable attributes to fail silently without error, causing data loss.

### Why It Happens
The default Eloquent behavior is to silently discard non-fillable attributes. Developers may rely on this behavior or may not realize that data is being lost.

### Warning Signs
- `Model::create($request->validated())` silently drops attributes not in `$fillable`
- Debugging sessions where data "disappears" but no error is thrown
- `$order->update(['status' => 'paid', 'internal_note' => 'fraud review'])` — `internal_note` silently discarded
- No `preventSilentlyDiscardingAttributes()` call anywhere in the application

### Preferred Alternative
```php
// Must be enabled in EVERY environment, including production:
Model::preventSilentlyDiscardingAttributes();
```

### Detection Checklist
- [ ] Search for `preventSilentlyDiscardingAttributes` — is it enabled?
- [ ] Verify it's enabled in all environments including production
- [ ] Add if missing — this is non-negotiable

### Related
| Rule | `05-rules.md` — Never Deploy Without `preventSilentlyDiscardingAttributes` |
| Decision Tree | `07-decision-trees.md` — Silent Discarding Prevention |
