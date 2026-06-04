## Always use PHP-FPM or Embedded SAPI in production
---
Category: Performance
---
Never use CGI in production — process-per-request overhead is prohibitive.
---
Reason: CGI forks a new PHP process per request, adding 10x+ overhead vs persistent process pools. PHP-FPM and Embedded SAPI reuse processes across requests.
---
Bad Example:
```nginx
# CGI — obsolete, process-per-request
fastcgi_pass 127.0.0.1:9000;
# Using php-cgi directly
```

Good Example:
```nginx
# PHP-FPM via Unix socket (15-25% faster than TCP)
fastcgi_pass unix:/var/run/php/php8.5-fpm.sock;
```
---
Exceptions: Legacy systems that cannot migrate away from CGI (rare). Migrate immediately if possible.
---
Consequences Of Violation: 10x+ overhead per request, unnecessary CPU waste, poor throughput under load.

## Prefer Unix sockets over TCP for same-machine PHP-FPM communication
---
Category: Performance
---
Always use Unix sockets instead of TCP loopback when PHP-FPM and Nginx run on the same machine.
---
Reason: Unix sockets bypass the network stack entirely, providing 15-25% lower latency per request. TCP loopback adds unnecessary protocol overhead for same-machine communication.
---
Bad Example:
```nginx
fastcgi_pass 127.0.0.1:9000; # TCP loopback — 15-25% slower
```

Good Example:
```nginx
fastcgi_pass unix:/var/run/php/php8.5-fpm.sock; # Unix socket — faster
```
---
Exceptions: Use TCP when PHP-FPM and the web server run on different machines (distributed setup) or when Unix socket permissions cannot be configured.
---
Consequences Of Violation: 15-25% higher latency per request, unnecessary network stack overhead at scale.

## Never expose PHP-FPM directly to the internet
---
Category: Security
---
Always place a reverse proxy (Nginx, Caddy) in front of PHP-FPM. Never listen on a public interface.
---
Reason: PHP-FPM's FastCGI protocol is not designed for security hardening against internet threats. A reverse proxy provides request filtering, SSL termination, rate limiting, and access control.
---
Bad Example:
```ini
listen = 9000
listen.allowed_clients = 0.0.0.0
```

Good Example:
```ini
listen = /var/run/php/php8.5-fpm.sock
listen.allowed_clients = 127.0.0.1
```
---
Exceptions: Internal services on isolated networks with strict firewall rules may use TCP, but a reverse proxy is still recommended.
---
Consequences Of Violation: Direct exposure to request smuggling, denial-of-service, and protocol-level attacks.

## Use ZTS-enabled PHP for embedded SAPI runtimes
---
Category: Configuration
---
Always compile PHP with --enable-zts when using FrankenPHP or any embedded SAPI runtime.
---
Reason: Embedded SAPIs like FrankenPHP use thread-based concurrency. Without ZTS (Zend Thread Safety), global state corruption and segmentation faults occur under concurrent requests.
---
Bad Example:
```dockerfile
# Using non-ZTS PHP with FrankenPHP — crashes under load
FROM php:8.4-cli
# No ZTS, FrankenPHP will segfault
```

Good Example:
```dockerfile
FROM php:8.4-zts
# ZTS enabled, FrankenPHP thread-safe
```
---
Exceptions: PHP-FPM deployments do not require ZTS (they use process-based isolation, not threads).
---
Consequences Of Violation: Random segmentation faults, data corruption, unpredictable crashes under concurrent load.

## Standardize on one SAPI architecture per deployment
---
Category: Maintainability
---
Avoid mixing PHP-FPM and mod_php or other SAPIs within the same deployment environment.
---
Reason: Different SAPIs have distinct configuration, lifecycle, and behavior. Mixing them creates deployment confusion, inconsistent caching behavior, and maintenance overhead.
---
Bad Example:
```ini
# Same server mixing mod_php and PHP-FPM
# Apache with mod_php for some vhosts, Nginx+FPM for others
# Inconsistent OpCache state, confusing deployment
```

Good Example:
```nginx
# Single architecture: Nginx + PHP-FPM for all vhosts
server {
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.5-fpm.sock;
    }
}
```
---
Exceptions: Migration periods where both architectures must coexist temporarily.
---
Consequences Of Violation: Deployment confusion, inconsistent behavior, doubled operational complexity.

## Prefer embedded SAPI for maximum performance on dedicated API servers
---
Category: Architecture
---
Use embedded SAPI runtimes (FrankenPHP) when maximum throughput and sub-millisecond overhead are required.
---
Reason: Embedded SAPI eliminates inter-process communication overhead entirely. FrankenPHP's embedded SAPI provides 3-5x throughput vs PHP-FPM by removing the FastCGI protocol layer.
---
Bad Example:
```nginx
# PHP-FPM for a high-throughput API that needs every microsecond
fastcgi_pass unix:/var/run/php/php8.5-fpm.sock; # 0.1-0.5ms overhead
```

Good Example:
```caddyfile
# FrankenPHP — embedded SAPI, no FastCGI overhead
localhost:8080 {
    root * /var/www/public
    php_server
}
```
---
Exceptions: Multi-tenant hosting environments requiring user-level process isolation benefit from PHP-FPM's pool isolation.
---
Consequences Of Violation: Leaving 3-5x throughput on the table for high-performance API services.
