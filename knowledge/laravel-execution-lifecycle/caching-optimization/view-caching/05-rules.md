## Clear Compiled Views During Every Deployment
---
## Performance
---
## Always run `php artisan view:clear` as part of every deployment that changes Blade template files.
---
## Blade compiles `.blade.php` templates to cached PHP files on first access. If the compiled file's timestamp is newer than the source template, Blade serves the old compiled version and template changes are invisible.
---
```bash
# Deploying template changes without clearing view cache
php artisan migrate --force
php artisan config:cache
php artisan route:cache
```
---
```bash
php artisan view:clear
php artisan migrate --force
php artisan config:cache
php artisan route:cache
```
---
## Deployments that make no template changes and only modify backend logic or configuration.
---
## Template changes not reflected after deployment; users see old UI; debugging time wasted on "template not updating" issues.
---
## Precompile Views in Production Warmup
---
## Performance
---
## Run `php artisan view:cache` after deployment to precompile all registered Blade templates (Laravel 9+).
---
## Without precompilation, each template compiles on first access — a 5-20ms penalty per unique template during the warmup period. Precompilation moves this cost to the deploy step.
---
```bash
php artisan optimize
# Serving traffic — first visitor compiles every new template
```
---
```bash
php artisan optimize
php artisan view:cache
```
---
## Laravel versions before 9 that do not support the `view:cache` command.
---
## Spikes in response time for the first user to visit each page after deployment; inconsistent latency during cache warmup.
---
## Keep Blade Templates Free of Business Logic
---
## Architecture
---
## Never write database queries, heavy computations, or complex conditionals inside `.blade.php` files; pass pre-computed data from controllers or view composers.
---
## Compiled views execute as plain PHP on every render with no caching layer. Business logic in templates runs on every request and is not reusable outside the view layer.
---
```blade
@php
    $orders = DB::table('orders')->where('user_id', auth()->id())->get();
    $total = $orders->sum('amount');
@endphp
```
---
```php
// Controller
return view('dashboard', [
    'orderTotal' => Order::where('user_id', auth()->id())->sum('amount'),
]);
```
---
## Simple formatting helpers or presentational logic that has no side effects and no database access.
---
## Duplicated logic across templates; untestable view code; performance degradation as query complexity grows.
---
## Limit View Inheritance Depth
---
## Maintainability
---
## Keep Blade template inheritance chains to a maximum of three levels (`layout → section → partial`).
---
## Each `@extends`, `@include`, or component call compiles to a separate PHP file that must be `require`d at render time. Deep nesting increases file I/O per request and makes the template hierarchy difficult to reason about.
---
```blade
{{-- layout.blade.php --}}
@extends('base')
{{-- base.blade.php --}}
@extends('root')
{{-- root.blade.php --}}
@extends('core')
```
---
```blade
{{-- Single clear inheritance level --}}
@extends('layouts.app')
@include('components.card')
```
---
## CMS or page-builder applications where deep nesting is inherent to the content model.
---
## Slow page rendering due to cascading file includes; templates hard to debug and maintain.
---
## Use View Composers Only for Views That Need Them
---
## Performance
---
## Register view composers for specific views only; avoid registering global composers that run for every rendered view.
---
## Global view composers execute their `compose()` method on every view render, including views that do not need the data. This adds unnecessary query and computation overhead to every page load.
---
```php
View::composer('*', function ($view) {
    $view->with('notifications', Notification::all());
});
```
---
```php
View::composer('layouts.nav', function ($view) {
    $view->with('notifications', Notification::all());
});
```
---
## View composers that set globally needed values (site name, current user) with negligible overhead.
---
## Unnecessary queries executed on every page view; database load increases with no user-facing benefit.
