# Rules: Vault Integration

## Use a Client Library for Vault Access (Never Shell Exec)
---
## Category
Security
---
## Rule
Use a PHP Vault client library (e.g., `hashicorp/vault-php` or custom HTTP client) to interact with Vault. Never use `exec('vault read ...')` or shell commands.
---
## Reason
Shell commands leak secrets in process lists, error logs, and shell history. A client library communicates with Vault's HTTP API, keeping secrets in application memory. Shell commands also introduce command injection risk if arguments are not sanitized.
---
## Bad Example
```php
$password = exec('vault kv get -field=password secret/database'); // Secret in process list
```
---
## Good Example
```php
$client = new \Vault\Client(new \Vault\AuthenticationProviders\TokenProvider($token));
$secret = $client->read('/secret/data/database');
$password = $secret['data']['data']['password'];
```
---
## Exceptions
No common exceptions — client libraries are always preferred over shell commands.
---
## Consequences Of Violation
Secrets exposed in process listings, shell logs, and command injection risk.
---

## Authenticate With Vault Using a Short-Lived Token
---
## Category
Security
---
## Rule
Use a short-lived Vault token (1 hour or less) for authentication. Use Kubernetes auth, AWS IAM auth, or AppRole for automated token renewal. Never use a root token or long-lived token.
---
## Reason
A compromised long-lived Vault token grants access to all secrets in the policy. Short-lived tokens limit the blast radius. Auth methods like Kubernetes auth or AWS IAM auth automate token lifecycle without human interaction.
---
## Bad Example
```php
$client = new \Vault\Client('https://vault.example.com');
$client->setToken('hvs.abc...'); // Long-lived token — risk if leaked
```
---
## Good Example
```php
// Use Kubernetes auth for automatic short-lived token
$client->authenticate(new \Vault\AuthenticationProviders\KubernetesProvider(
    jwt: file_get_contents('/var/run/secrets/kubernetes.io/serviceaccount/token'),
    role: 'myapp'
)); // Token is short-lived and automatically renewed
```
---
## Exceptions
No common exceptions — short-lived tokens with automated auth are standard.
---
## Consequences Of Violation
Long-lived token compromise exposes all accessible secrets.
---

## Cache Vault Secrets With a TTL and Refresh Gracefully
---
## Category
Performance
---
## Rule
Cache secrets retrieved from Vault in Laravel's cache (Redis, database) with a TTL matching the secret's lease duration. Refresh on cache miss, not on every request.
---
## Reason
Vault has rate limits and network latency. Reading a secret from Vault on every request is slow and may hit Vault's rate limit. Caching with the lease TTL reduces Vault load and speeds up application requests. On cache expiry, the next request refreshes from Vault.
---
## Bad Example
```php
// Vault request on every API call
$password = $vault->read('secret/database')['data']['password'];
```
---
## Good Example
```php
// Cache with TTL matching Vault lease
$password = cache()->remember('vault:database:password', 1800, function () use ($vault) {
    return $vault->read('secret/database')['data']['password'];
});
```
---
## Exceptions
Secrets that change frequently (short-lived dynamic secrets) — reduce cache TTL accordingly.
---
## Consequences Of Violation
Unnecessary Vault load, latency on every request.
---

## Implement Vault Connection Failure Fallback
---
## Category
Reliability
---
## Rule
Implement a fallback strategy for Vault connection failures: use cached secrets (if available), log the failure, and alert operations. Never crash or return 500 for all requests because Vault is unreachable.
---
## Reason
Vault is a critical dependency — if Vault is down, every request that needs a Vault secret will fail. Cached secrets (even stale) keep the application running during Vault outages. Logging and alerting notify operations to investigate.
---
## Bad Example
```php
// Vault down → exception on every request → 500 for all users
$secret = $vault->read('secret/database');
```
---
## Good Example
```php
try {
    cache()->forget('vault:database:password');
    $secret = $vault->read('secret/database');
} catch (ConnectionException $e) {
    Log::error('Vault unreachable', ['error' => $e->getMessage()]);
    $secret = cache()->get('vault:database:password'); // Use stale cache
    if (!$secret) {
        throw new \RuntimeException('Vault unavailable and no cached secret');
    }
}
```
---
## Exceptions
No common exceptions — Vault failures must not cause application-wide outage.
---
## Consequences Of Violation
Application-wide outage when Vault is unavailable.
---

## Use Vault's Dynamic Database Secrets, Not Static Credentials
---
## Category
Security
---
## Rule
Configure Vault to generate dynamic database credentials (short-lived, per-application-instance). Avoid using Vault as a static password store.
---
## Reason
Dynamic credentials have a limited lifetime (hours) and are unique per instance. If a database password is leaked from a compromised container, it expires automatically and is useless to the attacker. Static credentials, even stored in Vault, remain valid until manually rotated.
---
## Bad Example
```php
// Static password stored in Vault — leaked credential is valid indefinitely
$password = vault('secret/database')['password'];
```
---
## Good Example
```php
// Dynamic credential — short-lived, unique per instance
$creds = vault('database/creds/myapp')['username'];
// Password is valid for 1 hour, automatically revoked after lease expires
```
---
## Exceptions
Legacy systems that do not support dynamic credentials.
---
## Consequences Of Violation
Leaked static credential grants persistent database access.
---

## Restrict Vault Policies to the Minimum Necessary Paths
---
## Category
Security
---
## Rule
Define Vault policies that grant access only to specific secret paths needed by each application. Never use a wildcard policy. Use separate policies per environment.
---
## Reason
A broad Vault policy (`path "secret/*"`) means that if the application token is compromised, all secrets in Vault are accessible. Narrow policies limit the blast radius. Separate policies per environment prevent staging apps from accessing production secrets.
---
## Bad Example
```hcl
# Too broad — compromised token grants access to all secrets
path "secret/*" {
  capabilities = ["read"]
}
```
---
## Good Example
```hcl
# Narrow — only the specific secrets this app needs
path "secret/data/production/database" {
  capabilities = ["read"]
}
path "secret/data/production/redis" {
  capabilities = ["read"]
}
```
---
## Exceptions
No common exceptions — least-privilege Vault policies are essential.
---
## Consequences Of Violation
Broad policy grants access to secrets beyond the application's needs.
