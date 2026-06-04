# Skill: Configure Telescope Watchers

## Purpose
Enable, disable, and configure Telescope's 18 built-in watchers for development debugging or selective production observation, and create custom watchers for app-specific data capture.

## When To Use
- Development: enable all watchers for comprehensive debugging
- Production: enable only Exception, SlowQuery, FailedJob for targeted observation
- Custom debugging: create custom watchers for app-specific data capture

## When NOT To Use
- Production without selective enabling (full capture = performance hit, storage growth)
- Real-time monitoring needs (Pulse is better for aggregate live data)

## Prerequisites
- Laravel Telescope installed and configured
- Access to `config/telescope.php`

## Inputs
- `config/telescope.php` — per-watcher configuration
- Application code for custom watcher registrations
- `Telescope::filter()` callback entries

## Workflow

1. **Review Available Watchers:** In `config/telescope.php`, review the 18 built-in watchers: Request, Query, Job, Event, Cache, Exception, Mail, Notification, Log, Dump, Gate, Redis, Schedule, Command, HttpClient, View, Model, Session.

2. **Configure Development Environment:** Enable all watchers by setting each to `true` under the `watchers` array. This provides comprehensive debugging data during development.

3. **Configure Production Environment:** Enable only ExceptionWatcher, SlowQueryWatcher (`slow` threshold: 100ms), and FailedJobWatcher. Disable all other watchers to limit performance impact and storage growth.

4. **Set Watcher Thresholds:** Configure per-watcher options: `RequestWatcher` `size_limit` (e.g., 64KB), `QueryWatcher` `slow` threshold (e.g., 100ms), to filter out noise.

5. **Filter Sensitive Data:** Use `Telescope::filter()` in `AppServiceProvider::boot()` to exclude health check endpoints, sensitive routes, or noisy entries.

6. **Tag Entries:** Use `Telescope::tag()` to add automatic tags for organized dashboard filtering: `Telescope::tag(['auth:user-'.$userId, 'payment:failed'])`.

7. **Create Custom Watchers (When Needed):** Extend `Telescope\Watchers\Watcher` to capture app-specific data. Implement `register()` to listen to events and create `EntryResult` via `Telescope::record()`.

## Validation Checklist

- [ ] All watchers enabled and capturing data in development
- [ ] Only Exception, SlowQuery, FailedJob enabled in production
- [ ] Watcher thresholds configured to filter noise
- [ ] Health check endpoints filtered via `Telescope::filter()`
- [ ] Tags visible in Telescope dashboard filtering
- [ ] Custom watchers (if created) capture correct data

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Too many watchers in production | Performance degradation; rapid storage growth |
| Sensitive data captured | Filter not configured for passwords/tokens |
| Health check noise | Dashboard cluttered with irrelevant entries |
| Custom watcher not firing | Event not dispatched or watcher not registered |

## Decision Points

- **Full capture in development:** All watchers enabled for complete debugging insight
- **Minimal capture in production:** Only Exception, SlowQuery, FailedJob to balance insight vs overhead
- **Custom watcher creation:** Only when built-in watchers don't cover the debugging need

## Performance/Security Considerations

- **Production watchers:** Limit to 3 critical watchers; each additional watcher adds overhead and storage
- **Filter sensitive data:** Use `Telescope::filter()` to exclude passwords, tokens, and PII from captured entries
- **Storage growth:** Each request can create 5-15 entries; prune regularly; use short retention in production

## Related Rules

- TELWATCH-RULE-001: Enable all watchers in development
- TELWATCH-RULE-002: Selective watchers in production
- TELWATCH-RULE-003: Configure watcher thresholds
- TELWATCH-RULE-004: Filter sensitive data
- TELWATCH-RULE-005: Custom watchers extend Watcher

## Related Skills

- Configure Laravel Telescope for Debugging
- Configure Debugbar Collectors for Selective Profiling
- Install and Configure Laravel Debugbar

## Success Criteria

- Development environment captures all debugging data across 18 watchers
- Production environment captures only exceptions, slow queries, and failed jobs
- Custom watchers provide app-specific debugging data when needed
- Sensitive data is filtered from captured entries
