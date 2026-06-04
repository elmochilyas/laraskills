# Livewire + Laravel Integration

## Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** LivewireInertia
**Knowledge Unit:** LivewireLaravel
**Difficulty:** Intermediate
**Category:** Server Integration
**Last Updated:** 2026-06-04

## Overview

Livewire + Laravel Integration covers the server-side setup, configuration, asset publishing, routing, layout management, and deployment concerns specific to Livewire applications built with Laravel. While Livewire components are PHP classes with Blade views, the Laravel integration layer handles: bootstrapping Livewire's JavaScript and CSS, registering component namespaces, configuring auto-injection, managing session state, and optimizing production builds.

This integration layer is critical because Livewire must wire itself into Laravel's request lifecycle. It registers its own router, middleware, and session handlers. Misconfiguration leads to components not rendering, 404s on Livewire endpoints, or state corruption across requests.

Engineers should care because proper integration ensures Livewire components work reliably. Understanding the lifecycle — from component registration through rendering to AJAX hydration — helps debug issues and optimize performance.

## Core Concepts

**Component Registration:** Livewire components can be registered manually via `Livewire::component('name', ComponentClass::class)` or discovered automatically by scanning the `app/Livewire/` directory. Livewire 3 enables attribute-based registration using `#[LivewireComponent]`.

**Auto-Injection:** Livewire automatically injects (and removes) its JavaScript and Blade assets. In Livewire 2, the `@livewireStyles` and `@livewireScripts` directives must be manually placed in the layout. Livewire 3's bundling mode eliminates this need.

**Livewire Router:** Livewire registers its own routes under the `/livewire/*` prefix for AJAX requests, file uploads, and asset delivery. These routes are essential for component interactivity.

**Session State Management:** Livewire stores component state (public properties) in the Laravel session between requests. The component is serialized on dehydration (end of request) and unserialized on hydration (next AJAX call).

**Layout Management:** Full-page Livewire components use layouts defined via `#[Layout('layouts.app')]` attribute or `$this->layout()` in the component. The layout is the Blade template that wraps the component output.

**Asset Publishing:** Livewire publishes its frontend assets (JavaScript, CSS) via `php artisan livewire:publish`. For production, these can be versioned or served from a CDN.

**Bundling & Builds:** Livewire 3 supports bundling mode where scripts are compiled into the application's Vite/Mix build, eliminating separate Livewire HTTP requests for JavaScript assets.

**Configuration:** The `config/livewire.php` file controls asset URLs, middleware groups, layout settings, and component namespace configuration.

## When To Use

- Any Laravel application using Livewire components
- Projects that need to customize Livewire's default behavior (asset paths, middleware, layouts)
- Teams deploying Livewire applications to production

## When NOT To Use

- Non-Livewire Laravel applications
- Applications that rely entirely on Inertia or Blade with no Livewire components

## Best Practices

**Register Layout via Attribute:** Use `#[Layout('layouts.app')]` on full-page components instead of setting the layout in `render()`. This keeps layout concerns explicit and reduces render method boilerplate.

**Use Auto-Discovery for Components:** Rely on Livewire's auto-discovery in `app/Livewire/` rather than manual registration. Keep components in the default namespace to avoid registration overhead.

**Configure Middleware Group:** Ensure Livewire's middleware group includes session, CSRF, and authentication middleware. Configure this in `config/livewire.php` under `middleware_group`.

**Publish Assets for Production:** Run `php artisan livewire:publish` in production or when serving assets through Laravel's URL system. For CDN delivery, configure the `asset_url` in `livewire.php`.

**Enable Bundling in Livewire 3:** Use `php artisan livewire:configure --bundle` to compile Livewire scripts into your Vite/Mix build. This reduces HTTP requests and enables asset versioning.

**Set Alpine.js Assets:** Explicitly configure Alpine.js asset delivery in `config/livewire.php`. Livewire 3 uses Alpine.js bundled; Livewire 2 requires separate Alpine.js inclusion.

## Architecture Guidelines

**Component Namespace Organization:** Organize components by feature or module. Use subdirectories in `app/Livewire/` for grouping: `app/Livewire/Posts/Index.php`, `app/Livewire/Posts/Create.php`. Subdirectory components are accessed via dot notation: `livewire.posts.index`.

**Layout Placement:** Store layouts in `resources/views/layouts/`. Keep them minimal with the `@livewireStyles`, `@livewireScripts`, and `{{ $slot }}` directives.

**Testing Configuration:** Disable Livewire's JavaScript auto-injection in tests using `Livewire::forceAssetInjection()` or configure test environment to skip asset checks.

**Multi-Tenant Considerations:** Configure Livewire with a unique `layout` per tenant or use middleware to set properties before component hydration.

## Performance Considerations

- Livewire's asset bundle adds ~30KB (gzipped) to page loads. Enable bundling to merge with application's build
- Component state serialization overhead grows with each public property. Minimize reactive data
- Livewire routes are session-aware. Stateless environments (Laravel Octane) require special configuration
- File uploads use multipart POST to Livewire's upload endpoint. Upload progress polling adds overhead

## Security Considerations

- Livewire endpoints are CSRF-protected by default. Do not disable CSRF checking on `/livewire/*` routes
- Component state is serialized in the session. Never store sensitive data as public properties in production where session serialization could leak
- Livewire's `Secure` configuration (`config/livewire.php`) enforces HTTPS for asset delivery
- File upload validation is server-side. Always validate mime types and file sizes in component rules
- Component authorization checks must run on every render, not just mount

## Common Mistakes

**Missing @livewireScripts/@livewireStyles:** Forgetting to include the directives in the layout.

**Why developers make it:** Livewire 3 auto-inject scripts. Developers migrating from Livewire 2 assume the same behavior.

**Consequences:** Components render as static HTML without interactivity.

**Better approach:** For Livewire 2, always add `@livewireStyles` and `@livewireScripts` to the layout. For Livewire 3, verify bundling or auto-injection is enabled.

**Deploying Without Published Assets:** Running `php artisan livewire:publish` only in development, not production.

**Why developers make it:** Assets work locally. Developers don't realize assets are served differently in production.

**Consequences:** Livewire assets return 404s in production.

**Better approach:** Publish assets as part of the deployment script.

**Not Configuring middleware_group:** Running Livewire on routes with custom middleware and not updating the configuration.

**Why developers make it:** Livewire works with default middleware. Custom middleware groups (API, admin) aren't tested.

**Consequences:** Components on custom route groups fail with CSRF or auth errors.

**Better approach:** Set `middleware_group` in `config/livewire.php` to include all middleware groups that render Livewire components.

**Session State Leakage:** Public properties persisting unexpected values across requests.

**Why developers make it:** Developers don't realize Livewire serializes all public properties between requests.

**Consequences:** Stale or leaked data appears in component renders.

**Better approach:** Reset properties explicitly in lifecycle hooks. Use `$this->reset()` after actions.

**Forgetting to Clear Session Cache:** Cached config not reflecting Livewire configuration changes after deployment.

**Why developers make it:** Standard Laravel deployment practice includes config caching, which can miss Livewire.

**Consequences:** Configuration changes don't take effect until cache is cleared.

**Better approach:** Run `php artisan config:cache` after Livewire config changes. Include `livewire.php` in config cache whitelist.

## Anti-Patterns

**Manual Component Registration:** Registering every component via `Livewire::component()` when auto-discovery works. Manual registration is only needed for components outside the default namespace.

**Bypassing Livewire Security:** Disabling CSRF on `livewire/*` routes to fix "419 expired" errors. Address session lifetime and CSRF token regeneration instead.

**Heavy Layout Files:** Complex layouts with dozens of includes, partials, and nested sections. Livewire components re-render inside the layout — keep layouts lean.

**Global Livewire Configuration in Providers:** Setting layout, middleware, or component paths in multiple service providers. Centralize all Livewire configuration in `config/livewire.php`.

**Mixing Livewire 2 and Livewire 3:** Running both versions in the same project. The APIs are incompatible.

## Examples

### Layout Configuration (Livewire 3)
```blade
{{-- resources/views/layouts/app.blade.php --}}
<!DOCTYPE html>
<html>
<head>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
    <nav>{{ $header ?? '' }}</nav>
    <main>{{ $slot }}</main>
    @livewireScripts
</body>
</html>
```

### Full-Page Component with Layout Attribute
```php
#[Layout('layouts.app')]
#[Title('Create Post')]
class CreatePost extends Component
{
    public function render(): View
    {
        return view('livewire.posts.create');
    }
}
```

### config/livewire.php Configuration
```php
return [
    'middleware_group' => ['web', 'auth'],
    'layout' => 'layouts.app',
    'asset_url' => env('ASSET_URL', null),
    'inject_assets' => env('LIVEWIRE_INJECT_ASSETS', true),
    'bundle' => [
        'enabled' => env('LIVEWIRE_BUNDLE', false),
        'manifest' => public_path('build/manifest.json'),
    ],
    'uses_alpine' => true,
];
```

## Related Topics

**Prerequisites:**
- Livewire Frontend Architecture
- Laravel Blade Layouts
- Laravel Session Management

**Closely Related:**
- Livewire Component Registration
- Livewire Asset Publishing
- Livewire Session State Management

**Advanced Follow-Up:**
- Livewire with Laravel Octane
- Livewire Deployment Best Practices
- Livewire Multi-Tenant Configuration
- Custom Livewire Component Directories

**Cross-Domain Connections:**
- Laravel Configuration and Deployment
- Laravel CSRF Protection
- Laravel Vite Asset Bundling
