# Anti-Patterns: HashiCorp Vault Integration

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Secrets Management |
| Knowledge Unit | HashiCorp Vault Integration |
| Audience | Architects, DevOps, Platform Engineers |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-SV-01 | Vault for Everything Including Non-Secrets | Medium | High | Medium |
| AP-SV-02 | No Vault Secret Caching (Per-Request Reads) | Critical | High | Low |
| AP-SV-03 | Shell Exec Instead of Client Library | Critical | Low | Low |
| AP-SV-04 | No Fallback When Vault Is Unavailable | Critical | Medium | Medium |
| AP-SV-05 | Long-Lived Root Token in Production | Critical | High | Medium |

---

## Repository-Wide Anti-Patterns

- **Vault Token in Version Control**: Vault authentication credentials stored in config files or `.env` — circular dependency (secrets manager's secrets in code)
- **Broad Wildcard Vault Policies**: Using `path "secret/*"` — compromised token exposes all vault secrets
- **No Audit Log Monitoring**: Vault audit logs enabled but never reviewed — unauthorized access undetected

---

## 1. Vault for Everything Including Non-Secrets

### Category
Architecture · Maintainability

### Description
Storing all configuration — including non-sensitive values like application name, feature flags, public settings — in Vault alongside actual secrets, adding unnecessary latency, complexity, and Vault load.

### Why It Happens
Teams adopt Vault and decide "we use Vault for everything" without discriminating between secrets and configuration. The operational overhead of Vault is justified only for secrets, but the migration effort is the same for all config values. Developers use Vault for everything because "that's what we set up." The distinction between configuration and secrets blurs.

### Warning Signs
- Vault stores non-sensitive values: `app_name`, `app_url`, `mail_from_address`, `pagination_size`
- Every page request requires a Vault read for non-secret configuration
- Vault latency (10-50ms) affects every config read, even for cache-busting feature flags
- Application cannot boot without Vault, even for non-secret configuration
- Vault policy has 50+ paths, most for non-sensitive values

### Why Harmful
Vault is operationally expensive: a dedicated server, maintenance, network latency (10-50ms per read), rate limits, and a single point of failure. Using Vault for non-secret configuration multiplies these costs unnecessarily. Every non-secret read is a wasted Vault operation that increases latency, risk (Vault outage), and operational complexity. Non-secret configuration belongs in `.env` or config files where it is simple, fast, and has zero external dependency.

### Real-World Consequences
- Vault outage takes down the entire application — including non-sensitive features like the homepage
- Vault rate limits hit during traffic spike — feature flags cannot be read, default values used incorrectly
- Application boot time is 5+ seconds because it reads 50 non-secret config values from Vault
- Operations team maintains Vault cluster for a single-server application with 10 non-secret values

### Preferred Alternative
Use Vault only for actual secrets (API keys, passwords, tokens, certificates). Use `.env` or config files for non-sensitive configuration:
```php
// Vault: only for secrets
config(['services.stripe.secret' => $vault->get('stripe/secret_key')]);

// Config files: for non-sensitive values
// config/app.php already handles app_name, app_url via .env
'name' => env('APP_NAME', 'Laravel'),
```

### Refactoring Strategy
1. Audit all Vault-prefixed config values — classify as "secret" or "configuration"
2. Move non-sensitive config back to `.env` and config files
3. Update Vault policies to remove non-secret paths
4. Remove Vault dependency from non-secret features
5. Verify application can boot without Vault for non-secret configuration

### Detection Checklist
- [ ] List all values read from Vault — which are actual secrets?
- [ ] Can the application start without Vault for configuration defaults?
- [ ] Are feature flags or public settings stored in Vault?
- [ ] What is the Vault read volume per request? (count of Vault calls)

### Related Rules/Skills/Trees
- Use a Client Library for Vault Access (Never Shell Exec) (05-rules.md)
- Cache Vault Secrets With a TTL and Refresh Gracefully (05-rules.md)
- Vault vs .env for Production Secrets decision tree (07-decision-trees.md)

---

## 2. No Vault Secret Caching (Per-Request Reads)

### Category
Performance · Security

### Description
Reading every secret directly from Vault on every HTTP request instead of caching secrets in Laravel's cache with a TTL, causing 10-50ms added latency per request and unnecessary Vault load.

### Why It Happens
The initial Vault integration reads secrets at application boot in a service provider — this is the correct pattern. However, as the application grows, secrets are read ad-hoc in controllers, middleware, and services. Each read triggers a Vault HTTP request. Developers do not implement caching because "Vault is the source of truth" — not realizing that reading on every request defeats the purpose of centralized secret management.

### Warning Signs
- Vault API request count closely matches application request count (1:1 ratio or higher)
- Response time for any page is consistently 50ms+ above expected baseline
- Vault server CPU correlates with application traffic
- Application code contains `$vault->get()` calls in middleware, controllers, or services
- No `Cache::remember()` or `cache()->remember()` around Vault reads

### Why Harmful
Each Vault read is an HTTP round-trip: 10-50ms of latency. For a page that reads 3 secrets (database password, API key, cache password), that is 30-150ms of Vault latency per request. Vault also has connection limits and rate limits — under load, per-request reads cause connection pool exhaustion, rate limiting, and cascading failures. Additionally, Vault costs scale with read volume (especially cloud KMS-based Vault). Caching reduces this to a single Vault read per cache TTL period.

### Real-World Consequences
- Response time increases from 50ms to 200ms after Vault integration — users notice the slowdown
- Vault server hits 500 connections under normal traffic — new requests timeout
- Vault rate limit reached during marketing campaign — application returns 500 errors
- Monthly Vault infrastructure cost doubles because reads scale with traffic

### Preferred Alternative
Cache secrets with a TTL matching the Vault lease duration:
```php
// Cache with TTL — one Vault call per cache period
$password = cache()->remember('vault:database:password', 300, function () use ($vault) {
    return $vault->read('secret/data/database')['data']['password'];
});
```
Or load all secrets at boot and inject into config (no per-request Vault calls):
```php
// AppServiceProvider::boot() — load once, cache in config
public function boot(): void
{
    config([
        'database.connections.mysql.password' => $vault->read('secret/data/database')['data']['password'],
    ]);
}
```

### Refactoring Strategy
1. Audit all Vault read calls — separate boot-time reads from request-time reads
2. Implement caching for all request-time reads using `cache()->remember()`
3. Set appropriate TTL based on secret rotation frequency (5-60 minutes)
4. Add cache warming for critical secrets (reload cache before expiry)
5. Monitor Vault read volume — verify reduction after caching implementation

### Detection Checklist
- [ ] Count Vault API calls per typical HTTP request
- [ ] Search for `$vault->get()`, `$vault->read()` in controllers, middleware, services
- [ ] Are secrets loaded at application boot (service provider) or on-demand?
- [ ] Is there a cache layer around Vault reads (Cache::remember pattern)?

### Related Rules/Skills/Trees
- Cache Vault Secrets With a TTL and Refresh Gracefully (05-rules.md)
- Implement Vault Connection Failure Fallback (05-rules.md)
- Vault vs .env for Production Secrets decision tree (07-decision-trees.md)

---

## 3. Shell Exec Instead of Client Library

### Category
Security · Reliability

### Description
Using PHP shell commands (`exec`, `shell_exec`) to run the Vault CLI for secret retrieval instead of using a PHP Vault client library, exposing secrets in process listings, shell history, and error logs.

### Why It Happens
The Vault CLI is well-documented and familiar to DevOps engineers. A quick shell command like `vault kv get secret/database` is simpler to implement than installing a PHP client library, configuring authentication, and handling the HTTP API. The CLI approach works in development and testing, so it "gets deployed" without realizing the security implications of server-side shell execution.

### Warning Signs
- Application code contains `exec('vault read ...')`, `shell_exec('vault kv get ...')`
- `vault` binary installed on application servers (should not be needed)
- Process listings on the server show Vault CLI commands with secret values in arguments
- Error logs contain Vault CLI output with plaintext secrets
- Shell injection vulnerability potential (arguments constructed from user input)

### Why Harmful
Shell commands leak the command and its arguments to the system process list — any user or process on the server can see `vault read -field=password secret/database` with the password in the output. Shell commands also log to shell history, syslog, and audit logs. The Vault CLI output goes to stdout — if an error occurs, the secret may appear in the error log. Additionally, constructing shell commands with dynamic arguments creates command injection vulnerabilities.

### Real-World Consequences
- Attacker with read-only server access runs `ps aux` and sees database passwords in Vault CLI arguments
- Error log aggregation service collects Vault CLI output with plaintext secrets — vendor support team sees credentials
- Shell injection via a user-controlled secret path — attacker reads all Vault secrets
- Compliance scan detects `exec()` calls with sensitive data — critical finding
- Server migration breaks because `vault` binary is not installed on the new server

### Preferred Alternative
Use a PHP Vault client library (HTTP API, in-process, no shell):
```php
// Using hashicorp/vault-php client library
$client = new \Vault\Client(new \Vault\AuthenticationProviders\TokenProvider($token));
$secret = $client->read('/secret/data/database');
$password = $secret['data']['data']['password'];
```

### Refactoring Strategy
1. Install a PHP Vault client library via Composer
2. Replace all `exec()` / `shell_exec()` Vault calls with client library calls
3. Remove the `vault` binary from application servers (kept on ops/admin machines only)
4. Implement error handling (client library throws exceptions, no shell output to capture)
5. Test secret retrieval without the Vault CLI installed

### Detection Checklist
- [ ] Search for `exec(`, `shell_exec(`, `system(`, `passthru(` followed by `vault` in codebase
- [ ] Is the `vault` binary installed on application servers? (should not be)
- [ ] Check process listings and logs for Vault CLI command appearances
- [ ] Verify a PHP Vault client library is installed

### Related Rules/Skills/Trees
- Use a Client Library for Vault Access (Never Shell Exec) (05-rules.md)
- Authenticate With Vault Using a Short-Lived Token (05-rules.md)
- Auth Method Selection decision tree (07-decision-trees.md)

---

## 4. No Fallback When Vault Is Unavailable

### Category
Reliability · Security

### Description
Not implementing any fallback or graceful degradation when Vault is unreachable, causing a complete application outage whenever the Vault server experiences downtime.

### Why It Happens
Vault is treated as an infrastructure component that "never goes down." The integration reads secrets at boot time, and if the read fails, the application crashes with an exception. No cached secret fallback, no health check, no graceful degradation. Teams do not plan for Vault maintenance windows, network partitions, or regional outages.

### Warning Signs
- Application throws `ConnectionException` or 500 error when Vault is unreachable
- No `try/catch` around Vault read calls
- No cached secrets available if Vault is down
- Deployment pipeline fails if Vault is temporarily unavailable during build
- No health check endpoint that verifies Vault connectivity independently

### Why Harmful
Vault is a single point of failure. If Vault is down for maintenance, network partition, or regional outage, the entire application becomes unavailable — even for features that do not need secrets (public pages, cached content). For production services targeting 99.9% uptime, Vault's availability becomes a hard dependency. Even with high-availability Vault clusters, network issues between the application and Vault can cause outages that a cache layer would survive.

### Real-World Consequences
- Scheduled Vault maintenance (announced) causes 30-minute application outage
- Network latency spike between app and Vault — all requests time out
- Vault cluster auto-failover causes 2-minute write-window — application crashes during this time
- Vault certificate expires — application cannot verify TLS connection, all requests fail
- Dependency chain: Vault down → no DB password → no database connection → 500 for all users

### Preferred Alternative
Implement a fallback strategy with cached secrets:
```php
try {
    cache()->forget('vault:database:password');
    $password = $vault->read('secret/data/database')['data']['password'];
} catch (ConnectionException $e) {
    Log::error('Vault unreachable, using cached secret', ['error' => $e->getMessage()]);
    $password = cache()->get('vault:database:password');
    if (!$password) {
        throw new RuntimeException('Vault unavailable and no cached secret available');
    }
}
// Also alert operations
if (isset($e)) {
    Alert::critical('Vault connection failed — using stale cache');
}
```

### Refactoring Strategy
1. Wrap all Vault reads in try/catch with fallback to cache
2. Ensure secrets are cached with a TTL longer than typical Vault maintenance windows
3. Add health check that reports Vault connectivity status (not application health)
4. Implement alerting: "Vault unavailable" is a warning, not a critical app failure
5. Document the degraded mode behavior (stale secrets may be minutes old)

### Detection Checklist
- [ ] Search for Vault read calls not wrapped in try/catch
- [ ] Are secrets cached with sufficient TTL to survive Vault downtime?
- [ ] What happens when Vault is unreachable? (application crash or graceful fallback?)
- [ ] Is Vault connectivity monitored as a separate health check?

### Related Rules/Skills/Trees
- Implement Vault Connection Failure Fallback (05-rules.md)
- Cache Vault Secrets With a TTL and Refresh Gracefully (05-rules.md)
- Vault vs .env for Production Secrets decision tree (07-decision-trees.md)

---

## 5. Long-Lived Root Token in Production

### Category
Security · Critical

### Description
Using a Vault root token or a long-lived static token for production authentication instead of a short-lived token with automated auth (AppRole, Kubernetes, AWS IAM), exposing all Vault secrets if the token is compromised.

### Why It Happens
Root tokens are the default when setting up Vault — the initial root token is used for all operations. Teams do not configure AppRole or platform auth methods because the root token "works fine." The token is stored in `.env` as `VAULT_TOKEN=...` and treated as just another configuration value. Token rotation is manual and forgotten. The root token has no expiration and grants full access to every secret.

### Warning Signs
- `VAULT_TOKEN` in `.env` contains a `hvs.` root token format
- Vault policy allows `path "*"` for the application token
- No token renewal or re-authentication logic in the application
- Vault audit logs show the same token for months without rotation
- Token stored in version control or shared team documentation

### Why Harmful
A root token grants unrestricted access to all Vault secrets, policies, and configuration. If compromised, the attacker can read, modify, or delete every secret in Vault. There is no blast radius limitation — the token is Vault super-admin. Long-lived tokens compound this risk because they remain valid indefinitely. Developers may store them in multiple places (`.env`, CI/CD variables, password managers, documentation), increasing exposure surface.

### Real-World Consequences
- Developer laptop compromised — `VAULT_TOKEN` in local `.env` gives attacker full Vault admin access
- CI/CD pipeline breached — root token from build environment exposes all production secrets
- Token committed to GitHub in a config file — 5 seconds later, automated scanners grab it
- Former employee still has the root token — accesses Vault months after departure
- Compliance audit: "Vault uses root token — no access control, no token rotation"

### Preferred Alternative
Use short-lived tokens with automated authentication method:
```php
// AppRole: short-lived token with automated renewal
$client->auth->loginByAppRole($roleId, $secretId);
// Token expires in 1 hour, Vault client handles renewal

// Kubernetes auth: token from service account, automatically rotated
$client->auth->loginByKubernetes($jwt, $role);
```
Store only the AppRole `role_id` and `secret_id` (or Kubernetes service account JWT) in environment variables — never the Vault token itself.

### Refactoring Strategy
1. Create a non-root Vault policy with least-privilege access for the application
2. Configure AppRole auth method (or platform auth) for the application
3. Generate a short-lived token using the new auth method
4. Remove the root token from application configuration
5. Test: try to access a secret path not in the application policy — must be denied
6. Rotate the root token (rekey Vault if necessary — root token should be sealed away)

### Detection Checklist
- [ ] Check `VAULT_TOKEN` value in production — does it start with `hvs.`? Can it be base64-decoded to a root token?
- [ ] Is AppRole, Kubernetes auth, or AWS IAM auth configured?
- [ ] Does the Vault token have an expiration time?
- [ ] What Vault policy is attached to the application token? (`path "*"` is a red flag)

### Related Rules/Skills/Trees
- Authenticate With Vault Using a Short-Lived Token (05-rules.md)
- Restrict Vault Policies to the Minimum Necessary Paths (05-rules.md)
- Auth Method Selection decision tree (07-decision-trees.md)
