# Domain: Security & Identity Engineering
# Subdomain: Additional Security Concerns

---

## Rule Name

Remove Server Version Headers at All Layers

## Category

Security

## Rule

Configure header removal at three layers: web server (Nginx `server_tokens off;` or Apache `ServerTokens Prod`), PHP (`expose_php = Off`), and Laravel middleware. Never configure only one layer.

## Reason

Server version headers reveal exact software versions (Nginx 1.24.0, PHP 8.2.5, Laravel 11.0) to automated scanners and attackers. Each layer can independently add identifying headers. Configuring only the web server still leaks PHP version via `X-Powered-By`; configuring only PHP still leaks the web server version. All three layers must be configured because they operate independently — Laravel cannot control what PHP-FPM or Nginx sends.

## Bad Example

```nginx
# Nginx configured — but PHP expose_php still On
server_tokens off;
# X-Powered-By: PHP/8.2.5 still leaked
```

## Good Example

```nginx
# Nginx
server_tokens off;
```

```ini
; php.ini
expose_php = Off
```

```php
// Laravel global middleware
public function handle(Request $request, Closure $next): Response
{
    $response = $next($request);
    $response->headers->remove('X-Powered-By');
    $response->headers->remove('server');
    return $response;
}
```

## Exceptions

Local development environments. While header removal does no harm, it is unnecessary and may obscure debug information.

## Consequences Of Violation

Security: Software version information leaked to attackers for targeted exploitation. Compliance: Fails attack surface reduction requirements.

---

## Rule Name

Never Add Custom Version Headers

## Category

Security

## Rule

Do not add custom headers that disclose application version, framework version, build number, or deployment timestamp (e.g., `X-App-Version`, `X-Framework`, `X-Build-Date`). Remove any such headers added by packages or custom middleware.

## Reason

Custom version headers have the same security impact as server headers — they reveal information attackers use to identify vulnerable versions. An `X-App-Version: 2.3.1` header tells an attacker which version of your application is running, enabling them to target known vulnerabilities in that specific version. Version information should only be available to authenticated, authorized users through internal APIs.

## Bad Example

```php
// Custom middleware adding version headers
public function handle(Request $request, Closure $next): Response
{
    $response = $next($request);
    $response->headers->set('X-App-Version', '2.3.1');
    $response->headers->set('X-Build-Date', '2026-06-02');
    return $response;
}
```

## Good Example

```php
// No custom version headers in responses
public function handle(Request $request, Closure $next): Response
{
    $response = $next($request);
    // Remove even standard informational headers
    $response->headers->remove('X-Powered-By');
    return $response;
}
```

## Exceptions

Internal APIs consumed only by authorized services within a private network, where version headers aid in compatibility negotiation. Even then, use TLS client certificates or API keys for version negotiation instead.

## Consequences Of Violation

Security: Application version information aids targeted attack. Compliance: Fails information disclosure prevention requirements.

---

## Rule Name

Test Header Removal with curl After Every Deployment

## Category

Testing

## Rule

Run a header leak test in CI after every deployment using `curl -I` or equivalent. Fail the pipeline if `X-Powered-By`, `Server` (with version), or any custom version headers are present.

## Reason

Header configuration can regress during deployments: web server configuration files may be reverted, PHP configuration may differ between environments, or new middleware added by packages may introduce new informational headers. A CI test that explicitly checks for the absence of these headers catches regressions immediately rather than leaving the site leaking version information until the next manual audit.

## Bad Example

```yaml
# Deploy without header verification
deploy:
  script:
    - ansible-playbook deploy.yml
  # No header leak check
```

## Good Example

```yaml
deploy:
  script:
    - ansible-playbook deploy.yml
    - |
      curl -sI https://example.com | findstr /i "powered-by server x-.*-version"
      if %errorlevel% equ 0 then
        echo "Header leak detected!"
        exit 1
      end if
```

## Exceptions

Environments where curl or alternative HTTP clients are not available (some container platforms). In these cases, use an equivalent tool or a third-party header checker API.

## Consequences Of Violation

Security: Undetected header regression between deployments. Compliance: Intermittent information disclosure failures.

---

## Rule Name

Apply Header Removal to All Subdomains and Error Pages

## Category

Security

## Rule

Configure header removal on every subdomain, every environment (staging, production), and every page including error pages (404, 500, 503). Never apply it only to the main application routes.

## Reason

Error pages often bypass normal middleware stacks and may expose default headers that the main application suppresses. A 404 page served by the web server directly (before Laravel boots) may include full `Server` and `X-Powered-By` headers. Staging environments with separate configurations often lack hardening applied to production. Attackers scan all subdomains and error pages — not just the main application URL.

## Bad Example

```nginx
# Main server block configured
server {
    listen 443 ssl;
    server_name app.example.com;
    server_tokens off;
}

# Error pages — no server_tokens
server {
    listen 443 ssl;
    server_name cdn.example.com;
    # server_tokens not set — version leaked
}
```

## Good Example

```nginx
# Global context — applies to all servers
http {
    server_tokens off;
    # Applies to every virtual host and error page
}
```

## Exceptions

Third-party hosted subdomains (CDN, email provider) where you do not control the web server configuration. For these, verify the third party's security posture.

## Consequences Of Violation

Security: Version information leaked through unhardened subdomains or error pages. Compliance: Incomplete attack surface reduction.

---

## Rule Name

Configure Load Balancer and Reverse Proxy Headers Separately

## Category

Security

## Rule

When using a load balancer (ALB, CloudFront, HAProxy, Nginx reverse proxy), configure header removal on the load balancer layer explicitly. Never assume upstream web server configuration covers the edge.

## Reason

Load balancers and reverse proxies may add their own `Server`, `Via`, or `X-Cache` headers that reveal infrastructure details. These headers are set at the edge — the Laravel application and upstream web server have no control over them. CloudFront, for example, adds a `Server: CloudFront` header and `Via` headers. These must be configured in the CDN/load balancer settings, not in the application.

## Bad Example

```php
// Assuming Laravel middleware covers all response headers
// Load balancer adds Server: CloudFront — not removable from Laravel
```

## Good Example

```nginx
# Nginx reverse proxy — strip upstream headers
proxy_hide_header X-Powered-By;
proxy_hide_header Server;
```

```yaml
# CloudFront — custom response headers policy
ResponseHeadersPolicy:
  RemoveHeaders:
    - "Server"
    - "Via"
```

## Exceptions

Managed platforms where load balancer header configuration is not exposed (Laravel Vapor, Forge with CloudFlare). In these cases, verify with the platform documentation what headers are controllable.

## Consequences Of Violation

Security: Infrastructure details leaked through load balancer headers. Compliance: Fails perimeter hardening requirements.

---

## Rule Name

Include Header Hardening in the Server Provisioning Checklist

## Category

Maintainability

## Rule

Add server header removal to the standard server provisioning checklist (infrastructure-as-code templates, Dockerfiles, Ansible playbooks). Never rely on ad-hoc manual configuration.

## Reason

Header removal is a one-time configuration that is easily forgotten when provisioning new servers. Without being part of a repeatable provisioning process, every new server or environment requires manual verification — which is consistently skipped under time pressure. Infrastructure-as-code ensures every environment (staging, production, DR) has consistent header hardening from the moment it is provisioned.

## Bad Example

```bash
# Manual configuration — forgotten on new servers
# "I'll add server_tokens off after we launch"
```

## Good Example

```dockerfile
# Dockerfile — hardened from build
RUN echo "expose_php = Off" >> /usr/local/etc/php/conf.d/security.ini

RUN echo "server_tokens off;" >> /etc/nginx/conf.d/security.conf
```

```yaml
# Ansible task — enforced on every provision
- name: Disable PHP version exposure
  ini_file:
    path: /etc/php/8.2/fpm/php.ini
    section: PHP
    option: expose_php
    value: "Off"
```

## Exceptions

Ephemeral environments (ephemeral review apps, short-lived feature branches) that are not internet-accessible and are destroyed after use.

## Consequences Of Violation

Security: New environments deployed without header hardening. Compliance: Inconsistent security posture across environments.
