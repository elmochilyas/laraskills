# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 08-dashboards-reporting
**Knowledge Unit:** dashboard-widget-provider
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Widget Provider class pattern understood — dedicated class per widget encapsulates query + cache + format
- [ ] Provider class created for each dashboard widget (metric, chart, table)
- [ ] Caching layer configured appropriate for widget data freshness requirements
- [ ] Filter propagation designed — date range, tenant, dimension filters passed through to query
- [ ] Data transformation (aggregation, formatting, sorting) inside provider
- [ ] Eloquent aggregate methods (K007) used for efficient query inside providers

---

# Architecture Checklist

- [ ] WidgetProvider class extends base provider with data(), cacheKey(), cacheTtl() methods
- [ ] Providers query read models (K008 CQRS) or star-schema tables (K006)
- [ ] Caching layer invalidated when underlying data changes (event-based or TTL)
- [ ] Filter propagation through provider — filters affect query WHERE clauses
- [ ] Provider returns formatted data ready for widget rendering (no view-layer computation)
- [ ] Reverb WebSocket (K010) pushes real-time updates for live widgets

---

# Implementation Checklist

- [ ] Provider class: DailySalesWidgetProvider with data() returning {labels, values, totals}
- [ ] Cache::remember(provider->cacheKey(), provider->cacheTtl(), fn => provider->data())
- [ ] Query inside provider uses Model::query()->select(...)->groupBy(...)->get()
- [ ] Filter method: provider->setFilters(['date_from', 'date_to', 'tenant_id'])
- [ ] Data formatted: values cast to correct types, labels localized
- [ ] Provider registered in service container or widget registry

---

# Performance Checklist

- [ ] Widget query execution time < 200ms at p99 with cached data < 50ms
- [ ] Cache TTL tuned per widget — real-time widgets 30s, hourly reports 3600s
- [ ] Provider query uses database indexes — EXPLAIN verified
- [ ] Query returns only needed columns (SELECT specific fields, not *)
- [ ] Cache key includes all filter values to prevent stale cross-filter results
- [ ] Widget rendered server-side only when cache hit — no redundant DB queries

---

# Security Checklist

- [ ] Provider filters scoped to authenticated user's permissions (tenant_id, role)
- [ ] Provider query results contain only data user is authorized to see
- [ ] Cache invalidated when user permissions change (prevent stale authorized data)
- [ ] Provider does not expose raw query parameters to unauthorized users
- [ ] Widget data caching respects tenant isolation — tenant A does not see tenant B cache

---

# Reliability Checklist

- [ ] Provider query failure — returns cached data (stale is better than empty)
- [ ] Cache store failure — provider falls back to DB query
- [ ] Provider timeout configured — slow queries do not block widget rendering
- [ ] Filter validation — invalid filter values return empty result, not error
- [ ] Provider data format consistent — field names never change without version bump

---

# Testing Checklist

- [ ] Test provider returns correct data structure matching widget schema
- [ ] Test cache hit returns data without querying DB
- [ ] Test filter propagation — changing filter changes provider data
- [ ] Test provider fallback — cache miss returns DB data correctly
- [ ] Test permission scoping — user A sees their data, not user B
- [ ] Test provider timeout — slow query returns gracefully

---

# Maintainability Checklist

- [ ] Provider classes in App\Widgets\Providers\ directory
- [ ] Provider naming: {Domain}{Widget}Provider (e.g., SalesDailyWidgetProvider)
- [ ] Cache key generation in base provider, not in each subclass
- [ ] Provider method contracts documented (return types, filter format)
- [ ] Widget data schema documented for front-end team

---

# Anti-Pattern Prevention Checklist

- [ ] Do not put widget query logic in Blade components — use Provider
- [ ] Do not cache entire widget render output — cache data only, render fresh
- [ ] Do not skip TTL for real-time widgets — Reverb (K010) is more appropriate
- [ ] Do not use global helper for widget data — dependency-inject provider
- [ ] Do not query directly from widget view — all logic in Provider

---

# Production Readiness Checklist

- [ ] Prometheus metrics for provider query latency per widget, cache hit ratio
- [ ] Logged warning when provider query latency exceeds 500ms
- [ ] Alert if cache hit ratio drops below 80% for any widget
- [ ] Widget performance dashboard for all production widgets
- [ ] Deploy checklist includes provider registration and cache pre-warm for new widgets
- [ ] Staging widget data verified matches expected values before production rollout

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: provider per widget, cache layer, filter propagation, read model query
- [ ] Security requirements satisfied: permission-scoped filters, tenant-isolated cache, authorized results
- [ ] Performance requirements satisfied: <200ms query, tuned TTL, indexed queries, selective columns
- [ ] Testing requirements satisfied: data structure, cache hit, filter correctness, fallback, permission scoping
- [ ] Anti-pattern checks passed: no query in view, data-only cache, Reverb for real-time, DI provider
- [ ] Production readiness verified: latency metrics, cache ratios, widget dashboard, pre-warm, staging

---

# Related References

- K023 (Grafana/Metabase): Alternative to in-app dashboards using external BI tools
- K008 (CQRS Read Model): Providers often query read models/projections for widget data
- K010 (Reverb WebSocket): Real-time widget updates via WebSocket broadcasting
- K007 (Eloquent Aggregates): Core query patterns used inside providers
