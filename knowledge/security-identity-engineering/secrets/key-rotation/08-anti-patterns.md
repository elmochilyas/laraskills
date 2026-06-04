# Anti-Patterns: Zero-Downtime API Key Rotation

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Secrets Management |
| Knowledge Unit | Zero-Downtime API Key Rotation |
| Audience | Architects, DevOps, Platform Engineers |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-SK-01 | Immediate Key Replacement Without Grace Period | Critical | Medium | Medium |
| AP-SK-02 | Manual Rotation Without Automation | High | High | Medium |
| AP-SK-03 | No Rollback Plan After Rotation | Critical | Medium | Low |
| AP-SK-04 | Discarding Old Key Before Migration Complete | Critical | High | Medium |
| AP-SK-05 | Same Key Across Environments | High | High | Low |

---

## Repository-Wide Anti-Patterns

- **No Rotation Testing in Staging**: Production-only rotation with no staging validation — guaranteed data loss scenario
- **No Decryption Failure Monitoring**: After rotation, no alerts for `DecryptException` — silent data loss
- **Rotation Without Documentation**: Team knowledge is tribal — rotation steps exist only in one person's head

---

## 1. Immediate Key Replacement Without Grace Period

### Category
Security · Reliability

### Description
Replacing an API key or encryption key immediately — deleting the old key and activating the new key in a single step — causing all clients with cached keys to fail authentication.

### Why It Happens
Developers treat key rotation like changing a password: old password stops working, new password starts. They assume all clients can be updated atomically. In practice, API keys are cached by clients (SDKs, mobile apps, third-party integrations), distributed across services, and stored in configuration that refreshes asynchronously. Immediate replacement guarantees disruption for any client that has not yet received the new key.

### Warning Signs
- Rotation script or process replaces the key in `config/services.php` directly without dual-validity
- No `previous_key` or `old_key` storage in the rotation workflow
- After rotation, support tickets spike about "authentication failed" for external integrations
- Clients report 401 errors after a scheduled maintenance window

### Why Harmful
Immediate rotation causes cascading failures: queued jobs fail because they hold the old key, mobile app users are locked out until they re-login, third-party integrations stop working until re-configured. For API key rotation, this is a production incident. For APP_KEY rotation, this also means all existing encrypted data becomes permanently undecryptable — sessions invalidated, encrypted columns unreadable, signed URLs broken.

### Real-World Consequences
- Scheduled key rotation at 2 AM causes 30-minute production outage for all API clients
- Mobile app users unable to authenticate for 24 hours (app caches old key until next launch)
- Third-party partner integration broken for days (requires manual key exchange)
- Emergency rollback to old key needed, but old key was immediately deleted — data loss

### Preferred Alternative
Implement a grace period where both old and new keys are valid simultaneously:
```php
class ApiKeyValidator
{
    public function validate(string $key): bool
    {
        return $key === config('services.current_api_key')
            || $key === config('services.previous_api_key');
    }

    public function isPreviousKeyExpired(): bool
    {
        return now()->greaterThan(config('services.previous_key_expires_at'));
    }
}
```

### Refactoring Strategy
1. Implement dual-validity storage (current key + previous key with expiry)
2. On rotation: generate new key, set as current, move old key to previous with 24h grace period
3. Monitor old key usage during grace period — alert if traffic persists near expiry
4. After grace period expires, revoke old key
5. For emergency (compromise): use 1-hour grace period instead of zero

### Detection Checklist
- [ ] Review rotation script — does it support dual-validity (old + new)?
- [ ] After a test rotation, can clients still authenticate with the old key?
- [ ] Is there a grace period configuration (default 24 hours)?
- [ ] Monitor: are there automated alerts for clients still using the old key?

### Related Rules/Skills/Trees
- Implement a Key Rotation Artisan Command (05-rules.md)
- Use a Dual-Key Approach During Rotation (Read Old, Write New) (05-rules.md)
- Rotation Strategy decision tree (07-decision-trees.md)

---

## 2. Manual Rotation Without Automation

### Category
Process · Reliability

### Description
Relying on manual steps for key rotation — running commands by hand, updating configs manually, and remembering to rotate on schedule — leading to skipped rotations, inconsistent procedures, and human error.

### Why It Happens
Key rotation is infrequent (annually at most) so automation seems unnecessary. The team writes a one-page document with steps and assigns rotation to a specific person. Over time, that person leaves, the document becomes stale, and the rotation is forgotten or performed incorrectly. Each rotation becomes a high-stress, high-risk manual operation.

### Warning Signs
- Key rotation requires SSH access to production servers and manual commands
- Rotation is tracked in a calendar reminder (not a scheduled task)
- Team dreads "rotation week" — it requires coordination across multiple people
- Last rotation was missed (actual date vs scheduled date gap)
- Each rotation produces different results (inconsistent process)

### Why Harmful
Manual rotation is unreliable. Humans forget, make mistakes, and skip steps under pressure. The most common error is changing APP_KEY without re-encrypting data — permanent data loss. Compliance requirements (PCI DSS 3.6.1, SOC2) require documented and tested key rotation. Manual processes do not provide audit evidence of consistent rotation. Automation ensures rotation happens on schedule, the same way every time, with logging for compliance.

### Real-World Consequences
- Annual APP_KEY rotation forgotten for 2 consecutive years — compliance audit failure
- Developer manually edits `.env` instead of running rotation script — all encrypted data lost
- Manual rotation script run on the wrong server — staging key overwritten on production
- Key rotation documented but the person who wrote it left the company — nobody can execute it

### Preferred Alternative
Create an automated, scheduled Artisan command for key rotation:
```bash
# Schedule: run annually via cron or CI/CD pipeline
0 2 1 1 * php /var/www/artisan key:rotate --env=production
```
```php
// Artisan command handles: decrypt all with old key → update APP_KEY → re-encrypt with new key
public function handle(): int
{
    $this->info('Starting key rotation...');
    // Log rotation start
    // Re-encrypt all encrypted data
    // Verify decryption with new key
    // Log rotation complete
    return Command::SUCCESS;
}
```

### Refactoring Strategy
1. Audit all services with API keys — document current rotation method
2. Build an Artisan command for each key type (APP_KEY, service API keys)
3. Add rotation to the deployment pipeline or cron schedule
4. Implement audit logging for each rotation (who ran it, when, result)
5. Test automated rotation in staging with production data copy
6. Document emergency rotation procedure (compromise scenario)

### Detection Checklist
- [ ] Is there a scheduled task/cron for key rotation?
- [ ] Search for `key:rotate` or similar Artisan commands
- [ ] Can the rotation be triggered without SSH access to production?
- [ ] Is each rotation logged with timestamp, result, and auditor?

### Related Rules/Skills/Trees
- Implement a Key Rotation Artisan Command (05-rules.md)
- Rotate APP_KEY at Least Once Every 12 Months (05-rules.md)
- Rotation Automation decision tree (07-decision-trees.md)

---

## 3. No Rollback Plan After Rotation

### Category
Reliability · Security

### Description
Rotating keys without a documented process for rolling back to the previous key if the rotation causes issues (unrecoverable data, client authentication failures, application errors).

### Why It Happens
Teams assume rotation will succeed — they test in staging and are confident. The rollback plan is "restore from backup" which is slow, complex, and risks data loss. The previous key is discarded immediately after rotation. When something goes wrong (some data was not re-encrypted, a microservice missed the update), the team discovers that rollback requires the old key — which is gone.

### Warning Signs
- Old key is deleted immediately after rotation completes
- No `key_versions` table or key history storage
- Rotation documentation has no "rollback" section
- Team's recovery plan is "restore the database from last night's backup" (last resort only)

### Why Harmful
Without a rollback plan, a failed rotation becomes a disaster. If new encrypted data cannot be decrypted, or if some data was missed during re-encryption, the only options are: restore from backup (data loss between backup and rotation time), accept the data loss, or reconstruct the old key (cryptographically infeasible). Rollback must be possible within minutes, not hours or days.

### Real-World Consequences
- Rotation script has a bug — 5% of records not re-encrypted — those records are now permanently lost
- Microservice still using old key cannot communicate — takes 2 days to update, data inaccessible during that time
- Emergency rollback attempted but old key was discarded — must restore full database from backup, losing 6 hours of transactions
- CISO requires mandatory rollback capability — team spends weeks building it after the incident

### Preferred Alternative
Maintain a key history that allows rollback within a configurable window:
```php
// Store previous keys encrypted in a key_versions table
KeyVersion::create([
    'key_identifier' => 'app_key',
    'key_value' => Crypt::encryptString($previousKey),
    'activated_at' => now(),
    'expires_at' => now()->addDays(30), // Rollback window
]);
```
Document a rollback procedure: restore old key from version history, re-encrypt data that was written with new key, verify decryption.

### Refactoring Strategy
1. Create a `key_versions` table or use secrets manager for key history
2. Before any rotation, backup the current key encrypted and timestamped
3. Document rollback procedure: which key to restore, which data to re-encrypt, verification steps
4. Test rollback in staging: force a rotation failure and execute the rollback
5. Set rollback window (30 days) after which old keys are purged

### Detection Checklist
- [ ] Is the previous key stored (encrypted) after rotation?
- [ ] Can the team rollback within 30 minutes while preserving all data?
- [ ] Is the rollback procedure documented and tested?
- [ ] Are old keys purged after a defined retention period?

### Related Rules/Skills/Trees
- Maintain a Key History for Rolling Back Rotations (05-rules.md)
- Test Key Rotation in a Staging Environment First (05-rules.md)
- Key Storage During Rotation decision tree (07-decision-trees.md)

---

## 4. Discarding Old Key Before Migration Complete

### Category
Security · Reliability

### Description
Deleting or revoking the old key immediately after generating the new key, before all data has been re-encrypted and all clients have migrated, making old data permanently unrecoverable if re-encryption was incomplete.

### Why It Happens
The rotation tool generates a new key and immediately switches the active configuration. The re-encryption of existing data is assumed to be atomic and instantaneous. In practice, re-encryption is a batch process that takes time (minutes for small datasets, hours or days for large ones). If the old key is discarded before all records are re-encrypted, any record still encrypted with the old key is permanently lost.

### Warning Signs
- Rotation script switches to the new key immediately, then starts re-encryption as a separate step
- No dual-read capability during rotation (application can only decrypt with the new key)
- Large dataset re-encryption (millions of records) started but old key deleted after 5 minutes
- No monitoring of re-encryption progress before key destruction

### Why Harmful
The window between key rotation and complete re-encryption is the most dangerous phase. If the application discards the old key, any record not yet re-encrypted becomes permanently undecryptable. For large databases, re-encryption can take hours. At scale, background jobs may fail silently, leaving a percentage of records perpetually inaccessible. This is permanent, irreversible data loss.

### Real-World Consequences
- 100K records not re-encrypted before old key deleted — all those users' data permanently lost
- Re-encryption batch job crashes at 80% completion — 20% of records now undecryptable
- Queued jobs from before rotation still hold data encrypted with old key — all fail after key deletion
- Legal liability: permanent loss of PII due to premature key destruction during rotation

### Preferred Alternative
Use a dual-key approach during rotation: old key for decrypting existing data, new key for encrypting new data. Only discard the old key after confirming all data has been successfully re-encrypted:
```php
public function get($model, $key, $value, $attributes) {
    try {
        return Crypt::decryptString($value); // Try new key
    } catch (DecryptException $e) {
        return Crypt::decryptString($value, $oldKey); // Fallback to old key
    }
}
```

### Refactoring Strategy
1. Implement dual-key decryption (try new key, fallback to old key)
2. Track re-encryption progress with a processed/not-processed flag on each record
3. Set a verification step: after re-encryption batch completes, verify zero records still encrypted with old key
4. Only then destroy/archive the old key
5. Add monitoring that alerts if old-key decryption fallback is used after expected migration window

### Detection Checklist
- [ ] After rotation, can the application still decrypt data encrypted with the old key?
- [ ] Is re-encryption tracked (count of records processed vs total)?
- [ ] Is there a verification step before old key destruction?
- [ ] How long does full re-encryption take? (hours? days? plan accordingly)

### Related Rules/Skills/Trees
- Use a Dual-Key Approach During Rotation (Read Old, Write New) (05-rules.md)
- Maintain a Key History for Rolling Back Rotations (05-rules.md)
- Key Storage During Rotation decision tree (07-decision-trees.md)

---

## 5. Same Key Across Environments

### Category
Security · Architecture

### Description
Using the same API key, APP_KEY, or encryption key in development, staging, and production environments, allowing cross-environment data compromise.

### Why It Happens
Development `.env` is copied to production for convenience. CI/CD pipelines inject the same key variable into all environments. Teams do not treat keys as environment-specific credentials. The convenience of one key to manage outweighs security considerations — until a breach occurs.

### Warning Signs
- `.env.production` and `.env.local` have identical `APP_KEY` or `STRIPE_SECRET`
- Deployment pipeline uses the same key variable for all environment stages
- Developer can decrypt production sessions locally using their local APP_KEY
- Staging database restored from production has decryptable data because keys are the same

### Why Harmful
Shared keys across environments mean that compromising the least secure environment (development laptops, staging servers) exposes the most sensitive environment (production). Development laptops are the most common attack vector — they have broad access, multiple tools, and lower security controls. A developer's local machine breach should not expose production data. With shared keys, it does.

### Real-World Consequences
- Developer laptop compromised — attacker extracts local `.env` with production `APP_KEY` — all production encrypted data decryptable
- Staging server has weaker security but shares production's Stripe API key — attacker pivots from staging to charge real credit cards
- Compliance audit finds same encryption key in all environments — fails data isolation requirement
- Developer accidentally commits `.env` to public repo — production key exposed even though it was "just the dev key"

### Preferred Alternative
Generate unique keys per environment and enforce separation:
```bash
# Each environment
php artisan key:generate  # Different key each time

# API keys: register separate keys per environment in the service provider's dashboard
# Production: sk_live_abc
# Staging: sk_test_xyz
# Development: sk_test_dev
```

### Refactoring Strategy
1. Generate new unique keys for staging and production environments
2. Register separate API keys/tokens in each external service dashboard
3. Update deployment pipeline to use environment-specific key variables
4. For APP_KEY: plan rotation window (will invalidate existing sessions and encrypted data)
5. Verify: decrypting a production session with staging key must fail

### Detection Checklist
- [ ] Compare `APP_KEY` values across all environment `.env` files — must all differ
- [ ] Check API key prefixes (`sk_live_` vs `sk_test_`) in each environment
- [ ] Verify a production database dump cannot be decrypted by the staging application
- [ ] Review CI/CD pipeline — does it inject different keys per environment?

### Related Rules/Skills/Trees
- Generate APP_KEY via `php artisan key:generate` for Every Environment (05-rules.md)
- Rotate APP_KEY at Least Once Every 12 Months (05-rules.md)
- Rotation Strategy decision tree (07-decision-trees.md)
