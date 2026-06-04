# ECC Anti-Patterns — Maintenance Mode

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Application Architecture & Structure |
| **Knowledge Unit** | Maintenance Mode |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Forgetting `php artisan up` (Extended Unattended Downtime)
2. Manual Maintenance Mode (No Automation, SSH-Only)
3. No Bypass Secret for Deployment Verification
4. Deploying Without Queue Worker Coordination

---

## Repository-Wide Anti-Patterns

- Using Maintenance Mode for Static/Partial Updates (unnecessary downtime)
- Generic Error Page (Laravel's default 503, unprofessional)
- Multi-Server State Mismatch (down on one server, up on another)
- Extended Maintenance Windows (hours during working hours)

---

## Anti-Pattern 1: Forgetting `php artisan up`

### Category
Reliability

### Description
Running `php artisan down` before deployment but never calling `php artisan up` afterward, leaving the application showing a 503 page indefinitely.

### Why It Happens
The deployment script fails midway (after `down` but before `up`). The `up` command is only in the success path, not the failure path. Or the developer runs `down` manually and forgets.

### Warning Signs
- `php artisan up` appears only once in the deployment script (no failure fallback)
- No monitoring alert for prolonged maintenance mode
- Application has been showing 503 for hours

### Preferred Alternative
Automate `php artisan up` as the last step in every deployment, with error handling that calls `up` even on failure. Add monitoring that alerts if maintenance mode is active beyond the expected window.

### Related Rules
- Rule: Automate php artisan up in Deployment Scripts

---

## Anti-Pattern 2: Manual Maintenance Mode (SSH-Only)

### Category
Reliability

### Description
SSHing into servers to manually run `php artisan down` and `php artisan up` instead of automating in deployment scripts.

### Why It Happens
No CI/CD pipeline, or the deployment is considered "too simple" to automate.

### Warning Signs
- Deployment instructions include "SSH to server, run php artisan down, deploy, run php artisan up"
- No deployment script exists
- Maintenance mode is enabled at different times on different servers

### Preferred Alternative
Always automate `down`/`up` in deployment scripts with error handling. Manual management is error-prone and the primary cause of extended downtime.

### Related Rules
- Rule: Automate php artisan up in Deployment Scripts

---

## Anti-Pattern 3: No Bypass Secret for Deployment Verification

### Category
Reliability

### Description
Running `php artisan down` without the `--secret` flag, preventing anyone from accessing the application to verify the deployment.

### Why It Happens
Developers don't know about `--secret` or assume they don't need it.

### Warning Signs
- `php artisan down` in deployment script has no `--secret` flag
- Team members cannot access the deployed version until the app is brought back online
- Deployment verification must be done blind

### Preferred Alternative
Always use `--secret` with a unique value per deployment. Share the bypass URL with the team for verification.

### Related Rules
- Rule: Always Use --secret for Deployment Bypass

---

## Anti-Pattern 4: Deploying Without Queue Worker Coordination

### Category
Reliability

### Description
Enabling maintenance mode while queue workers are actively processing jobs, causing job failures or data corruption.

### Why It Happens
Developers don't consider the queue as part of the deployment. The application has queue workers, but the deployment script doesn't interact with them.

### Warning Signs
- Queue workers are never paused during deployments
- Jobs fail or behave unexpectedly during deployment windows
- Database migrations run while workers are still processing with the old code

### Preferred Alternative
Pause queue workers before `php artisan down`. Resume after `php artisan up`.

### Related Rules
- Rule: Coordinate Maintenance Mode with Queue Drain
