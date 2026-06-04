# Knowledge Unit: Pulse Cards Custom Development

## Metadata
- **Subdomain:** Developer Tooling & Debugging
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** developer-tooling-debugging/pulse-cards-custom-development
- **Maturity:** Maturing
- **Related Technologies:** Laravel Pulse, Livewire, PHP, Alpine.js, Tailwind CSS

## Executive Summary

Pulse custom cards extend Laravel Pulse's dashboard with application-specific metrics and visualizations. A custom card is a Livewire component that implements the `Pulse\Card` contract, registers data recorders to capture metrics, and renders a dashboard card displaying the data. Pulse cards are built with: Livewire (server-side logic), Alpine.js (client-side interactivity), and Tailwind CSS (styling consistent with Pulse's design system). Custom cards can monitor business metrics (user registrations/hour, order throughput), application-specific performance (API endpoint latency, custom service response times), or integrate with third-party services (deployment status, external API health). Pulse provides a `Pulse::record()` method for recording metric entries and `Pulse::values()` for retrieving aggregated data in card rendering.

## Core Concepts

- **Pulse Card Component:** A Livewire component extending `Pulse\Card` with `render()` method returning a view displayed in the Pulse dashboard
- **Recorder:** A class extending `Pulse\Recorder` that captures metric data by listening to events or calling `Pulse::record()` at specific points in the request lifecycle
- **Pulse::record():** Static method to record a metric entry: `Pulse::record('user_registrations', $userId, 1)->count()` records an incremented metric
- **Pulse::values():** Static method to retrieve aggregated values for a metric: `Pulse::values('user_registrations', ['count'])` returns current period totals
- **Card Registration:** Custom cards are registered in `config/pulse.php` under the `cards` array, specifying the card class and display order
- **Dashboard Width:** Cards specify width classes: `cols-1` (full width), `cols-2` (half width), `cols-3` (third width) for dashboard layout

## Mental Models

- **Custom Card as Business Dashboard Widget:** Like a specialized gauge on a car dashboard—each custom card shows one specific business metric at a glance
- **Recorder as Data Pipeline:** The recorder captures raw metric events; Pulse aggregates them; the card queries aggregated data for display—a three-stage data pipeline
- **Card as Livewire Component:** A Pulse card is essentially a Livewire component with Pulse-specific helpers for recording and retrieving metric data

## Internal Mechanics

1. **Metric Recording:** In application code (controllers, jobs, services), call `Pulse::record('metric_name', $key, $value)` to record a metric event
2. **Data Storage:** Pulse stores recorded entries in the `pulse_entries` table with: timestamp, type, key, value, and metadata
3. **Aggregation:** The `pulse:check` scheduled command aggregates raw entries into per-minute/hour/daily buckets for efficient querying
4. **Card Rendering:** The card's `render()` method calls `Pulse::values('metric_name', ['count', 'avg', 'max'])` to retrieve aggregated data for the current period
5. **Livewire Updates:** The card component uses Livewire polling (configurable interval) to refresh data in real-time without page reload
6. **Dashboard Layout:** Cards are arranged in the Pulse dashboard grid based on their `cols` property and the user's dashboard configuration

## Patterns

- **Business Metric Card Pattern:** Create a card tracking business KPIs: `UserRegistrationsCard` showing registrations per hour, `OrderVolumeCard` showing order throughput
- **Performance Metric Card Pattern:** Track application performance beyond Pulse's built-in cards: `ApiEndpointLatencyCard`, `ExternalServiceResponseCard`
- **Custom Recorder Pattern:** Create a recorder class that listens to application events and records metrics: `class OrderRecorder extends Recorder { public function record($event) { Pulse::record('orders', $event->order->id, 1)->count(); } }`
- **Aggregated Stat Card Pattern:** Display aggregate statistics: total users, total orders today, average order value, with mini-chart sparklines for trends
- **Status/Health Card Pattern:** Display the status of external services (deployment pipeline, third-party API health, worker pool status) as a dashboard card
- **Time-Series Chart Card Pattern:** Render a chart showing metric trends over time (last hour, last 24 hours) using Pulse's chart helpers
- **Card with Navigation Pattern:** Make cards clickable to navigate to detailed views in the application (e.g., click "5 failed orders" to go to the failed orders list)

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Recording source | Application events vs facade calls vs middleware | Events for loose coupling; facade calls for control; middleware for request-scoped metrics |
| Aggregation type | Count vs sum vs avg vs max vs custom | Count for event frequency; sum for volume; avg for latency; custom for complex metrics |
| Card refresh strategy | Livewire polling vs SSE vs manual refresh | Livewire polling (default, automatic); SSE for real-time needs |
| Card width | Full (cols-1) vs half (cols-2) vs third (cols-3) | Full for primary metrics; half for supporting metrics; third for tertiary data |
| Data retention recency | Last hour vs last 24 hours vs last 7 days | Last hour for real-time; last 24 hours for daily trends |

## Tradeoffs

- **Built-in Cards vs Custom Cards:** Built-in cards require no development but cover only generic metrics. Custom cards cover business-specific needs but require development and maintenance. Start with built-in cards; add custom cards for critical business metrics.
- **Recording vs Aggregation:** Call `Pulse::record()` for every event (precise but higher volume) vs call it periodically with aggregated values (less precise but lower storage). Use per-event recording for accuracy; periodic aggregation for high-frequency metrics.
- **Card Complexity:** Simple cards (single stat, no chart) are fast to develop and render. Complex cards (multi-series charts, drill-down) are more informative but require more development effort.

## Performance Considerations

- **Record Call Overhead:** Each `Pulse::record()` call adds <0.5ms. For high-frequency metrics (100+ calls/second), this can add measurable overhead. Batch recordings where possible.
- **Card Render Performance:** Each card's `render()` method should query aggregated data (not raw entries). Aggregated queries on binned data are fast (<5ms per query).
- **Dashboard Render Time:** The Pulse dashboard renders all active cards. With 10+ cards, render time may exceed 1 second. Optimize slow cards: cache data, limit query scope, use simpler queries.
- **Storage Growth:** Custom metrics add to Pulse's entry count. Monitor storage growth; configure appropriate retention for custom metrics.

## Production Considerations

- **Card Authorization:** Custom cards may expose sensitive business metrics. Use Pulse's authorization gate to restrict card access to appropriate team members.
- **Metric Sensitivity:** Business metrics (registrations, orders, revenue) may be sensitive. Consider who sees the Pulse dashboard and what metrics are displayed.
- **Recording Frequency:** High-frequency metrics (1000+ records/second) can overwhelm Pulse's storage. Use batch recording or periodic sampling for high-volume metrics.
- **Card Dependencies:** Cards should handle missing data gracefully (no recorded metrics yet, data source unavailable). Display "No data" or fallback values.

## Common Mistakes

- **Recording too granularly:** Recording every event individually for very high-frequency metrics (user mouse clicks, asset views); overwhelms storage. Use batch or periodic recording.
- **Not aggregating in the recorder:** Recording raw values without aggregation and filtering; the card has to aggregate large datasets on every render, slowing the dashboard.
- **Over-complicated cards:** Building cards with multiple charts, interactive filters, and deep drill-downs; Pulse cards should be simple "at-a-glance" views. Move complex analysis to dedicated dashboards.
- **Ignoring Pulse's existing data:** Tracking metrics that Pulse already provides (request count, slow queries, exceptions) instead of building on Pulse's built-in data.
- **Not handling empty states:** Cards that crash or display errors when no metrics have been recorded yet; always handle the "no data yet" state gracefully.

## Failure Modes

- **Recorder Blocking Application:** The recorder takes too long to record metrics, slowing down the application. Mitigate: use async recording; optimize recorder code.
- **Card Query Timeout:** The card's data query exceeds database timeout on large datasets. Mitigate: use aggregated data only; set query timeouts.
- **Metric Key Collision:** Two custom cards use the same metric name, overwriting each other's data. Mitigate: use unique metric name prefixes for each card.
- **Card Rendering Error:** An unhandled exception in a card's `render()` method breaks the entire Pulse dashboard. Mitigate: wrap card rendering in try-catch; display error state per card.

## Ecosystem Usage

- **Laravel Teams:** Teams build custom Pulse cards for business-specific metrics: SaaS metrics (MRR, churn rate, active users), e-commerce metrics (order volume, conversion rate, cart abandonment)
- **Laravel Package Developers:** Package developers provide Pulse cards as part of their packages, giving consumers in-dashboard visibility into package performance
- **Laravel Cloud:** Laravel Cloud supports custom Pulse cards for application-specific monitoring alongside built-in platform metrics
- **Open Source Projects:** Popular Laravel packages (Spatie, Nova, etc.) may provide Pulse cards for monitoring their operations

## Related Knowledge Units

- laravel-pulse
- laravel-telescope
- debugbar-collectors-profiling
- laravel-nightwatch

## Research Notes

- Pulse custom cards use Livewire 3+ with full-page component support and wire:navigate for seamless dashboard navigation
- The `Pulse::record()` method accepts a type string, key, and value; the key enables grouping (e.g., per-route, per-user, per-service)
- Pulse's aggregation system automatically creates per-minute, per-hour, and per-day buckets from raw entries, enabling efficient historical queries
- The Pulse card grid system is CSS Grid-based with responsive breakpoints; cards automatically reflow on smaller screens
