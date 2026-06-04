# Skill: Develop Custom Pulse Cards

## Purpose
Create custom Pulse dashboard cards for app-specific metrics using Livewire, Alpine.js, and Tailwind CSS by extending `Pulse\Card` and implementing data recorders.

## When To Use
- Tracking business KPIs visible on Pulse dashboard
- Monitoring app-specific performance beyond Pulse's built-in cards
- Providing Pulse cards as part of a Composer package
- Creating team-specific dashboards with focused metrics

## When NOT To Use
- When built-in cards already cover the metric
- For complex analysis requiring drill-down (use dedicated dashboard instead)
- High-frequency metrics >1000 records/second without batching

## Prerequisites
- Laravel Pulse installed and configured
- Livewire installed (included with Pulse)
- Familiarity with Alpine.js and Tailwind CSS

## Inputs
- `config/pulse.php` — card registration configuration
- Custom card class (extends `Pulse\Card`)
- Recorder class (for capturing metric data)
- Blade view for card rendering

## Workflow

1. **Create Recorder Class:** Extend `Pulse\Recorder` to capture metric data. Use `Pulse::record('metric_name', $key, $value)` within the recorder to store metric entries. Register the recorder in `config/pulse.php`.

2. **Record Metric Data:** In application code (event listeners, middleware, jobs), call `Pulse::record('user_registrations', $userId, 1)->count()` to record metric entries with appropriate aggregation type (`count()`, `avg()`, `max()`, `min()`).

3. **Create Card Component:** Extend `Pulse\Card` for the Livewire component. Use `Pulse::values('metric_name', ['count'])` to retrieve aggregated values. Define `render()` returning a dashboard view.

4. **Build Card View:** Create a Blade view using Pulse's card components. Use Alpine.js for client-side interactivity and Tailwind CSS for styling with Pulse's design system.

5. **Register Card:** Add the card to `config/pulse.php` `cards` array with display position. Configure dashboard width: `cols-1` (full), `cols-2` (half), `cols-3` (third).

6. **Verify Dashboard:** Access `/pulse` and confirm the custom card renders with live-updating data. Verify metric values match expected application behavior.

## Validation Checklist

- [ ] Recorder captures metrics via `Pulse::record()`
- [ ] Card component retrieves values via `Pulse::values()`
- [ ] Card renders correctly on the Pulse dashboard
- [ ] Live updates via SSE work correctly
- [ ] Card width and position match configuration
- [ ] Performance acceptable (< 1000 records/second without batching)

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Recorder not registered | No data captured; card shows empty |
| Record method wrong aggregation | Incorrect metric values displayed |
| High-frequency overwhelming storage | Records > 1000/sec without batching |
| Card not appearing | Not registered in `config/pulse.php` cards array |

## Decision Points

- **Built-in vs custom cards:** Start with built-in cards; add custom only for business-critical metrics
- **Recording frequency:** Batch high-frequency metrics (> 1000/sec) to avoid storage issues
- **Card width:** Use `cols-2` for secondary metrics, `cols-1` for primary KPIs

## Performance/Security Considerations

- **Recording overhead:** Each `Pulse::record()` call adds minimal overhead; batch for high-frequency metrics
- **Dashboard access:** Custom cards inherit Pulse's authentication; ensure they don't expose sensitive data
- **Storage:** Custom metrics add to Pulse's data tables; monitor growth for high-volume recorders

## Related Rules

- PULSECARD-RULE-001: Extend Pulse\Card
- PULSECARD-RULE-002: Register in pulse.php
- PULSECARD-RULE-003: Use Pulse::record()
- PULSECARD-RULE-004: Use Pulse::values()
- PULSECARD-RULE-006: Dashboard width

## Related Skills

- Configure Laravel Pulse for Monitoring
- Configure Laravel Telescope for Debugging
- Integrate Laravel Nightwatch for Production APM

## Success Criteria

- Custom Pulse card displays business-relevant metrics with live updates
- Recorder captures data accurately with acceptable performance
- Card is properly registered and appears in the correct dashboard position
- Team uses custom cards for at-a-glance monitoring of key metrics
