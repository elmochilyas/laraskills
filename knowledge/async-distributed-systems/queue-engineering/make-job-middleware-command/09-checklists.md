# `make:job-middleware` Artisan Command — Checklist

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Middleware
- **Knowledge Unit:** K090 — `make:job-middleware` Artisan Command
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Laravel 11+ installed
- [ ] Familiar with job middleware concepts
- [ ] Know where middleware files should reside (`app/Queue/Middleware/`)

## Implementation Checklist
- [ ] Run `php artisan make:job-middleware {MiddlewareName}` to generate stub
- [ ] Verify file created in `app/Queue/Middleware/{MiddlewareName}.php`
- [ ] Confirm namespace is `App\Queue\Middleware\{MiddlewareName}`
- [ ] Implement `handle($job, $next)` method with custom logic
- [ ] Return instance from job's `middleware()` method

## Verification Checklist
- [ ] Generated class has correct namespace and structure
- [ ] `handle()` method signature matches interface contract
- [ ] Middleware functions correctly when applied to a job
- [ ] Tests confirm middleware behavior

## Security Checklist
- [ ] No sensitive logic in generated stub that could be overlooked
- [ ] Middleware follows secure coding practices

## Performance Checklist
- [ ] Stub is minimal — no unnecessary overhead in generated code
- [ ] Command creates file quickly with no external dependencies

## Production Readiness Checklist
- [ ] All team members use the command for consistency
- [ ] Middleware classes discoverable in standard location
- [ ] Naming conventions match project standards

## Common Mistakes to Avoid
- [ ] Creating middleware manually (risk of interface mismatches, wrong namespaces)
- [ ] Placing middleware outside `app/Queue/Middleware/` directory
- [ ] Not using the command for team consistency
