# Skill: Configure Livewire + Laravel Integration

## Purpose
Set up the Laravel server-side integration for Livewire, including asset configuration, middleware setup, component registration, and deployment configuration.

## When To Use
- Setting up Livewire in a new Laravel project
- Configuring Livewire for production deployment
- Debugging Livewire asset loading or middleware issues

## When NOT To Use
- Non-Livewire Laravel applications
- Frontend-only Livewire configuration (components, views)

## Prerequisites
- Laravel application with `livewire/livewire` installed
- Basic understanding of Laravel configuration and middleware
- Access to deployment pipeline configuration

## Inputs
- Application deployment URL and environment
- Asset delivery strategy (CDN, bundled, published)
- Middleware requirements (auth, admin, tenant)
- Layout template selection

## Workflow
1. **Publish configuration.** Run `php artisan livewire:publish --config` to create `config/livewire.php`. Review and customize settings for the application's middleware group, asset URL, and layout.

2. **Configure middleware.** Set the `middleware_group` in `config/livewire.php` to include all middleware groups used by pages rendering Livewire components. Default is `['web']`.

3. **Set up layout.** Create or identify the Blade layout component. For Livewire 2, add `@livewireStyles` in `<head>` and `@livewireScripts` before `</body>`. For Livewire 3, configure bundling or rely on auto-injection.

4. **Publish assets for production.** Run `php artisan livewire:publish --force` to copy Livewire assets to the public directory. Add this step to the deployment pipeline.

5. **Enable bundling (Livewire 3).** Run `php artisan livewire:configure --bundle` to enable bundling. Configure the manifest path in `config/livewire.php` for Vite-based builds.

6. **Create component directories.** Organize components in `app/Livewire/` using feature-based subdirectories. Auto-discovery will register them without manual configuration.

7. **Test the integration.** Verify that Livewire components render with interactivity. Check browser dev tools for asset loading. Test AJAX requests in the Network tab.

8. **Lock configuration in CI.** Add the `config:cache` and `livewire:publish` steps to deployment scripts. Verify configuration changes take effect after cache clearing.

## Validation Checklist
- [ ] `config/livewire.php` published and reviewed
- [ ] `middleware_group` includes all relevant route groups
- [ ] Layout includes `@livewireScripts` and `@livewireStyles` (Livewire 2) or bundling enabled (Livewire 3)
- [ ] Assets published for production
- [ ] Livewire NOT in CSRF exemption list
- [ ] Asset URL configured for subdirectory/CDN deployments
- [ ] Bundle mode configured for Livewire 3 production builds
- [ ] Config cache cleared after configuration changes
- [ ] Component auto-discovery verified
- [ ] Livewire routes not returning 404s in production

## Common Failures
- **404s on livewire assets.** Assets not published for production or asset URL misconfigured.
- **CSRF 419 errors.** Session expired; CSRF token not regenerated on login; or Livewire route exempted incorrectly.
- **Components not interactive.** Missing `@livewireScripts` in layout; Alpine.js not loaded.
- **Config changes not reflecting.** Config cache not cleared after modifying `config/livewire.php`.
- **Auth state missing.** Middleware group doesn't include `auth` middleware where needed.

## Decision Points
- **Publish assets vs bundling?** Publish for simple deployments. Bundle for Vite/Mix builds with asset versioning.
- **Auto-discovery vs manual registration?** Auto-discovery for app components. Manual for vendor packages or components outside app/Livewire.

## Related Rules
- Rule: Publish Assets for Production (05-rules.md)
- Rule: Configure middleware_group Properly (05-rules.md)
- Rule: Include @livewireScripts in Layout (05-rules.md)
- Rule: No CSRF Exemption on Livewire Routes (05-rules.md)

## Related Skills
- Build Livewire Frontend Components
- Deploy Laravel Applications
- Configure Vite for Laravel

## Success Criteria
config/livewire.php is published and configured. The layout includes required Livewire directives. Assets are published or bundled for production. Middleware group is correct. Deployment pipeline includes publish and cache steps. Components render with interactivity in all environments.
