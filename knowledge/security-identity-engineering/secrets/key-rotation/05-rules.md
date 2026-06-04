# Rules: Key Rotation

## Implement a Key Rotation Artisan Command
---
## Category
Architecture
---
## Rule
Create a dedicated `php artisan key:rotate` command that re-encrypts all encrypted data with a new key. Never change `APP_KEY` manually.
---
## Reason
Laravel has no built-in key rotation. Manually changing `APP_KEY` without a rotation script destroys all encrypted data. A command that reads, decrypts (with old key), updates config, re-encrypts (with new key), and writes ensures data survival through rotation.
---
## Bad Example
```bash
# Changed APP_KEY manually — all encrypted data unrecoverable
```
---
## Good Example
```php
// Artisan command: key:rotate
public function handle() {
    // Step 1: Iterate all models with encrypted columns
    User::whereNotNull('ssn')->chunk(100, function ($users) {
        foreach ($users as $user) {
            $plaintext = Crypt::decryptString($user->getRawOriginal('ssn'));
            // Step 2: The model's encrypted cast uses the new APP_KEY on save
            $user->ssn = $plaintext;
            $user->save();
        }
    });
    $this->info('Key rotation complete');
}
```
---
## Exceptions
No common exceptions — key rotation requires a data migration command.
---
## Consequences Of Violation
Permanent data loss on key change.
---

## Rotate APP_KEY at Least Once Every 12 Months
---
## Category
Security
---
## Rule
Establish a schedule for rotating `APP_KEY` at least annually. Rotate immediately if there is any suspicion of compromise.
---
## Reason
Long-lived encryption keys increase the blast radius of a key compromise. If the `APP_KEY` is leaked (via a stolen `.env` file, server breach, or CI/CD exposure), all encrypted data is decryptable. Regular rotation limits the window of exposure and complies with security standards (PCI-DSS, SOC2).
---
## Bad Example
```bash
# APP_KEY unchanged since application creation — 5 years ago
```
---
## Good Example
```bash
# Scheduled annual rotation
0 2 1 1 * php /var/www/artisan key:rotate
```
---
## Exceptions
No common exceptions — annual key rotation is a security standard.
---
## Consequences Of Violation
Extended exposure window if key is compromised.
---

## Test Key Rotation in a Staging Environment First
---
## Category
Testing
---
## Rule
Run the key rotation script in a staging environment with a copy of production data before applying it to production.
---
## Reason
Key rotation is a high-risk operation — a bug in the script can permanently destroy encrypted data. Staging testing validates that all encrypted fields are properly handled and the rotation command works correctly across all model types.
---
## Bad Example
```bash
# Run key rotation directly in production — no staging test
```
---
## Good Example
```bash
# Step 1: Copy encrypted data to staging
# Step 2: Run php artisan key:rotate
# Step 3: Verify data is decryptable
# Step 4: Run in production
```
---
## Exceptions
No common exceptions — key rotation must always be tested first.
---
## Consequences Of Violation
Permanent data loss from untested rotation script.
---

## Maintain a Key History for Rolling Back Rotations
---
## Category
Architecture
---
## Rule
Store previous `APP_KEY` values (encrypted or in a secure store) with the date they were active. Use a `key_versions` table or secrets manager.
---
## Reason
If a key rotation causes unforeseen issues (some data was not re-encrypted, a microservice still uses the old key), a rollback requires the previous key. Without a key history, rollback is impossible and data may be permanently lost.
---
## Bad Example
```bash
# Old APP_KEY discarded after rotation — rollback impossible
```
---
## Good Example
```php
// Record key version
KeyVersion::create([
    'key' => Crypt::encryptString($newKey),
    'activated_at' => now(),
]);
```
---
## Exceptions
No common exceptions — key history enables safe rollback.
---
## Consequences Of Violation
Permanent data loss if rollback is needed.
---

## Use a Dual-Key Approach During Rotation (Read Old, Write New)
---
## Category
Architecture
---
## Rule
During rotation, configure the application to decrypt with the old key and encrypt with the new key. Perform the migration in batches.
---
## Reason
A rotation that immediately switches all operations to the new key may fail if the old data has not been re-encrypted yet. A dual-key approach (old key for read, new key for write) allows gradual migration without service interruption. Laravel's `encrypted` cast does not support this natively, so a custom cast is needed.
---
## Bad Example
```php
// Switch all encryption to new key immediately — old data unreadable during migration
config(['app.key' => $newKey]);
```
---
## Good Example
```php
// Custom cast that tries new key first, falls back to old key
public function get($model, $key, $value, $attributes) {
    try {
        return Crypt::decryptString($value); // New key
    } catch (DecryptException $e) {
        return Crypt::decryptString($value, $oldKey); // Old key fallback
    }
}
```
---
## Exceptions
No common exceptions — dual-key approach enables zero-downtime rotation.
---
## Consequences Of Violation
Service disruption during key rotation.
---

## Monitor for Decryption Failures After Rotation
---
## Category
Monitoring
---
## Rule
Monitor application logs for `DecryptException` after a key rotation. Set up an alert for any decryption failures.
---
## Reason
Increased decryption failures after rotation indicate that some data was encrypted with an unexpected key (missed re-encryption, leftover cached values, queued jobs). Early detection prevents data loss and allows prompt recovery.
---
## Bad Example
```php
// Decryption failures silently logged — no alert
```
---
## Good Example
```php
// Exception handler
public function register(): void {
    $this->reportable(function (DecryptException $e) {
        if (app()->isProduction()) {
            Alert::critical('Decryption failures detected — key rotation issue');
        }
    });
}
```
---
## Exceptions
No common exceptions — monitoring decryption failures is critical after rotation.
---
## Consequences Of Violation
Undetected decryption failures, silent data loss.
