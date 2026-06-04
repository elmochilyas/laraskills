# Rules — Zero-Downtime Deployment

## Rule 1: Use Expand-Contract Pattern for Database Migrations
| Field | Value |
|-------|-------|
| **Name** | Use Expand-Contract Pattern for Database Migrations |
| **Category** | Database & Schema |
| **Rule** | Never run destructive migrations (DROP, ALTER that removes columns) in the same deployment as the code that depends on the change. Always use a two-phase expand-contract pattern: add new schema in deploy 1, remove old schema in deploy 2. |
| **Reason** | During zero-downtime deployment, old code runs alongside new code until all instances are updated. If a migration drops a column and old code references it, old instances crash. The expand-contract pattern ensures backward compatibility: deploy 1 adds the new column (old code ignores it), deploy 2 removes the old column (after all old code is drained). |
| **Bad Example** | Migration DROPs `users.role` column; old code still running on some instances reads `users.role` → 500 error. |
| **Good Example** | Deploy 1: add `users.role_id` column (migration creates column; code reads from either column). Deploy 2 (after all instances updated): drop `users.role` column. |
| **Exceptions** | Greenfield applications with no production traffic where zero-downtime is not required. |
| **Consequences Of Violation** | Production errors from old code referencing removed schema; downtime during deployment. |

## Rule 2: Pre-Warm Caches Before Symlink Swap
| Field | Value |
|-------|-------|
| **Name** | Pre-Warm Caches Before Symlink Swap |
| **Category** | Performance & Operations |
| **Rule** | Run `php artisan config:cache`, `route:cache`, and `view:cache` before the atomic symlink swap. After swap, curl critical pages to warm application caches and OpCache. |
| **Reason** | Without pre-warming, the first users hitting the new deployment experience cold-start slowness (2-5 second page loads as Laravel bootstraps). Config/route/view caching in the release directory before the swap ensures they're ready immediately. Curling critical pages after swap warms OpCache and application-level caches. |
| **Bad Example** | Deploying without pre-warming — first 100 users experience 3-second page loads; perceived as a performance regression. |
| **Good Example** | Pre-swap: `php artisan config:cache && php artisan route:cache && php artisan view:cache`. Post-swap: `curl https://example.com/ && curl https://example.com/api/health`. |
| **Exceptions** | Applications with zero-downtime deployment where caches are built before the swap is automatic. |
| **Consequences Of Violation** | Cold-start performance degradation for initial users; perceived as a regression from deployment. |

## Rule 3: Test Rollback Procedure Quarterly
| Field | Value |
|-------|-------|
| **Name** | Test Rollback Procedure Quarterly |
| **Category** | Operations & Reliability |
| **Rule** | Test the rollback procedure in staging before every production deploy. Schedule quarterly full rollback drills. Never deploy without a tested rollback plan. |
| **Reason** | A failed deployment is inevitable. A failed rollback during a failed deployment is catastrophic. Untested rollbacks fail in unpredictable ways (missing files, wrong permissions, incompatible database states). Regular testing ensures the rollback procedure works when it's needed most. |
| **Bad Example** | "We'll figure out rollback if we need it" — deployment fails, rollback script has a bug; extended downtime. |
| **Good Example** | "Rollback tested in staging before deploy. Quarterly drill: simulate failed deploy, verify rollback completes in <30 seconds, verify application comes back healthy." |
| **Exceptions** | Applications so simple that rollback is trivial (single file upload with no database changes). |
| **Consequences Of Violation** | Untested rollback fails during an emergency; extended production downtime. |

## Rule 4: Handle Queue Jobs Gracefully During Deployment
| Field | Value |
|-------|-------|
| **Name** | Handle Queue Jobs Gracefully During Deployment |
| **Category** | Queue & Job Management |
| **Rule** | Use `php artisan queue:restart` (or `horizon:terminate` for Horizon) to gracefully restart queue workers after deployment. Ensure job serialization is backward-compatible for in-flight jobs. |
| **Reason** | Queue workers running old code may receive jobs dispatched by new code during deployment. Backward-incompatible job serialization (new fields, changed class structure) causes job failures. `queue:restart` signals workers to finish their current job and restart, picking up the new code. For Horizon, `horizon:terminate` achieves the same. |
| **Bad Example** | New code dispatches `ProcessPayment` job with a `coupon_code` field — old queue worker deserializes the job, fails on unknown field; job is lost. |
| **Good Example** | New job includes backward-compatible serialization (default values for new fields). After deploy, `php artisan queue:restart` gracefully restarts workers. |
| **Exceptions** | Applications that don't use queues. |
| **Consequences Of Violation** | In-flight jobs fail during deployment; job data loss; processing delays. |

## Rule 5: Keep Last 3-5 Releases for Rollback
| Field | Value |
|-------|-------|
| **Name** | Keep Last 3-5 Releases for Rollback |
| **Category** | Operations & Maintenance |
| **Rule** | Configure deployment tooling to retain the last 3-5 releases. Never keep unlimited releases or delete all old releases immediately. |
| **Reason** | Retaining multiple releases enables rollback to a known-good version if the latest release is broken. Keeping too few (1-2) limits rollback options — if both releases are broken, recovery is harder. Keeping unlimited releases consumes disk space and may cause `disk full` deployment failures during the next deploy. 3-5 is the sweet spot. |
| **Bad Example** | `set('keep_releases', 1)` — deploy breaks, rollback goes to the same broken release; no working fallback. |
| **Good Example** | `set('keep_releases', 5)` — rollback available to any of the last 5 working releases. |
| **Exceptions** | Applications with very limited disk space (<5GB free). |
| **Consequences Of Violation** | Cannot rollback to a working version; disk space exhaustion from unlimited releases. |

## Rule 6: Use Redis for Session Storage in Multi-Server Deployments
| Field | Value |
|-------|-------|
| **Name** | Use Redis for Session Storage in Multi-Server Deployments |
| **Category** | Infrastructure & Consistency |
| **Rule** | Use Redis (or another shared session driver) for session storage in load-balanced or multi-server deployments. Never use file-based session storage. |
| **Reason** | File-based sessions are stored on individual server filesystems. After deployment with symlink swap, the server reads old sessions from the old release folder. Users are logged out or lose session state during deployment. Redis provides a shared, persistent session store that survives deployment symlink changes. |
| **Bad Example** | File-based sessions — after symlink swap, session files are in the old release directory; users lose their sessions and are logged out. |
| **Good Example** | `SESSION_DRIVER=redis` — sessions persist in Redis across deployments; users stay logged in. |
| **Exceptions** | Single-server deployments where file-based sessions are adequate (no load balancing). |
| **Consequences Of Violation** | Users lose session state during every deployment; forced logout degrades user experience. |
