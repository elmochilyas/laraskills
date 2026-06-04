# Skill: Evaluate and Select a Multi-Tenancy Package

## Purpose

Choose between stancl/tenancy and spatie/laravel-multitenancy based on isolation requirements, feature needs, and team expertise.

## When To Use

- Starting a new multi-tenant Laravel project
- Evaluating whether to use a package or build custom multi-tenancy
- Migrating from one package to another

## When NOT To Use

- Custom multi-tenancy already built and tested
- Very simple multi-tenancy (single shared-table, few models)
- Requirements that don't match any package's design

## Prerequisites

- Understanding of multi-tenancy isolation models
- Laravel application setup
- Project requirements document

## Inputs

- Isolation model requirements (shared-table, schema, DB-per-tenant)
- Feature requirements (queue, cache, filesystem, middleware)
- Team expertise

## Workflow (numbered steps)

1. Evaluate stancl/tenancy:
   - Supports all isolation models (shared, schema, DB-per-tenant)
   - Built-in tenant resolution (subdomain, domain, header, UUID)
   - Queue, cache, filesystem, Redis tenant awareness
   - Mature package with 6K+ GitHub stars
   - Higher learning curve
2. Evaluate spatie/laravel-multitenancy:
   - Shared-table model with global scopes
   - Tenant via authenticated user
   - Minimal configuration
   - Lightweight, opinionated
3. Compare against requirements:
   - Need schema or DB-per-tenant? → stancl
   - Simple shared-table? → spatie
   - Need queue tenant awareness? → stancl
   - Minimal setup? → spatie
4. Install chosen package and configure per documentation
5. Test tenant isolation with package features

## Validation Checklist

- [ ] Package supports required isolation model
- [ ] All required features (queue, cache, filesystem) work correctly
- [ ] Tenant resolution works as expected
- [ ] Package performance meets requirements

## Common Failures

- Choosing package that doesn't support required isolation model
- Package conflicts with existing custom multi-tenancy code
- Over-relying on package for all isolation (package has bugs too)

## Decision Points

- Package vs custom multi-tenancy implementation
- stancl/tenancy vs spatie/laravel-multitenancy
- Using package for some features and custom for others

## Performance Considerations

- Package overhead: 1-5ms per request for tenant resolution
- stancl/tenancy is more feature-rich but heavier
- spatie/laravel-multitenancy is minimal overhead

## Security Considerations

- Review package's security posture and vulnerability history
- Package must not introduce cross-tenant data leak vectors
- Regular package updates for security patches

## Related Rules

- Skip (no direct rules file reference)

## Related Skills

- Implement Shared-Table Multi-Tenancy
- Implement Tenant Bootstrapper Pattern
- Implement Eloquent Global Scopes

## Success Criteria

- Package correctly implements required isolation model
- All required features working in production
- Team can maintain and extend package behavior

---

# Skill: Configure stancl/tenancy Package

## Purpose

Install, configure, and customize the stancl/tenancy package for a multi-tenant Laravel application.

## When To Use

- Using stancl/tenancy for multi-tenancy implementation
- Need to configure tenant resolution, connection switching, and features
- Customizing package behavior for specific requirements

## When NOT To Use

- Using spatie/laravel-multitenancy or custom implementation
- Package version incompatible with Laravel version

## Prerequisites

- Laravel application
- stancl/tenancy package installed
- Database configuration for central and tenant connections

## Inputs

- Package configuration (config/tenancy.php)
- Tenant model customization
- Feature enable/disable settings

## Workflow (numbered steps)

1. Install: `composer require stancl/tenancy`
2. Run install command: `php artisan tenancy:install`
3. Configure central connection and tenant connection in config
4. Choose tenant identification (subdomain, domain, path, header, UUID)
5. Configure tenant features:
   - Database: shared, schema, or DB-per-tenant
   - Cache: tenant-scoped cache prefix
   - Filesystem: tenant-scoped storage paths
   - Queue: tenant-aware queue jobs
   - Redis: tenant-scoped Redis prefixes
6. Customize Tenant model with plan, settings, and feature flags
7. Implement event listeners for tenant lifecycle (created, deleted, updated)
8. Test tenant creation, data isolation, and feature behavior

## Validation Checklist

- [ ] Package installed and configured
- [ ] Tenant resolution working (subdomain/domain/header)
- [ ] Database isolation correct per configuration
- [ ] Cache, filesystem, queue isolation working
- [ ] Tenant lifecycle events firing correctly

## Common Failures

- Central and tenant connections point to same database (no isolation)
- Tenant identification conflicts between routes
- Cache prefix not applied to all cache drivers
- Queue job tenant context not serialized

## Decision Points

- Identification strategy (subdomain vs domain vs UUID)
- Database isolation model (shared vs schema vs DB)
- Which features to enable vs disable

## Performance Considerations

- Package adds 5-15ms per request for tenant initialization
- DB-per-tenant: connection switching adds overhead
- Queue tenant awareness: serialization overhead per job

## Security Considerations

- Review package security advisories regularly
- Keep package updated for security patches
- Test isolation after each package update

## Related Rules

- Skip (no direct rules file reference)

## Related Skills

- Evaluate Multi-Tenancy Packages
- Implement Tenant Bootstrapper Pattern
- Implement Tenant-Aware Middleware

## Success Criteria

- Package fully configured and working in production
- All isolation models working as expected
- Team understands package configuration and customization
