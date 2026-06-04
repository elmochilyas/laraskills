# Skill: Configure Inertia + Laravel Server Integration

## Purpose
Set up the Laravel server-side configuration for Inertia.js, including middleware, shared data, validation handling, and asset versioning.

## When To Use
- Setting up a new Inertia project with Laravel
- Configuring global shared data for an existing Inertia application
- Debugging Inertia request handling issues

## When NOT To Use
- Non-Inertia Laravel applications
- Frontend-only Inertia configuration without Laravel

## Prerequisites
- Laravel application with `inertiajs/inertia-laravel` installed
- Frontend framework configured (Vue/React/Svelte with `@inertiajs/*`)
- Basic understanding of Laravel middleware

## Inputs
- Shared data requirements (auth, flash, config)
- Asset versioning strategy
- Validation error handling requirements

## Workflow
1. **Publish and register middleware.** Run `php artisan inertia:middleware` to create `HandleInertiaRequests`. Register it in `bootstrap/app.php` in the web middleware group.

2. **Configure shared data.** Override the `share()` method in `HandleInertiaRequests`. Add authenticated user data (transformed), flash messages, and global config. Use closures for request-scoped evaluation.

3. **Configure asset versioning.** Override the `version()` method in `HandleInertiaRequests`. Return `md5_file()` of the build manifest, or use a deployment-based version string. This ensures clients get fresh assets after deployments.

4. **Set up Form Request validation.** Create Form Requests for all state-changing endpoints. The validation errors are automatically forwarded to Inertia by the integration.

5. **Test Inertia responses.** Use `$response->assertInertia()` to verify the rendered page component and props. Test validation error forwarding with invalid input.

6. **Configure root view.** Ensure `resources/views/app.blade.php` includes the `@inertia` directive and renders the Inertia root element.

## Validation Checklist
- [ ] `HandleInertiaRequests` middleware registered in web group
- [ ] Shared data includes auth user, flash messages, app config
- [ ] Asset versioning configured
- [ ] Form Requests used for all state-changing endpoints
- [ ] Root view includes `@inertia` directive
- [ ] Tests use `assertInertia()` for response verification
- [ ] No `redirect()->back()` in controllers
- [ ] Eloquent models transformed before passing as props
- [ ] No manual auth token handling in frontend code

## Common Failures
- **Unregistered middleware.** Inertia requests fail silently with 500 errors.
- **Missing versioning.** Users see stale frontend after deployment.
- **Unshared flash.** Flash messages not visible in Inertia.
- **Full model props.** Large payloads from untransformed Eloquent models.
- **Client-only validation.** Server accepts invalid data.

## Decision Points
- **Middleware share() vs AppServiceProvider share()?** Use middleware for per-request shared data. Use service provider for static shared data.
- **MD5 file hash vs version string?** MD5 of manifest for simplicity. Version string for cache-busting control.

## Related Rules
- Rule: Register HandleInertiaRequests Middleware (05-rules.md)
- Rule: Redirect to Named Routes (05-rules.md)
- Rule: Transform Models Before Passing as Props (05-rules.md)
- Rule: Use FormRequest for Validation (05-rules.md)

## Related Skills
- Build Inertia-Driven Pages with Laravel
- Handle Form Validation with Inertia
- Test Inertia Applications

## Success Criteria
HandleInertiaRequests middleware is registered, shared data is configured with auth and flash, asset versioning is set up, and Form Requests handle validation. Tests verify Inertia responses and validation error forwarding.
