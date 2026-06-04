## Rule 1: Always Restart Workers After Every Deploy
---
## Category
Reliability | Maintainability
---
## Rule
Always run `php artisan queue:restart` (or `horizon:terminate`) as the final step in every deployment script.
---
## Reason
Daemon workers boot the framework once at container start and hold old code in memory. Without restart, workers process jobs with stale application code against potentially migrated database schemas.
---
## Bad Example
```bash
# Deploy script without worker restart
git pull origin main
composer install --no-dev
php artisan migrate --force
# Workers still running old code!
```
---
## Good Example
```bash
git pull origin main
composer install --no-dev
php artisan migrate --force
php artisan queue:restart  # Workers pick up new code
```
---
## Exceptions
Horizon deployments using `horizon:terminate` with Supervisor autorestart — equivalent behavior.
---
## Consequences Of Violation
Workers silently process jobs with outdated code; schema mismatches; undetected business logic defects.

## Rule 2: Use Shared Cache for Multi-Server queue:restart
---
## Category
Scalability | Reliability
---
## Rule
When using `queue:restart` across multiple servers, ensure the cache driver is shared (Redis/Memcached), not file-based.
---
## Reason
`queue:restart` stores a timestamp in the cache. A file-based cache is local to one server — workers on other servers never see the restart signal.
---
## Bad Example
```env
CACHE_DRIVER=file  # queue:restart only reaches one server
```
---
## Good Example
```env
CACHE_DRIVER=redis  # queue:restart reaches all servers
```
---
## Exceptions
Single-server deployments where file cache is sufficient.
---
## Consequences Of Violation
Multi-server: only one server's workers restart; others run old code indefinitely; partial deployment with mixed old/new worker behavior.

## Rule 3: Use Rolling Restart for Zero-Downtime Multi-Server Deploy
---
## Category
Scalability | Reliability
---
## Rule
Restart workers on one server at a time during multi-server deployments to maintain continuous processing capacity.
---
## Reason
During restart, workers finish current jobs before exiting. With N servers, capacity drops to N-1 during each server's restart window — rolling avoids complete processing halt.
---
## Bad Example
```bash
# Restart all servers simultaneously — zero processing during restart
ssh server1 "php artisan queue:restart"
ssh server2 "php artisan queue:restart"
ssh server3 "php artisan queue:restart"
```
---
## Good Example
```bash
# Rolling restart — one server at a time
ssh server1 "php artisan queue:restart && sleep 60"
ssh server2 "php artisan queue:restart && sleep 60"
ssh server3 "php artisan queue:restart && sleep 60"
```
---
## Exceptions
Scheduled maintenance windows where complete processing halt is acceptable.
---
## Consequences Of Violation
Zero processing capacity during simultaneous restart window; jobs queue up; latency spikes; downstream systems timeout waiting for results.
