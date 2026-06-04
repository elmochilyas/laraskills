# 10.11 Connection String Management

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Connection Management & Pooling |
| Knowledge Unit ID | 10.11 |
| Knowledge Unit Title | Connection string management (environment variables, dynamic password rotation) |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 10.5 Dynamic connection config, 10.6 Connection purging |
| Last Updated | 2026-06-02 |

## Overview

Database connection strings (host, port, username, password, database) must be managed securely. Best practices include environment variables (never committed), secret manager integration (AWS Secrets Manager, HashiCorp Vault), and dynamic credential rotation. Laravel reads config from `env()` at boot. For runtime changes (password rotation), use `config()->set()` + `DB::purge()`. Connection strings that leak to version control or logs represent a critical security risk.

## Core Concepts

- **Environment variables**: `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` stored in `.env`. The `.env` file is never committed to version control. Laravel reads these at boot via `env()`.
- **Secret manager integration**: `config/database.php` reads from AWS Secrets Manager, Vault, or GCP Secret Manager at boot. Example: `DB_PASSWORD = json_decode(file_get_contents('http://localhost:2773/secrets/...'))->password`.
- **Runtime rotation**: Secrets manager updates the password. The application detects the change (via health check → reconnect failure), reads the new secret, applies it via `config()->set(...)`, and purges/reconnects.
- **Database URL**: The `DATABASE_URL` environment variable specifies all connection parameters in a single string: `mysql://user:pass@host:3306/db`. Parsed in `config/database.php`. Simpler than individual env vars.
- **Per-tenant connection strings**: In multi-tenant DB-per-tenant architectures, each tenant has their own connection string. These are stored in the central database (encrypted) and set dynamically via `config()->set()`.

## When To Use

- Every production application — environment variables are mandatory, not optional
- Applications requiring database credential rotation without downtime
- Multi-tenant applications with per-tenant databases
- Sharded databases with per-shard connection strings
- CI/CD environments where database credentials vary per environment

## When NOT To Use

- Single-developer local development (`.env` is sufficient, no secrets manager needed)
- Read-only database replicas accessed via IAM roles (e.g., RDS IAM auth)
- Serverless databases where connection management is abstracted (PlanetScale, Neon, Aurora Serverless)

## Best Practices

- **Never hardcode database credentials**: All connection parameters must come from environment variables or a secrets manager. **Why**: Hardcoded credentials in committed code are a critical security vulnerability. Anyone with repository access can read them. Environment variables keep credentials outside the codebase.
- **Use `DATABASE_URL` for simplicity**: Replace individual `DB_HOST`, `DB_PORT`, etc., with a single `DATABASE_URL` environment variable. **Why**: A single `DATABASE_URL` reduces configuration surface area, prevents copy-paste errors between config values, and is a standardized format across many frameworks and tools.
- **Implement credential rotation without downtime**: When the database password changes, update the secret in the secrets manager, then call `config()->set('database.connections.mysql.password', $newPassword)` followed by `DB::purge('mysql')` and `DB::reconnect('mysql')`. **Why**: Zero-downtime credential rotation prevents application restarts during password changes. This is critical for compliance (some regulations require periodic credential rotation).
- **Encrypt credentials at rest**: If storing per-tenant connection strings in the database, use Laravel's encryption (`Crypt::encryptString()`). **Why**: The central database becomes a high-value target. Encrypted credentials ensure that even a database breach doesn't expose raw credentials.
- **Validate connection strings before use**: When switching to a new connection dynamically, test the connection (`SELECT 1`) before using it for real queries. **Why**: A bad connection string (wrong password, unreachable host) should be caught early with a clear error message, not in the middle of a request.

## Architecture Guidelines

- **Simple deployments**: 5–6 environment variables (`DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`). Optionally `DATABASE_URL` for simplicity.
- **Secrets manager integration**: AWS Secrets Manager sidecar (ECS/EKS) or Vault agent fetches secrets and writes them to a shared temp file. Laravel reads from the file. Secret rotation updates the file, and the application detects the change on next config load.
- **Multi-tenant connection strings**: Each tenant has a record in the central `tenants` table with encrypted `host`, `port`, `database`, `username`, `password`. A middleware resolves the tenant, decrypts the credentials, and sets the dynamic connection.
- **Sharded connection strings**: Each shard has its own connection string in a configuration service (consul, etcd, or a database table). Models resolve their shard ID and load the appropriate connection config.
- **Failover connection strings**: The primary connection string is configured normally. A secondary (failover) host is pre-configured but not activated. On failure, the application updates the host config and reconnects.

## Performance Considerations

- Reading from environment variables at boot is free (in-memory).
- Reading from secrets manager at boot adds 20–200ms depending on the provider.
- Runtime credential rotation adds purge/reconnect latency (1–50ms) but only during rotation events.
- For high-traffic applications, cache secret manager results locally with a TTL (e.g., 5 minutes) to avoid fetching secrets on every connection switch.
- Decrypting per-tenant credentials adds <1ms overhead per request.

## Security Considerations

- **Never log connection strings**: Database URLs contain passwords. Ensure logging configuration masks or redacts connection parameters.
- **Use IAM-based auth where possible**: RDS IAM authentication, GCP Cloud SQL IAM, or Azure Managed Identity eliminate the need to manage database passwords.
- **Restrict `.env` file permissions**: In production, `.env` should be readable only by the web server user (`chmod 600` or `640`).
- **Rotate credentials regularly**: Automated rotation (AWS Secrets Manager auto-rotation, Vault dynamic secrets) reduces the window of exposure for compromised credentials.
- **Audit connection string access**: Log when connection strings are read from the secrets manager or when per-tenant credentials are decrypted.

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|-------------|-------|-------------|----------------|
| 1 | Hardcoded credentials in config/database.php | Committing raw credentials | Security breach if repo is exposed | Use `env()` or secrets manager |
| 2 | Logging connection strings | Debug logging includes config dump | Passwords exposed in log files | Redact sensitive config values before logging |
| 3 | Not purging after runtime credential change | `config()->set()` without `DB::purge()` | Old (inactive) credentials used; reconnect fails | Always purge after credential changes |
| 4 | Storing tenant credentials unencrypted | Plaintext in tenants table | DB breach exposes all tenant credentials | Encrypt credentials with Crypt::encryptString() |
| 5 | `.env` file committed to git | Accidentally included in initial commit | Credentials in git history forever | Add `.env` to `.gitignore`, use `.env.example` |

## Anti-Patterns

- **Single `.env` for multi-environment**: Using the same `.env` file across development, staging, and production. Each environment should have its own `.env` with environment-specific credentials.
- **Config files with hardcoded fallbacks**: `'password' => env('DB_PASSWORD', 'root')` — the fallback 'root' is often used accidentally in production when the env var is not set.
- **Connection strings in application code**: Writing `new PDO('mysql:host=...')` directly in application code instead of using Laravel's config system.
- **Stale credentials in cache**: Caching database config in `config:cache` that includes credentials. If credentials rotate, the cached config is stale until the cache is cleared.

## Examples

```php
// config/database.php — Using DATABASE_URL
$url = parse_url(env('DATABASE_URL'));

return [
    'default' => env('DB_CONNECTION', 'mysql'),
    'connections' => [
        'mysql' => [
            'driver' => 'mysql',
            'host' => $url['host'] ?? env('DB_HOST', '127.0.0.1'),
            'port' => $url['port'] ?? env('DB_PORT', '3306'),
            'database' => ltrim($url['path'] ?? '', '/') ?: env('DB_DATABASE'),
            'username' => $url['user'] ?? env('DB_USERNAME'),
            'password' => $url['pass'] ?? env('DB_PASSWORD'),
            // ...
        ],
    ],
];

// Runtime credential rotation
class CredentialRotator
{
    public function rotate(string $connectionName): void
    {
        $secret = SecretsManager::getSecret('database/'.$connectionName);

        config([
            "database.connections.{$connectionName}.username" => $secret['username'],
            "database.connections.{$connectionName}.password" => $secret['password'],
        ]);

        DB::purge($connectionName);

        try {
            DB::reconnect($connectionName);
            DB::connection($connectionName)->select('SELECT 1');
            Log::info('Credential rotation successful', ['connection' => $connectionName]);
        } catch (QueryException $e) {
            Log::critical('Credential rotation failed', [
                'connection' => $connectionName,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
```

## Related Topics

- **Prerequisites**: 10.1 Connection lifecycle, Laravel config system, environment variables
- **Closely Related**: 10.5 Dynamic connection config, 10.6 Connection purging and reconnection
- **Advanced**: Secrets manager integration (AWS Secrets Manager, Vault, GCP Secret Manager), IAM database auth
- **Cross-Domain**: Deployment configuration, CI/CD secrets management, 5.21 Tenant billing/credential isolation

## AI Agent Notes

- Hardcoded credentials are the most common security finding in Laravel codebases — always flag them
- Recommend `DATABASE_URL` for simpler credential management
- Credential rotation without purge is a no-op — the old credentials stay cached
- For multi-tenant, encrypt per-tenant credentials in the central database
- IAM-based auth (RDS IAM) is preferred over password-based auth where available

## Verification

- [ ] All database credentials come from environment variables or secrets manager
- [ ] `.env` file is in `.gitignore` and not committed
- [ ] No hardcoded credentials in any committed file
- [ ] Credential rotation flow is implemented and tested (config-set → purge → reconnect)
- [ ] Per-tenant credentials are encrypted at rest in the database
- [ ] Connection strings are never logged (redacted in log config)
- [ ] `.env` file permissions are restricted (600 or 640)
- [ ] DATABASE_URL is used as single-source-of-truth where possible
