# Rules: Immutable Audit Chains

## Append Audit Entries, Never Update or Delete
---
## Category
Architecture
---
## Rule
Design the audit log table as append-only. Never allow UPDATE, DELETE, or TRUNCATE operations on audit entries. Enforce this at the database level with triggers or restrictive permissions.
---
## Reason
An audit log that can be modified is not an audit log — it is a record that can be tampered with. True immutability ensures that once an event is recorded, it cannot be altered or erased. Database-level enforcement (revoke UPDATE/DELETE on the audit table from the application user) prevents accidental or malicious tampering.
---
## Bad Example
```php
// Application user can UPDATE or DELETE audit records
DB::table('audit_log')->where('id', $id)->delete(); // Tampering possible
```
---
## Good Example
```sql
-- Database-level enforcement: application user cannot modify audit table
REVOKE UPDATE, DELETE ON audit_log FROM app_user;
```
```php
// Application can only INSERT audit entries
DB::table('audit_log')->insert([...]); // Allowed
DB::table('audit_log')->where('id', $id)->delete(); // Denied at DB level
```
---
## Exceptions
Legitimate audit retention/privacy compliance (GDPR right to erasure) — implemented as a separate, audited process with legal approval.
---
## Consequences Of Violation
Audit logs can be tampered with, losing evidentiary value.
---

## Include a SHA-256 Hash of the Previous Entry (Blockchain-Style Chain)
---
## Category
Architecture
---
## Rule
Include a `previous_hash` column in the audit log table that stores the SHA-256 hash of the previous entry. Compute `current_hash` as `hash(previous_hash . entry_data)`.
---
## Reason
Chaining audit entries with hashes makes tampering detectable. Modifying an entry changes its hash, which breaks the chain for all subsequent entries. Any inconsistency in the hash chain proves tampering occurred and indicates which entry was modified.
---
## Bad Example
```php
// No chaining — individual entries can be modified without detection
```
---
## Good Example
```php
class AuditLogEntry extends Model {
    protected static function booted(): void {
        static::creating(function ($entry) {
            $previous = static::latest('id')->first();
            $previousHash = $previous?->current_hash ?? str_repeat('0', 64);
            $entry->previous_hash = $previousHash;
            $entry->current_hash = hash('sha256',
                $previousHash . $entry->event . $entry->properties . $entry->created_at
            );
        });
    }
}
```
---
## Exceptions
No common exceptions — hash chaining enables tamper detection.
---
## Consequences Of Violation
Tampering with audit entries is undetectable.
---

## Use a Separate Database User for Audit Log Writes
---
## Category
Architecture
---
## Rule
Configure a dedicated database user with INSERT-only privileges on the audit log table. The application's main database user should have no write access to the audit log table.
---
## Reason
If the application is compromised (SQL injection, RCE), the attacker gains the application's database credentials. If those credentials allow UPDATE/DELETE on the audit log, the attacker can cover their tracks. A separate INSERT-only user for audit logs limits the damage.
---
## Bad Example
```php
// Same DB user for all tables — can modify audit logs
'mysql' => [
    'username' => 'app_user', // Has UPDATE/DELETE on audit_log
];
```
---
## Good Example
```php
// Dedicated audit user with INSERT only
'mysql' => [
    'username' => 'app_user',
];
'audit' => [
    'driver' => 'mysql',
    'username' => 'audit_writer',
    // INSERT-only privileges on the audit_log table
];
```
---
## Exceptions
No common exceptions — separate credentials with limited privileges are essential.
---
## Consequences Of Violation
Compromised application can tamper with audit logs.
---

## Use Signed Audit Entries (HMAC) for Additional Integrity
---
## Category
Architecture
---
## Rule
Compute an HMAC-SHA256 signature for each audit entry using a dedicated HMAC key (not `APP_KEY`). Store the signature alongside the entry. Verify signatures during audit reviews.
---
## Reason
Hash chaining detects tampering only within the database. If an attacker gains access to the database and recalculates hashes after modification, they can hide tampering. HMAC with a separate signing key (not stored in the database) provides cryptographic proof of authenticity — even a database administrator cannot forge valid signatures.
---
## Bad Example
```php
// Hash only — DB admin can modify and recalculate hashes
```
---
## Good Example
```php
$entry->hmac = hash_hmac('sha256',
    $entry->event . $entry->properties . $entry->previous_hash,
    config('audit.signing_key') // Separate key, not in database
);
```
---
## Exceptions
No common exceptions — HMAC signing provides crypto-grade integrity.
---
## Consequences Of Violation
Database admin or attacker with DB access can forge audit entries.
---

## Back Up Audit Logs to Write-Once Storage
---
## Category
Architecture
---
## Rule
Stream audit log backups to write-once, read-many (WORM) storage (S3 Object Lock, Azure immutable blob storage, physical Write-Once media). Never store the only copy of audit logs in the primary database.
---
## Reason
If the primary database is compromised, deleted, or encrypted by ransomware, audit logs must survive independently. WORM storage ensures backups cannot be modified or deleted after the retention period begins.
---
## Bad Example
```php
// Audit logs only in the primary database — vulnerable to deletion
```
---
## Good Example
```php
// Stream audit logs to S3 with Object Lock
$schedule->call(function () {
    $logs = Activity::where('backed_up', false)->get();
    Storage::disk('s3-audit')->put(
        'audit/' . now()->toDateString() . '.json',
        $logs->toJson()
    );
    Activity::whereIn('id', $logs->pluck('id'))->update(['backed_up' => true]);
})->daily();
```
---
## Exceptions
No common exceptions — audit logs must survive database compromise.
---
## Consequences Of Violation
Audit logs permanently lost in database failure or ransomware attack.
---

## Monitor Hash Chain Integrity Periodically
---
## Category
Monitoring
---
## Rule
Run a scheduled job that verifies the hash chain integrity (recalculate hashes and compare with stored hashes). Alert on any mismatch.
---
## Reason
Hash chain integrity is only useful if verified. Without periodic verification, tampering may go unnoticed for months. An automated job that recalculates and compares the chain ensures immediate detection of any modification.
---
## Bad Example
```php
// Hash chain never verified — tampering undetected
```
---
## Good Example
```php
$schedule->call(function () {
    $entries = Activity::orderBy('id')->get();
    $previousHash = str_repeat('0', 64);
    foreach ($entries as $entry) {
        $expectedHash = hash('sha256', $previousHash . $entry->event . $entry->properties . $entry->created_at);
        if ($entry->current_hash !== $expectedHash) {
            Alert::critical('Audit log integrity violation detected', ['entry_id' => $entry->id]);
            return;
        }
        $previousHash = $entry->current_hash;
    }
    Log::info('Audit log chain integrity verified');
})->hourly();
```
---
## Exceptions
No common exceptions — periodic integrity verification is essential.
---
## Consequences Of Violation
Tampered audit logs go undetected for extended periods.
