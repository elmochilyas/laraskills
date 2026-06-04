# Skill: Log Model Events and Business Activities with Spatie Activitylog

## Purpose
Implement automatic and manual activity logging using Spatie `laravel-activitylog` to track model CRUD events and business operations with subject, causer, and properties.

## When To Use
- Activity feeds and UI activity streams
- Automatic logging of Eloquent model CRUD operations
- Simple audit trails not requiring immutability or forensics-grade verification
- User action history (login, export, permission changes)

## When NOT To Use
- Compliance-grade audit trails requiring cryptographic verification
- Append-only immutable logs (use dedicated immutable audit packages)
- When HMAC checksums or tamper-evident logs are required

## Prerequisites
- `composer require spatie/laravel-activitylog`
- Published config and migration
- `php artisan migrate`

## Workflow
1. Add `LogsActivity` trait to models requiring audit trails
2. Configure `getActivitylogOptions()` to log only relevant attributes
3. Set `$logOnlyDirty = true` to reduce storage
4. Exclude sensitive fields (passwords, tokens) from logged attributes
5. Use `activity()` facade for manual business event logging
6. Use `performedOn()` and `causedBy()` for subject/causer relationships
7. Use batch UUIDs for grouping related activities
8. Schedule pruning of old activity logs
9. Add log levels or tags in properties for filtering

## Validation Checklist
- [ ] `LogsActivity` trait added to audited models
- [ ] Sensitive fields excluded from `$logAttributes`
- [ ] `$logOnlyDirty = true` for most models
- [ ] Pruning schedule configured (daily/weekly)
- [ ] Manual logging for business events (login, export, permission changes)
- [ ] Causer explicitly set in queue jobs
- [ ] Named logs used for logical partitioning
