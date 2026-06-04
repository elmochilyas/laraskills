# Server Header Removal and Hardening — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Additional Security Concerns |
| Knowledge Unit | Server Header Removal and Hardening |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. Removing Headers at Only One Layer
2. Adding Custom Version Headers
3. Not Testing Header Removal After Deployment
4. Only Hardening Main Application (Not Subdomains or Error Pages)
5. Not Configuring Load Balancer Headers

---

## Repository-Wide Anti-Patterns

- **No header removal at all**: PHP version, server version, and framework version exposed in every response.
- **Relying solely on Laravel middleware**: Web server and PHP-FPM headers are outside Laravel's control.
- **Not including header hardening in provisioning**: Each new server requires manual configuration.
- **Only checking production, not staging**: Staging environments also leak version information.

---

## Anti-Pattern 1: Removing Headers at Only One Layer

### Category

Security

### Description

Configuring header removal at only one layer (e.g., web server only, or Laravel middleware only) while other layers continue to leak version information.

### Why It Happens

Developers may configure the layer they have access to (usually Laravel middleware) and assume it covers all headers.

### Warning Signs

- Only Laravel middleware removes headers — `X-Powered-By` still sent by PHP-FPM
- Only web server configured — PHP `expose_php` still `On`
- `curl -I` shows `X-Powered-By: PHP/8.2` despite middleware removal
- `Server: nginx/1.24` still present despite middleware

### Why Harmful

Each layer can independently add identifying headers. Configuring only the web server still leaks PHP version via `X-Powered-By`; configuring only PHP still leaks the web server version. All three layers must be configured because they operate independently — Laravel cannot control what PHP-FPM or Nginx sends.

### Consequences

- PHP version leaked even with Laravel middleware removal
- Web server version leaked even with PHP `expose_php = Off`
- Incomplete attack surface reduction
- Multiple configuration touchpoints required but only one configured

### Alternative

Configure header removal at all three layers: web server (`server_tokens off`), PHP (`expose_php = Off`), and Laravel middleware (fallback removal).

### Refactoring Strategy

1. Configure web server: `server_tokens off;` (Nginx) or `ServerTokens Prod` (Apache)
2. Configure PHP: `expose_php = Off` in `php.ini`
3. Add Laravel global middleware to remove `X-Powered-By` and `Server` as fallback
4. Verify with `curl -I` that no version headers remain

### Detection Checklist

- [ ] Web server configured (`server_tokens off` / `ServerTokens Prod`)
- [ ] PHP configured (`expose_php = Off`)
- [ ] Laravel middleware removes remaining headers
- [ ] `curl -I` shows no X-Powered-By or Server (with version) headers
- [ ] All three layers are independently verified

### Related Rules

- Remove Server Version Headers at All Layers (05-rules.md)

### Related Skills

- Harden Server Headers to Conceal Technology Stack (06-skills.md)

### Related Decision Trees

- Header Removal Layer Responsibility (07-decision-trees.md)

---

## Anti-Pattern 2: Adding Custom Version Headers

### Category

Security

### Description

Adding custom HTTP headers like `X-App-Version`, `X-Framework`, or `X-Build-Date` that disclose application version or build information.

### Why It Happens

Developers add version headers for debugging, deployment tracking, or API versioning. They may not consider the security implications.

### Warning Signs

- Response headers include `X-App-Version: 2.3.1` or similar
- Custom middleware adds version or build information to responses
- Frontend code reads `X-App-Version` for a "version" display
- Deployment script sets a build number header

### Why Harmful

Custom version headers have the same security impact as server headers — they reveal information attackers use to identify vulnerable versions. An `X-App-Version: 2.3.1` header tells an attacker which version of your application is running, enabling them to target known vulnerabilities in that specific version. Version information should only be available to authenticated, authorized users through internal APIs.

### Consequences

- Application version disclosed to all visitors
- Attackers target known vulnerabilities for that version
- Counterproductive — removes server headers only to add app version headers
- Compliance failure for unnecessary information disclosure

### Alternative

Remove all custom version headers. Expose version information only through authenticated internal APIs if needed.

### Refactoring Strategy

1. Search for custom version header middleware or configuration
2. Remove all `X-App-Version`, `X-Build-Date`, `X-Release` and similar headers
3. If version information is needed internally, expose it through an authenticated API endpoint
4. Verify that no custom informational headers remain in responses

### Detection Checklist

- [ ] No `X-App-Version` or similar custom headers in responses
- [ ] No middleware adds version or build information
- [ ] Version information is not exposed in any HTTP header
- [ ] Internal version checks use authenticated API endpoints
- [ ] `curl -I` shows no custom informational headers

### Related Rules

- Never Add Custom Version Headers (05-rules.md)

### Related Skills

- Harden Server Headers to Conceal Technology Stack (06-skills.md)

### Related Decision Trees

- Header Removal Layer Responsibility (07-decision-trees.md)

---

## Anti-Pattern 3: Not Testing Header Removal After Deployment

### Category

Testing

### Description

Configuring header removal once and never verifying it still works after subsequent deployments or server changes.

### Why It Happens

Header removal is a one-time configuration. Teams assume it stays effective and don't think to re-verify.

### Warning Signs

- No CI step checks for header leaks
- Header verification is not in the deployment checklist
- Configuration drift has re-enabled headers but no one noticed
- No monitoring or alerting for header leaks

### Why Harmful

Header configuration can regress during deployments: web server configuration files may be reverted, PHP configuration may differ between environments, or new middleware added by packages may introduce new informational headers. A CI test that explicitly checks for the absence of these headers catches regressions immediately rather than leaving the site leaking version information until the next manual audit.

### Consequences

- Undetected header regression between deployments
- Version information leaked for days or weeks before detection
- Headers re-enabled by server update or configuration change
- No automated verification in the deployment process

### Alternative

Add a `curl -I` header leak test to the CI/CD pipeline. Verify after every deployment.

### Refactoring Strategy

1. Add a CI step that runs `curl -I https://example.com` and checks for version headers
2. Fail the pipeline if any prohibited headers are found
3. Set up weekly header audit for production
4. Add alerting for header leak detection

### Detection Checklist

- [ ] Header leak test runs in CI/CD pipeline
- [ ] Pipeline fails if version headers are present
- [ ] Weekly header audit is configured
- [ ] Alerting is set up for header leak detection
- [ ] Deployment cannot proceed with leaking headers

### Related Rules

- Test Header Removal with curl After Every Deployment (05-rules.md)

### Related Skills

- Harden Server Headers to Conceal Technology Stack (06-skills.md)

### Related Decision Trees

- Testing and Verification Strategy (07-decision-trees.md)

---

## Anti-Pattern 4: Only Hardening Main Application (Not Subdomains or Error Pages)

### Category

Security

### Description

Applying header removal only to the main application URL and not to subdomains, error pages, or staging environments.

### Why It Happens

Configuration is applied to the main `server` block but not to other virtual hosts or default server blocks.

### Warning Signs

- Main app headers are clean but error pages (404, 500) leak version info
- Staging environment has full server headers exposed
- CDN or subdomain URLs show `Server` and `X-Powered-By` headers
- Only `https://app.example.com` is hardened, not `https://admin.example.com`

### Why Harmful

Error pages often bypass normal middleware stacks and may expose default headers that the main application suppresses. A 404 page served by the web server directly (before Laravel boots) may include full `Server` and `X-Powered-By` headers. Staging environments with separate configurations often lack hardening applied to production. Attackers scan all subdomains and error pages — not just the main application URL.

### Consequences

- Error pages leak version information
- Staging environment exposes server details
- CDN or subdomain URLs are unhardened
- Incomplete attack surface reduction — attackers find the exposed endpoint

### Alternative

Apply header removal globally to all server blocks, subdomains, error pages, and environments.

### Refactoring Strategy

1. Apply `server_tokens off` in the global `http` block (Nginx) or globally (Apache)
2. Verify that error pages (404, 500) also have headers removed
3. Apply header removal to all subdomains and environments
4. Test `curl -I` on error URLs and subdomains

### Detection Checklist

- [ ] Header removal is applied globally (not per-server-block)
- [ ] Error pages (404, 500) have headers removed
- [ ] All subdomains have headers removed
- [ ] Staging environment has headers removed
- [ ] CDN and load balancer URLs are verified

### Related Rules

- Apply Header Removal to All Subdomains and Error Pages (05-rules.md)

### Related Skills

- Harden Server Headers to Conceal Technology Stack (06-skills.md)

### Related Decision Trees

- Testing and Verification Strategy (07-decision-trees.md)

---

## Anti-Pattern 5: Not Configuring Load Balancer Headers

### Category

Security

### Description

Configuring header removal at the application and web server levels but not at the load balancer or CDN layer.

### Why It Happens

Load balancer configuration is often managed by infrastructure or DevOps teams, separate from application configuration. Developers may not have access to change it.

### Warning Signs

- Response headers show `Server: CloudFront` or `Via: 1.1 ALB`
- CDN adds its own `Server` header that the application cannot remove
- Load balancer headers leak infrastructure details
- Only upstream server headers are removed; edge headers remain

### Why Harmful

Load balancers and reverse proxies may add their own `Server`, `Via`, or `X-Cache` headers that reveal infrastructure details. These headers are set at the edge — the Laravel application and upstream web server have no control over them. CloudFront, for example, adds a `Server: CloudFront` header and `Via` headers. These must be configured in the CDN/load balancer settings, not in the application.

### Consequences

- Infrastructure details leaked through edge headers
- CloudFront, ALB, or HAProxy version information exposed
- Application-layer hardening ineffective against edge-layer headers
- Information disclosure of CDN/load balancer provider

### Alternative

Configure header removal at the load balancer or CDN layer explicitly.

### Refactoring Strategy

1. Identify all load balancer/CDN layers in the infrastructure
2. For CloudFront: configure a response headers policy to remove `Server` and `Via` headers
3. For ALB/NLB: configure header removal in the load balancer attributes
4. For HAProxy/Nginx reverse proxy: use `proxy_hide_header` directives
5. Verify with `curl -I` that edge headers are also removed

### Detection Checklist

- [ ] Load balancer headers are configured for removal
- [ ] CloudFront (if used) has a response headers policy
- [ ] ALB/NLB (if used) has header removal configured
- [ ] Reverse proxy (if used) strips upstream headers
- [ ] `curl -I` shows no infrastructure-revealing headers from any layer

### Related Rules

- Configure Load Balancer and Reverse Proxy Headers Separately (05-rules.md)

### Related Skills

- Harden Server Headers to Conceal Technology Stack (06-skills.md)

### Related Decision Trees

- Header Removal Layer Responsibility (07-decision-trees.md)
