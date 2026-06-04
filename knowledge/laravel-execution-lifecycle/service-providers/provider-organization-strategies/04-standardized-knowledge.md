# Provider Organization Strategies

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Providers |
| Knowledge Unit | Provider Organization Strategies |
| Difficulty | Advanced |
| Lifecycle Phase | Bootstrap |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
As applications grow, the number of service providers increases. Without deliberate organization, providers become a dumping ground for bootstrapping logic — violating SRP and making the bootstrap sequence opaque. The core tension is between dedicated providers (one per bounded context) and consolidated providers (fewer, larger providers grouping related concerns). The recommended approach for medium-to-large applications is one provider per domain bounded context, with a total count of 10-30 providers.

## Core Concepts
- **Dedicated Providers** — One provider per concern/package; follow SRP, easy to locate.
- **Consolidated Providers** — Fewer providers grouping related bindings; lower overhead but more coupling.
- **Domain-Driven Organization** — Providers in `app/Providers/DomainName/` subdirectories.
- **Proxy Provider** — Lightweight provider that delegates to sub-providers via `$this->app->register()`.
- **`bootstrap/providers.php`** — Serves as high-level architecture map of application capabilities.

## When To Use
- Medium-to-large applications (10+ providers) needing structure and discoverability.
- Teams where multiple developers work on different domains.
- Applications with clear bounded contexts (payments, notifications, inventory, etc.).

## When NOT To Use
- Small applications with <5 providers — organization overhead not justified.
- Prototypes or MVPs where speed of development is the priority.
- When provider count is stable and below 10 — consolidation adds unnecessary complexity.

## Best Practices
- **One provider per bounded context** — Align provider boundaries with domain boundaries.
- **Keep provider count 10-30** — Above 50, consider consolidation or deferred loading.
- **Use `bootstrap/providers.php` as architecture map** — The provider list should tell a story about application capabilities.
- **Consolidate via private methods, not god providers** — Single provider with private methods for sub-concerns is better than monolithic god provider.
- WHY: Provider organization directly affects maintainability — well-organized providers make the bootstrap sequence readable and make it easy to find where services are registered.

## Architecture Guidelines
- `bootstrap/providers.php` accepts a flat array — no nesting or grouping support.
- Hierarchical provider trees are possible via `$this->app->register()` delegation.
- Subdirectory organization: `app/Providers/Payments/`, `app/Providers/Notifications/`.
- Provider class names should reflect domain: `PaymentsServiceProvider`, not `ServiceProvider`.

## Performance Considerations
- Each provider adds constructor + `register()` + `boot()` overhead; 10 providers = ~30 method calls, 100 = ~300.
- Deferred providers are the primary scaling strategy for high provider counts.
- Dedicated providers make it possible to selectively defer individual concerns.
- Octane changes the cost equation — provider overhead paid once per worker start.

## Security Considerations
- Well-organized providers make security audit easier — security-related bindings are in identifiable providers.
- God providers make it harder to assess blast radius of a provider crash.
- Domain-organized providers enable environment-specific groups (development-only payment stubs).

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| One provider per service class | SRP over-application | 50+ trivial providers; high iteration overhead | Group related bindings in domain providers |
| Putting everything in `AppServiceProvider` | Convenience | God class impossible to test or reason about | Create dedicated domain providers |
| Registering providers from database content | Dynamic bootstrap attempt | Non-deterministic provider loading | Keep provider registration static |
| Provider names not reflecting domain | Poor naming | Hard to locate where services are registered | Name providers by bounded context |

## Anti-Patterns
- **God AppServiceProvider** — Single provider registering all application services.
- **Provider Per Class** — One provider for every service class, leading to 50+ trivial providers.
- **Dynamic Provider Registration** — Loading providers from database or cache at runtime.

## Examples

### Domain-organized providers
```php
// bootstrap/providers.php
return [
    App\Providers\AppServiceProvider::class,
    App\Providers\Payments\PaymentsServiceProvider::class,
    App\Providers\Notifications\NotificationServiceProvider::class,
    App\Providers\Inventory\InventoryServiceProvider::class,
    App\Providers\Analytics\AnalyticsServiceProvider::class,
];
```

### Proxy provider pattern
```php
class PaymentsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->register(StripeProvider::class);
        $this->app->register(InvoiceProvider::class);
        $this->app->register(SubscriptionProvider::class);
    }
}
```

## Related Topics
- **Prerequisites:** Provider Fundamentals, Domain-Driven Design basics
- **Closely Related:** Provider Sprawl and Governance, Environment-Specific Providers
- **Advanced:** Hierarchical Provider Trees, Boot Order Timing
- **Cross-Domain:** Architecture Decision Records (provider organization decisions)

## AI Agent Notes
- When onboarding to a large Laravel app, start by reading `bootstrap/providers.php` — it's the architecture map.
- Provider count is a health metric — track it over time and alert on significant increases.
- DDD-aligned provider organization makes it easy to extract microservices later.

## Verification
- [ ] Can organize providers by domain bounded context
- [ ] Know when to use dedicated vs consolidated providers
- [ ] Can implement proxy provider pattern for hierarchical registration
- [ ] Can read `bootstrap/providers.php` as an architecture map
- [ ] Can identify and refactor god AppServiceProvider
