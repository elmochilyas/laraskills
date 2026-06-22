# Metadata

Domain: DevOps & Infrastructure
Subdomain: Queue Deployment Safety
Knowledge Unit: Queue restart, Horizon verification, and post-deploy monitoring
Difficulty Level: Intermediate
Last Updated: 2026-06-22

---

# Executive Summary

After deployment, run `php artisan queue:restart` to signal workers to restart with new code, verify Horizon supervisor configuration matches the new queue topology, and monitor failed jobs for the first 15 minutes. A deployment that changes queue structure without restarting workers can silently lose or misroute jobs.
