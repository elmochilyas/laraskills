# 04-Standardized Knowledge: Pulse Cards Custom Development

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | developer-tooling-debugging |
| **Knowledge Unit** | pulse-cards-custom-development |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Maturing |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-pulse, laravel-telescope, debugbar-collectors-profiling |
| **Framework/Language** | Laravel Pulse, Livewire, PHP, Alpine.js, Tailwind CSS |

## Overview

Pulse custom cards extend Laravel Pulse's dashboard with app-specific metrics. A custom card is a Livewire component implementing `Pulse\Card`, registering data recorders to capture metrics and rendering dashboard cards. Built with Livewire (server-side), Alpine.js (client-side), Tailwind CSS (styling). Can monitor business metrics (registrations/hour, order throughput), app-specific performance (API latency), or third-party integrations (deployment status). Uses `Pulse::record()` for recording and `Pulse::values()` for retrieval.

## Core Concepts

- **Pulse Card Component**: Livewire component extending `Pulse\Card` with `render()` returning a dashboard view
- **Recorder**: class extending `Pulse\Recorder` capturing metrics via event listening or `Pulse::record()` calls
- **Pulse::record()**: static method recording metric entries: `Pulse::record('user_registrations', $userId, 1)->count()`
- **Pulse::values()**: static method retrieving aggregated values: `Pulse::values('user_registrations', ['count'])`
- **Card Registration**: registered in `config/pulse.php` `cards` array with display order
- **Dashboard Width**: `cols-1` (full), `cols-2` (half), `cols-3` (third)

## When to Use

- Tracking business KPIs visible on Pulse dashboard
- Monitoring app-specific performance beyond Pulse's built-in cards
- Providing Pulse cards as part of a Composer package
- Creating team-specific dashboards with focused metrics

## When NOT to Use

- When built-in cards already cover the metric
- For complex analysis requiring drill-down (use dedicated dashboard instead)
- High-frequency metrics >1000 records/second without batching

## Best Practices (WHY)

- **Start with built-in cards**: add custom cards only for business-critical metrics not covered
- **Use unique metric name prefixes**: avoids collisions between multiple custom cards
- **Record aggregated data**: batch high-frequency metrics to reduce storage overhead
- **Handle empty states gracefully**: display "No data" instead of crashing when no metrics recorded
- **Optimize card queries**: query aggregated data only (not raw entries) for fast rendering
- **Keep cards simple**: at-a-glance views; move complex analysis to dedicated dashboards

## Architecture Guidelines

- Register in `config/pulse.php` under `cards` array
- Use Livewire polling (configurable interval) for real-time updates
- Cards should query aggregated data (binned) not raw entries
- Wrap card rendering in try-catch so errors don't break entire dashboard
- Use CSS Grid for responsive card layout

## Performance Considerations

- Each `Pulse::record()` call: <0.5ms; batch for high-frequency metrics
- Card render: <5ms per query on aggregated data
- Dashboard render: <1s with 10+ cards; optimize slow cards
- Storage growth proportional to metric recording frequency

## Security Considerations

- Custom cards may expose sensitive business metrics (revenue, user counts)
- Use Pulse's authorization gate to restrict card access
- Cards should handle missing data gracefully

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Recording too granularly | Per-event recording for 1000+ events/s | Storage overwhelm | Batch or periodic recording |
| Not aggregating in recorder | Raw values without aggregation | Slow dashboard renders | Use Pulse::record with counts |
| Over-complicated cards | Multiple charts, filters, drill-downs | Complex maintenance | Keep at-a-glance; move analysis elsewhere |
| Duplicating built-in metrics | Tracking what Pulse already provides | Redundant | Use Pulse's existing data |
| No empty state handling | Crash when no metrics recorded | Broken dashboard | Handle "no data yet" gracefully |

## Anti-Patterns

- **Custom card as mini-application**: Pulse cards should be widgets, not full applications
- **Recording from multiple sources without coordination**: metric key collisions overwrite data

## Examples

```php
class UserRegistrationsCard extends Card
{
    public function render()
    {
        $registrations = Pulse::values('user_registrations', ['count']);
        return view('pulse-cards.user-registrations', [
            'registrations' => $registrations,
        ]);
    }
}
```

## Related Topics

- laravel-pulse — Pulse overview and built-in cards
- laravel-telescope — request-level debugging
- debugbar-collectors-profiling — development profiling

## AI Agent Notes

- Suggest custom Pulse cards for business metrics during project planning
- Default card should display "no data" state in render method

## Verification

- [ ] Custom card registered in `config/pulse.php`
- [ ] Unique metric name prefix used
- [ ] Empty state handled in render
- [ ] Card queries aggregated (not raw) data
- [ ] Business metrics don't expose sensitive data
- [ ] Card width configured appropriately
