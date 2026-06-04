# Skill: Organize Providers by Domain Bounded Context

## Purpose

Restructure service providers from a flat or technically-layered layout into one organized by domain bounded context, making the bootstrap sequence readable as an architecture map.

## When To Use

- Medium-to-large applications (10+ providers) with no clear organization.
- Teams where multiple developers work on different domains.
- Existing providers are a mix of technical layers with no domain visibility.
- Preparing for future extraction of domains into microservices.

## When NOT To Use

- Small applications (<5 providers) with stable organization.
- Prototypes or MVPs where speed of development is the priority.
- Applications where provider count is unlikely to grow beyond 10.

## Prerequisites

- Provider Fundamentals
- Understanding of bounded contexts in domain-driven design
- Existing provider structure

## Inputs

- `bootstrap/providers.php` current contents
- List of all provider classes and their responsibilities
- Application's bounded context map (payments, notifications, inventory, etc.)

## Workflow

1. List all existing providers and categorize each by domain bounded context.
2. Create subdirectory structure: `app/Providers/{DomainName}/` for each context.
3. Move provider files into their respective subdirectories; update namespaces.
4. Rename providers to reflect domain: `PaymentsServiceProvider`, `NotificationServiceProvider`.
5. Update `bootstrap/providers.php` to list providers by domain, grouped with comments:
   ```php
   return [
       // Infrastructure
       App\Providers\AppServiceProvider::class,
       App\Providers\EventServiceProvider::class,
       // Domains
       App\Providers\Payments\PaymentsServiceProvider::class,
       App\Providers\Notifications\NotificationServiceProvider::class,
       App\Providers\Inventory\InventoryServiceProvider::class,
   ];
   ```
6. Use `bootstrap/providers.php` ordering to express dependency order (infrastructure first, domains after).
7. For sub-providers within a domain, use the proxy provider pattern.

## Validation Checklist

- [ ] Each domain has one dedicated provider in `app/Providers/{DomainName}/`
- [ ] Provider class names reflect domain responsibility (not generic names)
- [ ] `bootstrap/providers.php` is grouped with comments showing the architecture layers
- [ ] No cross-domain bindings in a single provider (each provider scoped to its domain)
- [ ] Registration order respects dependencies (infrastructure before domains)
- [ ] All existing bindings still resolve correctly after reorganization

## Common Failures

| Failure | Likely Cause |
|---------|--------------|
| Bindings broken after move | Namespace not updated in provider class or imports |
| Provider count too high after organization | One provider per service (too granular) instead of one per bounded context |
| Misnamed providers | Using generic names like `ServiceProvider` or `CoreProvider` |
| Cross-domain dependencies in boot() | Provider from one domain depends on another domain's boot-time side effects |

## Decision Points

- **Dedicated vs Consolidated**: Can a single domain provider handle all bindings for that context? → Yes, unless the domain itself has multiple sub-domains.
- **Proxy vs Direct**: When a domain has 5+ sub-concerns → proxy provider pattern. When <5 → single provider with private methods.

## Performance Considerations

- Provider count stays within 10-30 range — avoids fragmentation overhead.
- Domain-organized providers make it possible to selectively defer entire domains.
- Readability improvement doesn't affect runtime performance — same number of providers, just better organized.

## Security Considerations

- Well-organized providers make security audits easier — security-related providers are identifiable by name.
- Domain isolation makes it easier to identify stale or unnecessary providers with security implications.
- Infrastructure providers (auth, encryption) are clearly separated from domain providers.

## Related Rules

- Rule 1: Create One Provider per Domain Bounded Context
- Rule 2: Keep Provider Count Between 10 and 30 for Medium-to-Large Applications
- Rule 4: Use `bootstrap/providers.php` as an Architecture Map
- Rule 5: Name Providers by Domain, Never Generic Names Like `ServiceProvider`
- Rule 6: Consolidate Providers Within Domain Boundaries, Never Across Them

## Related Skills

- Consolidate Providers Using Proxy Pattern
- Enforce Provider Budget in CI

## Success Criteria

- `bootstrap/providers.php` reads like an application architecture map — infrastructure layer, then domain contexts.
- Each domain's bindings are discoverable in one predictable location.
- New team members can understand application capabilities from the provider list.
---

# Skill: Consolidate Providers Using Proxy Pattern

## Purpose

Reduce excessive provider fragmentation by grouping related sub-providers under a single domain provider using the proxy pattern — the domain provider delegates registration to sub-providers via `$this->app->register()`.

## When To Use

- A single bounded context has 5+ sub-providers that are all part of the same domain.
- Provider count exceeds 50 and needs reduction for maintainability.
- A domain has natural sub-groupings (e.g., Payments has Stripe, Invoice, Subscription).
- Reducing `bootstrap/providers.php` length for better readability.

## When NOT To Use

- Providers from different bounded contexts — never consolidate across domain boundaries.
- Small domains with <3 sub-providers — direct registration is simpler.
- When sub-providers need different deferral strategies — proxy provider makes selective deferral harder.

## Prerequisites

- Provider organization by domain bounded context
- Understanding of `$this->app->register()` delegation

## Inputs

- List of sub-providers within a domain
- Domain provider class (the proxy)
- `bootstrap/providers.php` contents

## Workflow

1. Identify sub-providers within the same domain that can be grouped (e.g., `StripeProvider`, `InvoiceProvider`, `SubscriptionProvider` all under Payments).
2. Create or reuse the domain provider as a proxy:
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
3. Remove the sub-providers from `bootstrap/providers.php` — only the proxy provider stays.
4. Run `php artisan optimize` to rebuild any cached provider manifests.
5. Verify all bindings from sub-providers are still available.

## Validation Checklist

- [ ] Proxy provider only contains `$this->app->register()` calls for sub-providers
- [ ] All sub-providers are within the same domain bounded context
- [ ] Sub-providers removed from `bootstrap/providers.php`
- [ ] Proxy provider listed in `bootstrap/providers.php`
- [ ] All bindings still resolvable after consolidation
- [ ] Registration order of sub-providers within proxy is correct

## Common Failures

| Failure | Likely Cause |
|---------|--------------|
| Bindings not available after consolidation | Sub-provider not registered in proxy — missed during consolidation |
| Registration order issues | Sub-providers registered in wrong order within proxy |
| Domain coupling | Consolidating providers from different bounded contexts into one proxy |
| Deferred providers broken by proxy | Proxy is deferred but contains sub-providers with boot-time artifacts |

## Decision Points

- **Proxy vs Direct**: When 5+ sub-providers in one domain → proxy. When <5 → direct registration in `bootstrap/providers.php`.
- **Eager vs Deferred Proxy**: If any sub-provider has eager requirements (routes, views) → proxy must be eager. If all sub-providers are deferred-eligible → proxy can be deferred.

## Performance Considerations

- Proxy pattern adds one extra method call per sub-provider registration — negligible overhead.
- Total provider count in `bootstrap/providers.php` decreases, but total providers instantiated stays the same.
- Makes selective deferral harder — consider if all sub-providers should be deferred together.

## Security Considerations

- Proxy provider contains references to all sub-providers — audit the proxy to ensure no unexpected providers are registered.
- Consolidation can hide individual sub-provider responsibility — document what each sub-provider does.

## Related Rules

- Rule 6: Consolidate Providers Within Domain Boundaries, Never Across Them

## Related Skills

- Organize Providers by Domain Bounded Context
- Enforce Provider Budget in CI

## Success Criteria

- Provider count in `bootstrap/providers.php` reduced by consolidating related sub-providers.
- All bindings remain available after consolidation.
- Proxy provider is documented with its sub-provider responsibilities.
