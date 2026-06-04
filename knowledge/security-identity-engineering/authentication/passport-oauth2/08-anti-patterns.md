# Anti-Patterns: Passport OAuth2 Server

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | Passport OAuth2 Server |
| Audience | Architects, Developers |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-PO-01 | Exposed OAuth2 Private Key | Critical | Medium | Medium |
| AP-PO-02 | Active Password Grant | Critical | High | Medium |
| AP-PO-03 | Unpruned Token Tables | High | High | Low |
| AP-PO-04 | Broad Monolithic Scopes | High | High | Medium |
| AP-PO-05 | No Token Revocation on Security Events | Critical | Medium | High |

---

## Repository-Wide Anti-Patterns

- **Passport for First-Party Auth**: Using Passport's OAuth2 flow when Sanctum would suffice — unnecessary complexity
- **Missing PKCE for Public Clients**: Allowing authorization code flow without PKCE for SPAs and mobile apps
- **Long-Lived Access Tokens**: Setting access token expiry to days or weeks instead of minutes

---

## 1. Exposed OAuth2 Private Key

### Category
Security · Critical

### Description
Storing the OAuth2 RSA private key with insecure file permissions, in the web root, or committing it to version control, allowing token forgery.

### Why It Happens
The `php artisan passport:keys` command generates keys with default permissions that may be world-readable. Developers may not secure the key after generation. CI/CD pipelines may commit the key for deployment convenience.

### Warning Signs
- `storage/oauth-private.key` has permissions 644 or 655
- The private key file is accessible from the web server's document root
- `oauth-private.key` is tracked in git or included in source distributions
- Token validation succeeds for any user — indicates the key may be exposed

### Why Harmful
The OAuth2 private key signs all access tokens. Anyone with access to this key can forge valid access tokens for any user with any scope. This is a complete authentication bypass — the attacker does not need credentials or an authorization code. The private key is the root of trust for the entire OAuth2 system.

### Real-World Consequences
- Server compromise exposes private key — attacker forges admin tokens from any machine
- Developer commits private key to public repository — tokens forgeable by anyone
- Shared hosting environment allows other tenants to read the key
- Security audit finds private key readable by www-user — critical severity finding

### Preferred Alternative
Set 600 permissions on the private key, store outside the web root, and never commit to version control.

### Refactoring Strategy
1. Run `chmod 600 storage/oauth-private.key`
2. Move key outside web root if accessible from document root
3. Remove key from git history if committed (use `git filter-branch` or BFG Repo-Cleaner)
4. Add `oauth-private.key` to `.gitignore`
5. Rotate keys after securing: `php artisan passport:keys --force`

### Detection Checklist
- [ ] `ls -la storage/oauth-private.key` — check permissions
- [ ] Is the key accessible from the web root?
- [ ] `git ls-files | grep oauth-private` — is it tracked?
- [ ] Can the web server user read the key file?
- [ ] Is the key stored in CI/CD secrets or in the repository?

### Related Rules/Skills/Trees
- Secure OAuth2 Private Key With 600 Permissions Outside Web Root (05-rules.md)
- Configure Passport OAuth2 Server (06-skills.md)
- OAuth2 Grant Type Selection decision tree (07-decision-trees.md)

---

## 2. Active Password Grant

### Category
Security · Critical

### Description
Leaving the OAuth2 Password Grant enabled in production, where user credentials are sent to the client application and forwarded to the authorization server.

### Why It Happens
The Password Grant is the simplest OAuth2 flow to implement and is commonly used in tutorials. Teams that started with Passport before its deprecation may still have it configured. First-party mobile apps often use it for convenience.

### Warning Signs
- `grant_type=password` used in token requests
- Login API endpoint accepts username+password and returns tokens directly
- No Authorization Code + PKCE flow implemented
- `config/passport.php` still has Password Grant enabled

### Why Harmful
The Password Grant exposes the user's credentials to the client application. The client must handle plaintext passwords, introducing credential theft risk. It does not support MFA/2FA. It is deprecated in the OAuth2 specification and has been removed or disabled by default in recent Passport versions.

### Real-World Consequences
- Client application logs or stores passwords inadvertently — credential leak
- User cannot use MFA because Password Grant does not support it
- OAuth2 compliance audit fails due to deprecated grant type
- Third-party client integration impossible — Password Grant is for first-party only

### Preferred Alternative
Use Authorization Code + PKCE for user-facing applications and Client Credentials for M2M.

### Refactoring Strategy
1. Disable Password Grant in Passport configuration
2. Implement Authorization Code + PKCE flow for all user-facing clients
3. For first-party mobile apps, use Sanctum instead of Passport
4. Update mobile/SPA clients to use the new flow
5. Remove any password-collecting logic from client applications

### Detection Checklist
- [ ] Search for `grant_type' => 'password'` in the codebase
- [ ] Check if Password Grant is enabled in Passport config
- [ ] Review client applications — do they handle user passwords directly?
- [ ] Test token endpoint with `grant_type=password` — does it succeed?

### Related Rules/Skills/Trees
- Use PKCE for Public Clients (SPAs and Mobile Apps) (05-rules.md)
- Never Use Password Grant in Sanctum or Passport (05-rules.md)
- OAuth2 Grant Type Selection decision tree (07-decision-trees.md)

---

## 3. Unpruned Token Tables

### Category
Performance · Maintainability

### Description
Not scheduling regular pruning of expired access tokens, refresh tokens, and authorization codes, causing database tables to grow unboundedly.

### Why It Happens
Token pruning is an operational task easily forgotten. The `passport:purge` command is not part of the standard deployment or maintenance workflow. The performance degradation is gradual — unnoticed until it becomes a production problem.

### Warning Signs
- `oauth_access_tokens` table has millions of rows
- API response times are increasing due to slow token lookup queries
- Database size is growing faster than user growth
- No `passport:purge` entry in `App\Console\Kernel`
- Token introspection (checking token on each request) is slowing down

### Why Harmful
Passport checks token existence and revocation status on every authenticated API request. As token tables grow, these lookups slow down. Expired tokens are never used but still scanned. The database accumulates unnecessary rows, increasing backup sizes, query times, and storage costs.

### Real-World Consequences
- API response times degrade by hundreds of milliseconds due to bloated token tables
- Monthly database costs increase due to unnecessary token storage
- `SELECT * FROM oauth_access_tokens WHERE id = ?` query times out under load
- Emergency maintenance required to purge millions of expired tokens

### Preferred Alternative
Schedule `php artisan passport:purge` to run hourly in the console kernel.

### Refactoring Strategy
1. Add `$schedule->command('passport:purge')->hourly()` to `App\Console\Kernel`
2. Run `php artisan passport:purge` manually to clean existing tables
3. Monitor token table sizes after initial purge
4. Consider daily scheduling if the application has very high token throughput

### Detection Checklist
- [ ] Check `App\Console\Kernel` for passport:purge schedule
- [ ] `SELECT COUNT(*) FROM oauth_access_tokens WHERE expires_at < NOW()` — count expired tokens
- [ ] Monitor token table size in bytes
- [ ] Check database query performance for token validation

### Related Rules/Skills/Trees
- Schedule Token Pruning With passport:purge Command (05-rules.md)
- Token Lifetime Configuration decision tree (07-decision-trees.md)

---

## 4. Broad Monolithic Scopes

### Category
Architecture · Security

### Description
Defining scopes as broad role-based permissions (e.g., `admin`, `full-access`) instead of granular `resource.action` permissions.

### Why It Happens
Role-based thinking is natural — developers model scopes after roles they already have (admin, user, moderator). The OAuth2 scope model is designed for fine-grained permission delegation, but the analogy to roles is the path of least resistance.

### Warning Signs
- `Passport::tokensCan()` has scopes like `admin`, `user`, or `full-access`
- A third-party app requesting "read profile" gets access to "write orders"
- Users cannot selectively authorize permissions — it's all-or-nothing
- Scope names are single words without action/resource separation

### Why Harmful
Broad scopes defeat the purpose of OAuth2's delegated authorization model. A third-party app that only needs to read the user's email must receive a token that also grants write access to all resources. Users cannot make informed authorization decisions. The principle of least privilege is violated for every token.

### Real-World Consequences
- Third-party app with "read" scope can delete user data because scope is too broad
- Users grant full access to a simple calendar integration app
- Security review flags scopes as violating least privilege principle
- Compliance audit requires scope redesign before certification

### Preferred Alternative
Design scopes as granular `resource.action` permissions (e.g., `orders.read`, `orders.write`).

### Refactoring Strategy
1. Design a scope hierarchy based on actual API resources and operations
2. Replace broad scopes with granular ones via `Passport::tokensCan()`
3. Update route middleware to check specific scopes with `CheckScopes`
4. Communicate scope changes to third-party developers
5. Set a minimal default scope (`profile.read`) for backward compatibility

### Detection Checklist
- [ ] List all defined scopes in `Passport::tokensCan()`
- [ ] Do any scopes grant more than one distinct permission?
- [ ] Can a client request only "read orders" without getting "write orders"?
- [ ] Is there a scope named `admin`, `full-access`, or `all`?

### Related Rules/Skills/Trees
- Design Scopes as Granular Permissions, Not Broad Roles (05-rules.md)
- Scope Design Strategy decision tree (07-decision-trees.md)

---

## 5. No Token Revocation on Security Events

### Category
Security · Critical

### Description
Not revoking existing OAuth2 tokens when a user changes their password, logs out from all devices, or experiences a security incident.

### Why It Happens
Password change and security event flows often focus on the credential itself (hashing the new password) without considering active sessions. Developers may assume that changing the password invalidates tokens automatically — it does not in Passport.

### Warning Signs
- Password change endpoint updates the password but does not revoke tokens
- "Logout from all devices" button does not exist or navigates to a non-functional page
- After a security incident, there is no way to invalidate all tokens for a user
- Old tokens continue to access the API after password change

### Why Harmful
Passport access tokens are self-contained JWTs cached by the client. Changing the password does not invalidate existing tokens — they remain valid until expiry. A compromised token survives the user's security response. The attacker maintains API access until the token naturally expires (potentially hours or days).

### Real-World Consequences
- User changes password after noticing suspicious activity — attacker still has API access for 24 hours
- Compromised mobile app token continues accessing user data after password reset
- Security incident response procedure cannot invalidate all active tokens
- Compliance violation — tokens must be revocable in response to security events

### Preferred Alternative
Revoke all user tokens on password change, logout-from-all, and security incidents.

### Refactoring Strategy
1. Add token revocation to the password change flow: `$user->tokens()->each->revoke()`
2. Implement "logout from all devices" that revokes all tokens
3. Add an admin function to revoke tokens for any user in case of compromise
4. Add an event listener for security events that revokes tokens
5. Consider implementing refresh token rotation for additional security

### Detection Checklist
- [ ] Change password, then use old token — does it still work?
- [ ] Does the application have a "logout all devices" feature?
- [ ] Can an administrator revoke tokens for a compromised user?
- [ ] Are tokens revoked when 2FA is disabled?

### Related Rules/Skills/Trees
- Revoke Tokens on Security Events (05-rules.md)
- Set Short Access Token Lifetimes With Longer Refresh Windows (05-rules.md)
- Token Lifetime Configuration decision tree (07-decision-trees.md)
