# Standardized Knowledge: Web Server Architectures

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | Web Server Architectures |
| Difficulty | Foundation |
| Lifecycle | Understand, Configure |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

PHP can integrate with web servers via multiple architectures: **CGI** (process-per-request, obsolete), **FastCGI** (persistent process pool), **PHP-FPM SAPI** (modern FastCGI implementation with process management), and **embedded SAPI** (PHP linked directly into the web server — FrankenPHP, Apache mod_php). PHP-FPM serves ~80%+ of production deployments; embedded SAPI powers Octane-era runtimes.

## Core Concepts

- **CGI**: Fork a PHP process per request. High overhead. Effectively deprecated.
- **FastCGI**: Long-running PHP processes managed by a process manager. Nginx communicates via TCP socket or Unix socket.
- **PHP-FPM**: Enhanced FastCGI implementation. Adds process pool management (static/dynamic/ondemand), slow log, status page, per-pool configuration. The standard for PHP production deployments.
- **Embedded SAPI**: PHP interpreter linked directly as a library. Used by FrankenPHP (CGO-embedded via Caddy), Apache mod_php (deprecated), and custom runtimes. Lowest latency, but requires thread-safe (ZTS) PHP compilation.

## When To Use

- PHP-FPM: Standard production deployments, multi-tenant hosting, Nginx-based architectures.
- Embedded SAPI: Maximum performance requirements, containerized deployments (FrankenPHP), operational simplicity (single binary).
- FastCGI (without FPM): Legacy systems, custom process managers.
- CGI: Never — use PHP-FPM or FastCGI.

## When NOT To Use

- PHP-FPM for sub-ms latency requirements (FastCGI protocol adds ~0.1-0.5ms overhead)
- Embedded SAPI without ZTS-enabled PHP (FrankenPHP requires ZTS build)
- CGI in production (process-per-request overhead is prohibitive)
- TCP sockets when Unix sockets are available (Unix sockets are 15-25% faster)

## Best Practices (WHY)

- **Use PHP-FPM for standard deployments**: It's the most battle-tested, feature-rich, and well-documented option for PHP production.
- **Prefer Unix sockets over TCP**: Unix sockets are 15-25% faster than TCP loopback for PHP-FPM communication because they bypass the network stack.
- **Consider FrankenPHP for simplicity**: A single binary replacing Nginx + PHP-FPM + certbot reduces operational complexity.
- **Embedded SAPI for maximum performance**: Eliminates inter-process communication overhead entirely. FrankenPHP's embedded SAPI provides 3-5x throughput vs PHP-FPM.

## Architecture Guidelines

- **Nginx + PHP-FPM**: The dominant architecture — Nginx proxies requests to PHP-FPM via FastCGI protocol. Unix sockets preferred over TCP for lower latency.
- **FrankenPHP (embedded)**: Caddy server with embedded PHP via CGO. Single binary, automatic HTTPS, HTTP/3. Thread-based concurrency with ZTS.
- **Apache + mod_php**: Deprecated. Legacy architecture where PHP is loaded as an Apache module. Not recommended for new deployments.

## Performance

- PHP-FPM adds ~0.1-0.5ms per request for FastCGI protocol overhead
- Embedded SAPI eliminates inter-process communication overhead entirely
- Unix sockets are 15-25% faster than TCP loopback for PHP-FPM communication
- FrankenPHP embedded SAPI: 3-5x throughput vs PHP-FPM in benchmarks

## Security

- PHP-FPM pools can be isolated per-user for multi-tenant security
- Unix socket permissions control which users can communicate with PHP-FPM
- Embedded SAPI (FrankenPHP) has a smaller attack surface (no FastCGI protocol parsing)
- CGI is less secure due to process-per-request environment variable handling

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using TCP instead of Unix socket | Default in many configs | 15-25% higher latency | Use Unix socket for same-machine communication |
| PHP-FPM without process management | Default config | Pool exhaustion, OOM | Tune pm.max_children, pm.max_requests |
| Not enabling ZTS for FrankenPHP | Using standard PHP build | Thread safety errors | Compile PHP with --enable-zts for FrankenPHP |
| Keeping CGI in production | Legacy migration not completed | 10x+ overhead per request | Migrate to PHP-FPM immediately |

## Anti-Patterns

- **Using Apache mod_php for new projects**: Deprecated architecture with poor isolation and performance. Use PHP-FPM with Nginx or FrankenPHP.
- **Mixing PHP-FPM and mod_php**: Different SAPIs have different configuration and behavior. Standardize on one architecture.
- **Exposing PHP-FPM directly to the internet**: PHP-FPM should only listen on localhost or Unix socket. Always use a reverse proxy (Nginx, Caddy) in front.

## Examples

```nginx
# Nginx + PHP-FPM via Unix socket
server {
    listen 80;
    server_name example.com;
    root /var/www/public;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.5-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}

# FrankenPHP Caddyfile (embedded SAPI — no Nginx needed)
localhost:8080 {
    root * /var/www/public
    php_server
}
```

## Related Topics

- Shared-Nothing Architecture
- Memory-Resident Architecture
- PHP-FPM Process Manager Modes
- FrankenPHP Architecture
- Web Server Configuration

## AI Agent Notes

- PHP-FPM serves ~80%+ of production PHP deployments.
- Unix sockets are 15-25% faster than TCP loopback.
- Embedded SAPI (FrankenPHP) eliminates FastCGI protocol overhead.
- CGI is obsolete — never use in production.
- FrankenPHP's single binary replaces Nginx + PHP-FPM + certbot.

## Verification

- [ ] PHP-FPM used for standard deployments (not CGI)
- [ ] Unix socket configured instead of TCP (if same-machine)
- [ ] PHP-FPM not exposed directly to the internet
- [ ] pm.max_children and pm.max_requests properly tuned
- [ ] If using FrankenPHP: PHP compiled with --enable-zts
- [ ] Deployment architecture documented and understood
