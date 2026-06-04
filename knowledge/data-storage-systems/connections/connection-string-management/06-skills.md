# Skill: Manage Connection Strings Securely

## Purpose

Store, rotate, and apply database connection strings securely using environment variables, `DATABASE_URL`, secret manager integration, and runtime credential rotation with config-set + purge.

## When To Use

- Every production application — environment variables are mandatory
- Apps requiring credential rotation without downtime
- Multi-tenant apps with per-tenant databases
- Sharded databases with per-shard connection strings

## When NOT To Use

- Single-developer local development (`.env` is sufficient)
- Read-only replicas accessed via IAM roles
- Serverless databases with abstracted connection management

## Prerequisites

- Understanding of dynamic connection config (10-5)
- Understanding of connection purging (10-6)
- Laravel config system and environment variables

## Inputs

- Database credentials (host, port, database, username, password)
- `.env` file or secrets manager configuration
- Per-tenant credentials (for multi-tenant architectures)

## Workflow (numbered steps)

1. Store credentials in environment variables only:
   ```
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=myapp
   DB_USERNAME=myapp_user
   DB_PASSWORD=secret
   ```
   Never hardcode credentials in committed files.

2. Use `DATABASE_URL` for single-source-of-truth:
   ```
   DATABASE_URL=mysql://myapp_user:secret@127.0.0.1:3306/myapp
   ```
   Parse in `config/database.php`:
   ```php
   $url = parse_url(env('DATABASE_URL'));
   ```

3. Implement runtime credential rotation:
   ```php
   $secret = SecretsManager::getSecret('database/mysql');
   config([
       'database.connections.mysql.username' => $secret['username'],
       'database.connections.mysql.password' => $secret['password'],
   ]);
   DB::purge('mysql');
   DB::reconnect('mysql');
   ```

4. For per-tenant credentials, encrypt at rest:
   ```php
   config([
       'database.connections.tenant.password' => Crypt::decryptString($tenant->encrypted_password),
   ]);
   ```

5. Protect the `.env` file and never commit it:
   - Add `.env` to `.gitignore`
   - Use `.env.example` as template
   - Set file permissions to 600 or 640 in production

6. Validate connection strings before use:
   ```php
   DB::connection('tenant')->select('SELECT 1');
   ```

## Validation Checklist

- [ ] All database credentials come from environment variables or secrets manager
- [ ] `.env` file is in `.gitignore` and not committed
- [ ] No hardcoded credentials in any committed file
- [ ] Credential rotation flow is implemented (config-set → purge → reconnect)
- [ ] Per-tenant credentials are encrypted at rest
- [ ] Connection strings are never logged (redacted in log config)
- [ ] `.env` file permissions are 600 or 640
- [ ] DATABASE_URL used where possible

## Common Failures

- Hardcoded credentials in config/database.php — security breach
- Logging connection strings — passwords exposed in log files
- Not purging after credential change — old (inactive) credentials used
- Tenant credentials stored unencrypted — DB breach exposes all credentials
- `.env` committed to git — credentials in git history forever

## Decision Points

- Individual env vars vs DATABASE_URL
- Environment variables vs secrets manager
- Encrypted storage in DB vs external secret store
- IAM-based auth (passwordless) vs password-based auth

## Performance Considerations

- Reading env vars at boot: free (in-memory)
- Secret manager at boot: 20–200ms depending on provider
- Runtime credential rotation: purge/reconnect 1–50ms (rotation events only)
- Cache secret manager results locally with TTL

## Security Considerations

- Never log connection strings (database URLs contain passwords)
- Use IAM-based auth where possible (RDS IAM, GCP Cloud SQL IAM)
- Restrict `.env` file permissions (600 or 640)
- Rotate credentials regularly (automated rotation)
- Audit connection string access

## Related Rules

- 10-11-1: Never Hardcode Database Credentials
- 10-11-2: Use DATABASE_URL for Simplicity

## Related Skills

- Implement Dynamic Connection Config
- Purge and Reconnect Connections
- Configure Connection Encryption

## Success Criteria

- No hardcoded credentials in any committed file
- Credential rotation works without application restart
- Per-tenant credentials encrypted at rest
- Connection strings never appear in logs
- `.env` file properly protected and git-ignored
