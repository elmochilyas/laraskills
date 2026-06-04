# Maintenance Mode — Rules

## Always Use --secret for Deployment Bypass

Generate a unique `--secret` value every time `php artisan down` is executed in a deployment script.

---

## Category

Reliability

---

## Rule

Every `php artisan down` command in a deployment or maintenance script must include the `--secret` flag with a unique value. Use `--secret="deploy-$(date +%s)"` or a similar dynamic generation strategy.

---

## Reason

Without `--secret`, team members cannot access the application to verify the deployment. The secret URL creates a signed bypass that allows authorized users (those with the URL) to test the deployed version while external users see the maintenance page.

---

## Bad Example

```bash
php artisan down --retry=60
# No secret — no one can verify the deployment
```

---

## Good Example

```bash
php artisan down --retry=60 --secret="deploy-$(date +%s)"
# Team can access https://example.com/deploy-1717022400 to verify
```

---

## Exceptions

Emergency maintenance where immediate shutdown is required and no verification is needed may skip `--secret`. However, even then, a secret is recommended for rollback verification.

---

## Consequences Of Violation

Cannot verify deployment without bringing the application back up, deployment validation requires taking the app online again.

---

## Automate php artisan up in Deployment Scripts

Always include `php artisan up` as the final step in deployment scripts, with error handling for rollback scenarios.

---

## Category

Reliability

---

## Rule

Deployment scripts must include `php artisan up` after successful deployment steps. In case of failure, the script must also call `php artisan up` to restore application availability. Never leave the application in maintenance mode unattended.

---

## Reason

The most common maintenance mode mistake is forgetting `php artisan up` after deployment. Automation ensures the application comes back online. Error handling ensures that failed deployments don't trap the application in maintenance mode.

---

## Bad Example

```bash
php artisan down
git pull origin main
composer install --no-dev
php artisan migrate --force
# No php artisan up! Application stays down until manual intervention.
```

---

## Good Example

```bash
php artisan down --secret="deploy-$(date +%s)"
if git pull origin main && composer install --no-dev && php artisan migrate --force; then
    php artisan up
    echo "Deployment successful"
else
    php artisan up
    echo "Deployment failed — app returned to online state"
    exit 1
fi
```

---

## Exceptions

No common exceptions. `php artisan up` must always be included with rollback handling.

---

## Consequences Of Violation

Application shows 503 for extended periods, user-facing downtime, business impact, urgent manual intervention required.

---

## Add Monitoring IPs to --allow

Include monitoring service IP addresses in the `--allow` flag when enabling maintenance mode.

---

## Category

Reliability

---

## Rule

Before enabling maintenance mode, add monitoring service IP addresses (Pingdom, New Relic, StatusCake, health check endpoints) to `--allow` parameters. Use CIDR notation for ranges.

---

## Reason

Monitoring services trigger alerts when the site returns 503. Without the IP allowlist, monitoring tools report false-positive incidents during planned maintenance, alerting on-call engineers unnecessarily.

---

## Bad Example

```bash
php artisan down --retry=60 --secret="deploy-$(date +%s)"
# Monitoring IPs not allowed — false alerts triggered
```

---

## Good Example

```bash
php artisan down \
    --retry=60 \
    --secret="deploy-$(date +%s)" \
    --allow=127.0.0.1 \
    --allow=192.168.1.0/24 \
    --allow=203.0.113.50
```

---

## Exceptions

Applications without monitoring services, or where monitoring is disabled during the maintenance window, may skip the `--allow` flag.

---

## Consequences Of Violation

False-positive monitoring alerts during planned maintenance, unnecessary incident response, alert fatigue for operations teams.

---

## Coordinate Maintenance Mode with Queue Drain

Pause queue workers before enabling maintenance mode and resume them after bringing the application back up.

---

## Category

Reliability

---

## Rule

Before `php artisan down`, pause queue workers (`php artisan horizon:pause` or equivalent). After `php artisan up`, resume queue workers (`php artisan horizon:continue`). Never deploy while queue workers are actively processing jobs.

---

## Reason

During deployment, code changes, database migrations, and configuration updates can break running queue jobs. Pausing workers lets running jobs finish without new jobs starting. Resuming after deployment ensures new jobs run against the updated code.

---

## Bad Example

```bash
php artisan down
# Queue workers still running — jobs may fail during migration
```

---

## Good Example

```bash
php artisan horizon:pause
php artisan down
# ... deployment steps ...
php artisan up
php artisan horizon:continue
```

---

## Exceptions

Applications that do not use queues have no workers to coordinate.

---

## Consequences Of Violation

Failed queue jobs during deployment, database migration race conditions, lost data, corrupted job state.

---

## Customize the Maintenance View

Create a custom `resources/views/errors/503.blade.php` view instead of using Laravel's default.

---

## Category

Design

---

## Rule

Replace the default 503 Blade view with a branded maintenance page that communicates expected downtime, estimated return time, and alternative contact methods.

---

## Reason

Laravel's default maintenance page is generic and unprofessional. A customized page maintains brand trust by informing users about the situation, setting expectations for when the application will return, and providing channels for urgent inquiries.

---

## Bad Example

Using Laravel's default white page with "Service Unavailable" text.

---

## Good Example

```blade
<x-layout>
    <div class="maintenance-page">
        <h1>Under Maintenance</h1>
        <p>{{ $exception?->getMessage() ?? "We'll be back shortly." }}</p>
        <p>Expected downtime: approximately 5 minutes.</p>
        <p>Follow @status on Twitter for updates.</p>
    </div>
</x-layout>
```

---

## Exceptions

Internal tools with no external users may use the default view.

---

## Consequences Of Violation

Unprofessional appearance during downtime, user frustration from lack of information, increased support inquiries.

---

## Never Use Maintenance Mode for Partial or Static Updates

Do not take the application offline for changes that can be deployed without downtime.

---

## Category

Architecture

---

## Rule

Use maintenance mode only for changes that require application unavailability (schema migrations that break running requests, major deployments). Use versioned assets, feature flags, or zero-downtime strategies for static asset updates, configuration changes, and partial feature releases.

---

## Reason

Maintenance mode is an all-or-nothing approach. Using it for minor changes causes unnecessary downtime, frustrates users, and devalues the maintenance window for situations that truly need it.

---

## Bad Example

```bash
# Taking the whole app down to update a CSS file
php artisan down
git pull origin main
# Changed only public/css/app.css
php artisan up
```

---

## Good Example

```bash
# Use versioned assets with cache busting
mix('css/app.css') // automatically versioned
# Deploy without maintenance mode
git pull origin main
```

---

## Exceptions

Emergency security patches that affect authentication or authorization may require immediate full downtime.

---

## Consequences Of Violation

Unnecessary user-facing downtime, eroded trust from frequent maintenance periods, overuse of maintenance mode for trivial changes.

---

## Use Orchestration for Multi-Server Deployments

Use centralized orchestration to enable and disable maintenance mode across all servers simultaneously in load-balanced environments.

---

## Category

Reliability

---

## Rule

In multi-server or load-balanced environments, do not run `php artisan down` on individual servers. Use orchestration tools (Forge, Envoyer, Ansible) to execute the command on all servers concurrently.

---

## Reason

Maintenance mode is file-based and per-server. Running it on individual servers creates a window where some servers serve the maintenance page and others serve the application. Users experience intermittent availability depending on which server handles their request.

---

## Bad Example

```bash
# Manual per-server — creates inconsistency
ssh web1 "php artisan down"
# web1 down, web2 still serving requests
```

---

## Good Example

```bash
# Orchestrated — all servers simultaneously
# Forge: "Enable Maintenance Mode" button
# Envoyer: automatically handles deployment maintenance
# Ansible: ansible web -m shell -a "php artisan down"
```

---

## Exceptions

Single-server applications do not require orchestration.

---

## Consequences Of Violation

Users randomly see maintenance page or application depending on the server handling their request, unpredictable user experience during maintenance.
