# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Worker Management
- **Knowledge Unit:** K061 — Deployment Restart Strategies
- **Knowledge ID:** K061
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Deployment
  - Laravel Docs — Horizon: Deployment

---

# Overview

Deploying new code requires restarting queue workers to pick up the updated application. For `queue:work` workers, `queue:restart` broadcasts a restart signal via cache. For Horizon, `horizon:terminate` gracefully stops all supervisors and workers, then the process supervisor restarts them. The restart strategy must balance zero job loss with prompt code deployment.

---

# Core Concepts

- **`queue:restart`:** Sets cache key `illuminate:queue:restart` — workers check this in their loop. Finish current job, then exit. Supervisor restarts with new code.
- **`horizon:terminate`:** Pauses → terminates all supervisors. Workers finish current jobs and exit. Horizon master process stops.
- **Grace period:** Workers may take up to max(`--timeout`, longest job) seconds to finish.
- **Rolling restart (multi-server):** Terminate Server A → deploy → restart → repeat for Server B.

---

# When To Use

- **`queue:restart` for standard workers:** Simple, cache-based, reliable.
- **`horizon:terminate` for Horizon:** Graceful, coordinated stop of all supervisors.
- **Always include restart in deployment script.** Never rely on manual restart.

---

# When NOT To Use

- `queue:restart` without shared cache (multi-server) — only workers on same server receive signal.
- `horizon:terminate` without supervisor autorestart — Horizon stops permanently.

---

# Best Practices

- **Always restart workers after every deploy.** Without restart, workers run old code indefinitely. *Why: The daemon worker booted once at container start — it holds old code in memory until the process is restarted.*
- **Include restart in deployment script.** `php artisan queue:restart` (or `horizon:terminate`) as the last step. *Why: A manual restart step is easily forgotten. Automating it ensures every deploy triggers a worker restart.*
- **Use rolling restart for zero-downtime deployment on multi-server.** Restart one server at a time — remaining servers process jobs during restart. *Why: During restart, workers finish current jobs before exiting. With N servers, capacity drops to N-1 during each server's restart window — rolling avoids complete processing halt.*
- **Use shared cache (Redis/Memcached) for `queue:restart` on multi-server.** File cache is per-server — only one server gets the restart signal. *Why: `queue:restart` stores the timestamp in the cache — workers compare it to their start time. A file cache is local to one server, so multi-server workers never see the updated timestamp.*

---

# Performance Considerations

- `queue:restart` propagation: workers check cache every `--sleep` seconds. At `--sleep=3`, up to 3s delay.
- `horizon:terminate` uses Redis pub/sub — near-instant (~10ms).
- Rolling restart: capacity reduced by 1/N per server during restart window.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not restarting after deploy | Forgotten step | Workers run old code indefinitely | Automate in deployment script |
| `queue:restart` with file cache (multi-server) | No shared cache | Only one server's workers restart | Use Redis/Memcached |
| `horizon:terminate` without auto-restart | Process supervisor not configured | Horizon stops permanently | Ensure Supervisor autorestart |
| Not waiting for graceful shutdown | Deploying immediately | Workers killed mid-job | Wait for workers to finish |

---

# Examples

```bash
# Deploy script for standard workers
git pull origin main
composer install --no-dev
php artisan migrate --force
php artisan queue:restart

# Deploy script for Horizon
git pull origin main
composer install --no-dev
php artisan migrate --force
php artisan horizon:terminate
# Supervisor restarts Horizon automatically
```

---

# Related Topics

- **K057 Process Signals (K057)** — What happens during termination
- **K049 Multi-Server Horizon (K049)** — Rolling restart across servers
