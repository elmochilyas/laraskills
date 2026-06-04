# Rules: Livewire + Laravel Integration

## Rule 1 — Publish Assets for Production

**Rule Name:** publish-livewire-assets
**Category:** Always
**Rule:** Run `php artisan livewire:publish` as part of the deployment process.
**Reason:** Without published assets, Livewire's JavaScript and CSS return 404s in production.
**Bad Example:**
```yaml
# deploy.yml — missing publish step
steps:
  - run: php artisan migrate
  # livewire:publish not called
```
**Good Example:**
```yaml
steps:
  - run: php artisan migrate
  - run: php artisan livewire:publish --force
```
**Exceptions:** Livewire bundle mode enabled (scripts compiled into Vite/Mix build).

## Rule 2 — Configure middleware_group Properly

**Rule Name:** configure-livewire-middleware
**Category:** Always
**Rule:** Set `middleware_group` in `config/livewire.php` to cover all route groups using Livewire.
**Reason:** Livewire AJAX requests must run through the correct middleware stack.
**Bad Example:**
```php
'middleware_group' => ['web'],
// But admin routes use ['web', 'auth', 'admin']
```
**Good Example:**
```php
'middleware_group' => ['web'],
```
**Exceptions:** If custom route groups use unique middleware, include them in the array.

## Rule 3 — Use Auto-Discovery Over Manual Registration

**Rule Name:** auto-discovery-components
**Category:** Prefer
**Rule:** Place components in `app/Livewire/` and rely on auto-discovery over manual `Livewire::component()` calls.
**Reason:** Auto-discovery reduces boilerplate and keeps registration implicit.
**Bad Example:**
```php
Livewire::component('posts.create', \App\Livewire\Posts\Create::class);
Livewire::component('posts.index', \App\Livewire\Posts\Index::class);
Livewire::component('posts.edit', \App\Livewire\Posts\Edit::class);
```
**Good Example:**
```php
// No manual registration — auto-discovery finds app/Livewire/Posts/Create.php
// Accessed in Blade as <livewire:posts.create />
```
**Exceptions:** Components outside the `app/Livewire/` namespace (packaged components, vendor imports).

## Rule 4 — Include @livewireScripts in Layout

**Rule Name:** include-livewire-scripts
**Category:** Always (Livewire 2) / Prefer (Livewire 3)
**Rule:** Add `@livewireScripts` to the layout `</body>` tag.
**Reason:** Without it, Livewire components render as static HTML with no interactivity.
**Bad Example:**
```blade
</body>
```
**Good Example:**
```blade
@livewireScripts
</body>
```
**Exceptions:** Livewire 3 bundling mode where scripts are compiled into the application's JavaScript build.

## Rule 5 — Configure Asset URL for CDN or Subdirectory Deployments

**Rule Name:** set-asset-url
**Category:** Prefer
**Rule:** Set `asset_url` in `config/livewire.php` when deploying to a subdirectory or CDN.
**Reason:** Livewire generates asset URLs using the default asset() helper, which may not resolve correctly.
**Bad Example:**
```php
// App deployed at https://example.com/app/
// Livewire assets requested from /livewire/ instead of /app/livewire/
```
**Good Example:**
```php
'asset_url' => env('ASSET_URL', null),
// .env: ASSET_URL=https://cdn.example.com
```
**Exceptions:** Standard root-domain deployments with no custom asset URL.

## Rule 6 — Enable Bundling in Livewire 3 for Production

**Rule Name:** enable-livewire-bundling
**Category:** Prefer
**Rule:** Run `php artisan livewire:configure --bundle` and configure it for production builds.
**Reason:** Bundling merges Livewire scripts into the application's build, reducing HTTP requests.
**Bad Example:**
```php
// No bundling — Livewire loads separate JS
```
**Good Example:**
```bash
php artisan livewire:configure --bundle
```
**Exceptions:** Legacy applications that cannot update to bundling; applications that need to update Livewire JS independently of application builds.

## Rule 7 — Never Disable CSRF on Livewire Routes

**Rule Name:** no-csrf-exemption-livewire
**Category:** Always
**Rule:** Do not add `/livewire/*` to the CSRF exemption list in `VerifyCsrfToken` middleware.
**Reason:** Disabling CSRF on Livewire routes exposes the application to cross-site request forgery.
**Bad Example:**
```php
protected $except = [
    'livewire/*',
];
```
**Good Example:**
```php
protected $except = [
    // Do NOT add livewire routes here
];
```
**Exceptions:** None — CSRF protection is always required for Livewire.

## Rule 8 — Clear Config Cache After Livewire Changes

**Rule Name:** clear-config-after-livewire-changes
**Category:** Always
**Rule:** Run `php artisan config:clear` after modifying `config/livewire.php`.
**Reason:** Cached configuration will not reflect Livewire changes until cleared.
**Bad Example:**
```bash
git pull
php artisan migrate
# config cache not cleared — old livewire settings used
```
**Good Example:**
```bash
git pull
php artisan config:clear
php artisan config:cache
php artisan livewire:publish --force
```
**Exceptions:** Development environments where config cache is disabled.
