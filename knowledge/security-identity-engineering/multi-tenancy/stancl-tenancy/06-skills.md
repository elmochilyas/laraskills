# Skill: Configure stancl/tenancy for Multi-Tenant Application Architecture

## Purpose
Set up the `stancl/tenancy` package for multi-tenant Laravel applications with automatic tenant identification via domain/subdomain, bootstrapper configuration, and tenant-scoped services.

## When To Use
- Multi-tenant SaaS applications needing reliable tenant isolation
- Projects wanting both shared-database and database-per-tenant support
- Applications requiring domain/subdomain-based tenant resolution
- Enterprise applications needing tenant-scoped cache, storage, and queue isolation

## When NOT To Use
- Simple single-tenant applications
- When a lightweight alternative suffices (spatie/laravel-multitenancy)

## Prerequisites
- `composer require stancl/tenancy`
- `php artisan tenancy:install`
- Domain structure for tenant identification

## Workflow
1. Install `stancl/tenancy` and publish config/migrations
2. Configure tenant resolution middleware (`InitializeTenancyByDomain` or `InitializeTenancyBySubdomain`)
3. Register tenant middleware in HTTP kernel
4. Configure bootstrappers in `config/tenancy.php` — enable only needed ones
5. Use UUIDs for tenant IDs (prevent ID guessing and sequential enumeration)
6. Use the Tenant model's lifecycle events for provisioning (database creation, seeding)
7. Enable cache prefixing, filesystem isolation, and queue tagging
8. Use `tenant:run` and `tenants:migrate` for tenant-scoped Artisan commands
9. Test tenant isolation in CI using Stancl's `InitTenancy` trait

## Validation Checklist
- [ ] Tenant resolution middleware registered (by domain/subdomain)
- [ ] Bootstrappers configured appropriately (not all by default)
- [ ] Queue tenant context serialization verified
- [ ] Cache isolation configured (prefix or tags)
- [ ] UUIDs used for tenant IDs
- [ ] `tenants:migrate` configured for tenant database migrations
- [ ] Cross-tenant CI tests exist using `InitTenancy` trait
