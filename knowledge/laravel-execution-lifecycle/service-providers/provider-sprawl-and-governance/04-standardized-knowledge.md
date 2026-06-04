# Provider Sprawl and Governance

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Providers |
| Knowledge Unit | Provider Sprawl and Governance |
| Difficulty | Enterprise |
| Lifecycle Phase | Bootstrap |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Provider sprawl is the uncontrolled proliferation of service providers beyond what is architecturally justified. As teams grow and packages accumulate, provider counts can reach 50, 100, or more — each adding bootstrap time, memory pressure, and complexity. Governance strategies include provider budgeting, quarterly audits, deferred-first policies, and CI enforcement. The key metric is "providers per request" — the number of providers instantiated on the critical path of a typical request.

## Core Concepts
- **Provider Sprawl** — Excessive provider count (>50) degrading performance and maintainability.
- **Provider Budget** — Hard limit on provider count enforced via CI.
- **Deferred-First Policy** — Default to deferred for new providers unless eager is justified.
- **Provider Audit** — Periodic review of all registered providers; remove unused, consolidate fragmented.
- **Sprawl Dashboard** — Custom Artisan commands to track provider count, type, and boot time.

## When To Use
- Enterprise applications with 50+ providers and strict performance requirements.
- Teams experiencing bootstrap time degradation as provider count grows.
- Organizations with formal architecture governance practices.
- High-throughput applications where every millisecond of bootstrap time matters.

## When NOT To Use
- Small applications (<10 providers) — governance overhead not justified.
- Prototypes or MVPs where speed is priority over architecture.
- Applications not yet experiencing provider-related performance issues.

## Best Practices
- **Set a provider budget** — Hard limit (e.g., 30 max) enforced via CI. New additions require consolidation or removal.
- **Perform quarterly provider audits** — Review all registered providers, assess necessity, consolidate where appropriate.
- **Default to deferred** — New package providers should be deferred unless a specific need for eager is justified.
- **Monitor provider count as a deployment metric** — Sudden increases indicate unvetted package additions.
- WHY: Provider sprawl is a classic tragedy of the commons — each individual addition seems reasonable, but the cumulative effect degrades performance. Governance is the solution, requiring organizational commitment.

## Architecture Guidelines
- `bootstrap/providers.php` is the single source of truth for eager providers — audit this file.
- `bootstrap/cache/packages.php` contains auto-discovered providers — include in audit.
- Council: each provider should justify its existence — what would break if this provider were removed?
- Octane changes the cost model — provider overhead paid at worker boot, not per-request.

## Performance Considerations
- Each eager provider adds ~0.1-0.5ms bootstrap time; 100 providers = 10-50ms.
- Deferred providers add zero bootstrap time until their services are requested.
- 80/20 rule: 20% of providers account for 80% of bootstrap time — identify and optimize.
- Profiling with Xdebug or Blackfire reveals exact provider contribution.

## Security Considerations
- Each additional provider increases attack surface — more code runs during boot.
- Auto-discovered providers from packages may introduce unexpected behavior.
- Provider sprawl makes security audit harder — more code paths to review.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Assuming provider count doesn't matter | Performance myopia | Cumulative overhead degrades TTFB | Track provider count as deployment metric |
| Only counting manual providers | Ignoring auto-discovered packages | Underestimating true provider count | Audit both `bootstrap/providers.php` and `packages.php` |
| Adding provider without checking for existing duplicate | Missing discovery | Wasted instantiation of redundant binding | Check `$app->bound()` before adding new provider |
| Consolidating too aggressively | Overreaction to sprawl | God providers impossible to maintain | Keep domain boundaries; consolidate within domain |

## Anti-Patterns
- **Unchecked Provider Growth** — Adding providers without governance; count doubles every year.
- **God Provider After Consolidation** — Creating a single massive provider that registers unrelated services.
- **Alert Fatigue** — Setting provider budget too low, violated frequently, team ignores alerts.

## Examples

### CI provider count check
```bash
# CI step to enforce provider budget
MAX_PROVIDERS=30
COUNT=$(php -r "echo count(require 'bootstrap/providers.php');")
if [ "$COUNT" -gt "$MAX_PROVIDERS" ]; then
    echo "Provider budget exceeded: $COUNT > $MAX_PROVIDERS"
    exit 1
fi
```

### Artisan provider audit command
```php
// php artisan audit:providers
$providers = require base_path('bootstrap/providers.php');
$discovered = app(PackageManifest::class)->providers();

$this->info('Eager providers: ' . count($providers));
$this->info('Discovered providers: ' . count($discovered));
$this->info('Total: ' . (count($providers) + count($discovered)));
```

## Related Topics
- **Prerequisites:** Provider Fundamentals, Eager Providers, Deferred Providers
- **Closely Related:** Provider Organization Strategies, Environment-Specific Providers
- **Advanced:** Boot Order Timing, Architectural Fitness Functions
- **Cross-Domain:** Performance Monitoring (Laravel Pulse, TTFB tracking)

## AI Agent Notes
- Provider count is an application health metric — track it alongside response times.
- When TTFB increases, check if provider count has grown — correlate in monitoring.
- Octane deployments have different cost model — provider overhead less critical per-request but still impacts worker memory.

## Verification
- [ ] Can audit the full provider list (manual + discovered) for an application
- [ ] Can set up CI enforcement of provider budget
- [ ] Can perform a provider audit and identify candidates for deferral or removal
- [ ] Understand the different cost model under Octane vs FPM
- [ ] Can build a custom Artisan command for provider sprawl dashboard
