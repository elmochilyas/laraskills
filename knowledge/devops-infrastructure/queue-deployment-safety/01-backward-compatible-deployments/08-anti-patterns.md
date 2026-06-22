# Anti-Patterns for Backward-Compatible Deployments

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | DevOps & Infrastructure |
| Subdomain | Queue Deployment Safety |
| Knowledge Unit | Backward-Compatible Deployments with Queued Jobs |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

| ID | Anti-Pattern | Severity | Frequency |
|----|-------------|----------|-----------|
| AP-BCD-001 | Dropping Columns Same Deploy as Code Change | Critical | Medium |
| AP-BCD-002 | Renaming Job Class Without Transition Alias | Critical | Medium |
| AP-BCD-003 | Serializing Full Eloquent Models in Jobs | High | High |
| AP-BCD-004 | Assuming queue:restart Fixes Everything | High | Medium |
| AP-BCD-005 | Full Rollout of New Billing Behavior | High | Medium |

---

## Repository-Wide Anti-Patterns

The following anti-patterns from related KUs are also relevant here:
- AP-QDS-002 (Migrations Before Code Deploy) — from Queue Deployment Safety
- AP-QDS-003 (Direct Class Rename Without Alias) — from Queue Deployment Safety

---

## AP-BCD-001: Dropping Columns Same Deploy as Code Change

### Category
Deployment Safety | Data Integrity

### Description
Dropping a database column in the same deployment that stops using it. The code no longer references the column, so the developer assumes it's safe to drop. But queued jobs serialized before the deploy still reference the old column — they fail on deserialization.

### Why It Happens
- "The code doesn't use this column anymore, so I can drop it" — logical but incomplete reasoning
- The developer doesn't consider jobs already in the queue
- CI/CD pipeline runs code deploy and migration in the same step
- No awareness of the two-deploy phasing strategy

### Warning Signs
- A migration that drops a column is in the same PR/commit as the code change that stops using it
- No phased deployment plan for column removals
- Deserialization failures in the failed_jobs table after deploying column drops
- Old jobs failing with "column not found" errors

### Why Harmful
Queued jobs serialized before the deploy carry the old column reference in their serialized model state. When the new code tries to re-fetch the model (via `SerializesModels`), the re-fetch may fail if the column is dropped. Even if the re-fetch succeeds (the column is just ignored), old code paths that reference the column by name fail. In billing systems, this means lost webhook processing and subscription state divergence.

### Real-World Consequences
- A team removes the `stripe_plan_id` column from `subscriptions` in the same deploy that switches to using `stripe_price_id`. Fifteen webhook jobs queued before the deploy carry serialized `Subscription` models. When the jobs process, the model re-fetch fails because the column no longer exists. The 15 webhooks are lost. The affected customers' subscription updates are not reflected in the local database.

### Preferred Alternative
Phase the column removal across two deploys. Deploy N: add the new column (`stripe_price_id`) as nullable, update code to use the new column, keep the old column. Run a background job to populate the new column from the old one. Deploy N+1: after verifying the queue is empty, drop the old column.

### Refactoring Strategy
1. Search for migrations that drop columns in the same PR as code changes.
2. Split each into two deploys: add new + keep old, then drop old in the next cycle.
3. Add a background job to populate the new column from the old one.
4. Verify queue depth is zero before the cleanup deploy.

### Detection Checklist
- [ ] Migration drops a column in the same PR as the code change that stops using it
- [ ] No phased deployment plan for column removals
- [ ] Deserialization failures after deploying column drops
- [ ] Old jobs failing with "column not found" errors
- [ ] No verification of queue emptiness before column drops

### Related Rules
- Add Columns in Deploy N, Remove Columns in Deploy N+1

---

## AP-BCD-002: Renaming Job Class Without Transition Alias

### Category
Backward Compatibility | Deployment

### Description
Renaming a queued job class and deleting the old class file without keeping a transition alias. All jobs serialized with the old fully-qualified class name fail to deserialize with `ClassNotFoundException`.

### Why It Happens
- Code cleanup: the old class file is deleted as part of the rename
- The developer doesn't know that serialized jobs store the FQCN
- The queue appears empty in development, masking the issue
- Refactoring tooling automatically deletes old files

### Warning Signs
- Job class renamed and old file deleted in the same commit
- `ClassNotFoundException` in failed_jobs table after deployment
- No `class OldName extends NewName {}` alias file in the codebase
- Failed jobs with the old class name in the serialized payload

### Why Harmful
PHP serialization stores the fully-qualified class name. After the rename, the autoloader can't find the old class. The job fails permanently — it can't be retried because the class doesn't exist. In billing systems, this means lost webhooks, lost invoice processing, and manual replay from Stripe's API.

### Real-World Consequences
- A developer renames `App\Jobs\SyncSubscription` to `App\Jobs\Billing\SyncSubscriptionFromStripe`. The old file is deleted. After deployment, 8 `SyncSubscription` jobs in the queue fail with `ClassNotFoundException`. The 8 subscription syncs are lost. The affected teams' subscriptions are out of sync with Stripe. The team must manually re-fetch each subscription from Stripe's API and update the local database.

### Preferred Alternative
Create the new class with the new name. Keep the old class as an empty alias: `class SyncSubscription extends SyncSubscriptionFromStripe {}`. Add a comment: "// Transition alias — remove in deploy N+1 after queue is drained." Remove the alias in the next deploy cycle.

### Refactoring Strategy
1. Before renaming a job class, check if the class has ever been dispatched to the queue.
2. Create the new class with the new name and logic.
3. Keep the old class file as an empty alias extending the new class.
4. Deploy with both classes present.
5. In the next deploy cycle, verify queue is empty, then remove the alias file.

### Detection Checklist
- [ ] Job class renamed and old file deleted in the same commit
- [ ] `ClassNotFoundException` in failed_jobs after deployment
- [ ] No transition alias for renamed job classes
- [ ] Failed jobs with old class names in the payload
- [ ] No queue depth verification before removing old class files

### Related Rules
- Never Rename a Job Class Without a Transition Alias

---

## AP-BCD-003: Serializing Full Eloquent Models in Jobs

### Category
Backward Compatibility | Job Design

### Description
Passing full Eloquent models as constructor parameters to queued jobs, even with `SerializesModels`. Any schema change to the model's table introduces a deployment risk for existing queued jobs. The re-fetch on deserialization can fail if columns are dropped, relationships change, or the model is soft-deleted.

### Why It Happens
- Convenience: `ProcessOrder::dispatch($order)` is simpler than `ProcessOrder::dispatch($order->id)`
- `SerializesModels` is perceived as a safety net
- The developer doesn't anticipate future schema changes
- Tutorial code passes models directly

### Warning Signs
- Job constructors with Eloquent model type hints: `public function __construct(public Order $order)`
- `use SerializesModels;` on job classes that accept full models
- No re-fetch in `handle()` — the job uses the serialized model directly
- Every schema change to the model requires a multi-deploy transition plan

### Why Harmful
Even with `SerializesModels` (which stores only the model identifier and re-fetches on deserialization), the re-fetch can fail: required columns dropped, relationship definitions changed, model soft-deleted while queued. Serializing explicit IDs gives full control over the re-fetch logic — use `find()` to handle null gracefully, load specific columns, or skip the fetch.

### Real-World Consequences
- A job accepts `public Invoice $invoice` with `SerializesModels`. The `invoices` table schema is updated to remove the `tax_rate` column. Fifteen invoice processing jobs queued before the schema change fail on deserialization because the re-fetch tries to load the removed column. The 15 invoices are not processed. Customers don't receive their invoices. If the jobs had serialized only `$invoiceId`, the re-fetch would succeed and the job would use the current schema.

### Preferred Alternative
Serialize identifiers (primary keys) in job constructors. Re-fetch the model in `handle()`. Use `find()` (not `findOrFail()`) to handle missing models gracefully. For snapshot semantics, serialize a DTO with specific attributes: `$order->only(['id', 'status', 'total'])`.

### Refactoring Strategy
1. Search for job constructors with Eloquent model type hints.
2. Replace model parameters with ID parameters: `public readonly string $orderId`.
3. Add re-fetch in `handle()`: `$order = Order::find($this->orderId)`.
4. Handle null gracefully: `if (!$order) { Log::warning(...); return; }`.
5. For snapshot semantics, serialize a DTO instead of the full model.

### Detection Checklist
- [ ] Job constructors with Eloquent model type hints
- [ ] `use SerializesModels` on jobs that accept full models
- [ ] No re-fetch in `handle()` — job uses serialized model directly
- [ ] Every model schema change requires a multi-deploy transition plan
- [ ] Job payloads are large (full model serialization)

### Related Rules
- Serialize Identifiers, Not Full Eloquent Models, in Job Constructors

---

## AP-BCD-004: Assuming queue:restart Fixes Everything

### Category
Deployment | Misunderstanding

### Description
Assuming that running `php artisan queue:restart` during deployment makes all serialization compatibility issues go away. `queue:restart` only signals workers to restart with new code — it does not modify already-serialized job payloads in the queue. Old-format jobs still fail when the new code tries to process them.

### Why It Happens
- The developer thinks "restart" means "re-process everything from scratch"
- `queue:restart` is perceived as a magic fix for deployment issues
- The distinction between "worker code" and "serialized payload" isn't understood
- The queue is empty in development, so the issue isn't observed

### Warning Signs
- Deployment scripts rely on `queue:restart` without transition aliases or phased migrations
- No backward compatibility planning for class renames or schema changes
- "We just restart the workers and it works" attitude
- Failed jobs after deployment with serialization exceptions despite `queue:restart`

### Why Harmful
`queue:restart` tells workers to exit and restart with new code. But the jobs already in the queue were serialized with the old code's class names and constructor signatures. When the new worker picks up an old job, it tries to `unserialize()` the payload — which contains the old class name. If the class was renamed, deserialization fails. `queue:restart` doesn't touch the queue contents; it only restarts the workers.

### Real-World Consequences
- A team renames `ProcessPayment` to `HandlePayment` and runs `queue:restart` after deploy. They assume the restart "applies the new code to all jobs." Twenty payment jobs in the queue fail with `ClassNotFoundException: App\Jobs\ProcessPayment`. The team is surprised — "we restarted the workers!" The restart only gave workers the new code; it didn't change the serialized payloads in the queue.

### Preferred Alternative
Understand that `queue:restart` restarts workers with new code but does not modify queued payloads. Plan backward compatibility for any change that affects serialized payloads: transition aliases for class renames, phased migrations for column drops, DTOs instead of models.

### Refactoring Strategy
1. Educate the team on the difference between worker code and serialized payloads.
2. Add backward compatibility planning to the deployment checklist.
3. Create transition aliases for all class renames.
4. Phase column removals across two deploys.
5. Never rely on `queue:restart` as the sole backward compatibility strategy.

### Detection Checklist
- [ ] Deployment relies on `queue:restart` without transition aliases or phasing
- [ ] No backward compatibility planning for class renames or schema changes
- [ ] "queue:restart fixes everything" attitude in the team
- [ ] Failed jobs after deployment despite running `queue:restart`
- [ ] No understanding of serialized payload vs. worker code distinction

### Related Rules
- Never Rename a Job Class Without a Transition Alias
- Add Columns in Deploy N, Remove Columns in Deploy N+1

---

## AP-BCD-005: Full Rollout of New Billing Behavior

### Category
Risk Management | Billing

### Description
Deploying new or modified billing logic (invoice calculation, subscription sync, tax handling) enabled for 100% of customers simultaneously. A bug in the new code affects all customers at once — overcharging, undercharging, or granting/denying features incorrectly.

### Why It Happens
- The code is tested in staging and "works" — the team is confident
- Feature flags feel like extra complexity for a "simple" change
- Deadline pressure: "just deploy it"
- No prior billing incidents, so the team is less cautious

### Warning Signs
- New billing logic deployed without a feature flag
- No gradual rollout plan (1% → 10% → 50% → 100%)
- No safe fallback to the previous behavior
- No billing-specific monitoring enabled for the rollout
- "It's a small change, we don't need a flag" mentality

### Why Harmful
Billing bugs have immediate financial impact. A rounding error in invoice calculation, an incorrect tax rate, or a mishandled currency conversion can overcharge or undercharge customers at scale. Without a feature flag, the only recovery is a full rollback — which takes minutes to hours depending on CI/CD pipeline speed. During that time, the bug continues affecting new transactions. A feature flag limits the blast radius and enables instant recovery.

### Real-World Consequences
- A team deploys a new Stripe tax calculation integration enabled for all teams. A configuration error in the tax rate mapping causes incorrect tax on 5,000 invoices before detection. Some customers are overcharged (chargebacks, support load), others undercharged (revenue leakage). A feature flag would have limited the impact to 1% of teams (50 invoices) and enabled instant rollback. Instead, the team must rollback the entire deploy, reconcile 5,000 invoices, and issue refunds or charge adjustments.

### Preferred Alternative
Gate new billing behavior behind a feature flag (Laravel Pennant) that defaults to OFF. Deploy the code, then enable for internal/staging teams first. Monitor billing metrics. Enable for 1% of production, then ramp up over hours or days. If metrics show a problem, disable the flag instantly — no rollback needed.

### Refactoring Strategy
1. Identify all new billing behavior being deployed.
2. Wrap each in a `Feature::for($team)->active('billing-v2')` check.
3. Deploy with the flag OFF for all teams.
4. Enable for internal teams, verify, then enable for 1% of production.
5. Monitor billing metrics (invoice amounts, subscription statuses, feature gate denials) during rollout.
6. Ramp to 10% → 50% → 100% over hours or days.

### Detection Checklist
- [ ] New billing logic deployed without a feature flag
- [ ] No gradual rollout plan
- [ ] No safe fallback to previous behavior
- [ ] No billing-specific monitoring during rollout
- [ ] "It's a small change, we don't need a flag" mentality

### Related Rules
- Deploy New Billing Behavior Behind a Feature Flag That Defaults to OFF
