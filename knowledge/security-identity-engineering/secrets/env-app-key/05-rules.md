# Rules: ENV and APP_KEY Management

## Generate APP_KEY via php artisan key:generate for Every Environment
---
## Category
Security
---
## Rule
Run `php artisan key:generate` for every environment (local, staging, production). Never copy the same APP_KEY across environments.
---
## Reason
Each environment should have a unique APP_KEY so that encrypted data from one environment cannot be decrypted in another. Copying the local key to production means anyone with access to the local `.env` can decrypt production data. This also includes session data, cookie values, and encrypted columns.
---
## Bad Example
```bash
# Copied .env from local to production — same APP_KEY everywhere
```
---
## Good Example
```bash
# Generate unique key per environment
php artisan key:generate
```
---
## Exceptions
No common exceptions — unique keys per environment are mandatory.
---
## Consequences Of Violation
Encrypted data from production decryptable with local key.
---

## Never Commit .env to Version Control
---
## Category
Security
---
## Rule
Add `.env` to `.gitignore` and never commit it. Use `.env.example` with placeholder values as a template.
---
## Reason
`.env` contains secrets (DB credentials, API keys, APP_KEY). Committing it to version control exposes these secrets to everyone with repository access. Even private repositories are cloned to developer machines and CI systems, broadening exposure.
---
## Bad Example
```bash
# .env not in .gitignore — committed accidentally
```
---
## Good Example
```gitignore
# .gitignore
.env
```
---
## Exceptions
No common exceptions — .env must never be committed.
---
## Consequences Of Violation
All application secrets exposed in version control history.
---

## Store .env Outside the Web Root
---
## Category
Security
---
## Rule
Configure the application to load `.env` from a directory outside the web root (`/home/app/.env`). For Laravel, set the `--env` path in the server configuration or symlink.
---
## Reason
If the web server is misconfigured and serves the project root, `.env` files become publicly accessible via URL (e.g., `https://example.com/.env`). Storing `.env` outside the web root prevents this exposure even with misconfiguration.
---
## Bad Example
```dotenv
# .env in project root — accessible if web root is misconfigured
```
---
## Good Example
```dotenv
# .env stored at /home/app/secure/.env — outside web root
# Laravel: bootstrap/app.php loads from custom path
$app->useEnvironmentPath('/home/app/secure');
```
---
## Exceptions
No common exceptions — storing .env outside web root is a recommended hardening step.
---
## Consequences Of Violation
Sensitive data exposure through misconfigured web server.
---

## Use Production-Grade Secret Storage (Vault, Parameter Store) in Production
---
## Category
Architecture
---
## Rule
Replace `.env` with a secrets manager (HashiCorp Vault, AWS SSM Parameter Store, GCP Secret Manager) for production deployments. Use `.env` only for local development.
---
## Reason
`.env` is a flat file with no audit logging, access control granularity, or rotation support. Secrets managers provide encrypted storage, access policies, audit trails, and automatic rotation. If a production server is compromised, the attacker does not automatically get all secrets — only those accessible from that server.
---
## Bad Example
```php
// Production uses .env — all secrets in one file
'db_password' => env('DB_PASSWORD'),
```
---
## Good Example
```php
// Production uses Vault
'db_password' => Vault::secret('database/password')->get(),
```
---
## Exceptions
Small-scale deployments where secrets manager overhead is not justified — still encrypt .env at rest.
---
## Consequences Of Violation
All secrets exposed if production server is compromised.
---

## Use APP_KEY Changes Only With a Migration Plan
---
## Category
Security
---
## Rule
Never change `APP_KEY` without first re-encrypting all data encrypted with the old key. Document the key rotation process.
---
## Reason
Changing `APP_KEY` invalidates all encrypted data (encrypted columns, signed URLs, encrypted cookies, session data). Without re-encryption, data becomes permanently unrecoverable. A documented rotation plan prevents accidental data loss.
---
## Bad Example
```bash
# Changed APP_KEY — all encrypted data now unrecoverable
```
---
## Good Example
```php
// Step 1: Read and decrypt using old key
$records = User::all(['id', 'ssn']);
foreach ($records as $record) {
    $plaintext = Crypt::decryptString($record->getRawOriginal('ssn'));
    // Step 2: Update .env with new APP_KEY, clear config cache
    // Step 3: Re-encrypt with new key
    $record->ssn = $plaintext; // Cast handles re-encryption
    $record->save();
}
```
---
## Exceptions
No common exceptions — key rotation requires data migration.
---
## Consequences Of Violation
Permanent data loss, all encrypted data unrecoverable.
---

## Set APP_KEY Length and Format Correctly
---
## Category
Security
---
## Rule
Ensure `APP_KEY` is exactly a base64-encoded 32-byte (256-bit) random string generated by `key:generate`. The format is `base64:<base64_string>`.
---
## Reason
Laravel expects a 256-bit AES key encoded in base64 with a `base64:` prefix. A key of the wrong length causes the encryption to fail silently or produces weak encryption. The `key:generate` command produces a properly formatted key.
---
## Bad Example
```dotenv
APP_KEY=abc123  # Too short, no prefix
```
---
## Good Example
```dotenv
APP_KEY=base64:AbCdEf1234567890AbCdEf1234567890AbCdEf1234567890AbCdEf12==
```
---
## Exceptions
No common exceptions — correct key format is mandatory.
---
## Consequences Of Violation
Weak encryption, encryption failures, data corruption.
