```yaml
name: laravel-pulse-setup
description: >
  Guide an AI agent through installing and configuring Laravel Pulse for a
  Laravel application — cache driver setup, authorization, card customization,
  and integration with existing observability.
workflow:
  steps:
    - name: install-pulse
      description: >
        Run `composer require laravel/pulse`.
        Publish config: `php artisan vendor:publish --tag=pulse-config`.
        Publish views: `php artisan vendor:pulse --tag=pulse-views`.
        Register PulseServiceProvider.

    - name: configure-cache-driver
      description: >
        Ensure cache driver is set to 'redis' in config/cache.php.
        Pulse uses cache for recording and dashboard reads.
        Redis provides adequate performance; database driver may
        cause contention under load.

    - name: set-up-authorization
      description: >
        Configure Pulse authorization. In AppServiceProvider:
        Pulse::user(fn ($user) => $user->isAdmin());
        Or use gate-based authorization. Test that unauthorized
        users cannot access /pulse.

    - name: customize-dashboard-cards
      description: >
        Edit config/pulse.php to customize the dashboard cards.
        Remove cards for unused features (Horizon, Octane).
        Add custom cards for application-specific metrics.
        Arrange in logical order.

    - name: configure-ignore-patterns
      description: >
        Add Pulse::ignore() for noisy endpoints:
        Pulse::ignore('/health', '/pulse', '/horizon/api/*');
        This prevents health checks and monitoring probes
        from dominating Pulse metrics.

    - name: register-pulse-route
      description: >
        Ensure Pulse route is registered in routes/web.php:
        Pulse::routes();
        Or define custom route location.

    - name: verify-dashboard
      description: >
        Access /pulse in browser. Verify all cards show data.
        Check that authorization works. Verify ignore patterns
        exclude expected endpoints.

  triggers:
    - User asks "How do I set up Laravel Pulse?"
    - User asks "What cache driver should Pulse use?"
    - User reports "Pulse dashboard is empty"
```
