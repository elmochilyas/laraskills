# Skill: Select and Configure the Optimal Web Server Architecture

## Purpose

Choose between Nginx + PHP-FPM, Apache + mod_php, FrankenPHP (Caddy), or RoadRunner based on throughput requirements, operational complexity, and application profile.

## When To Use

- Setting up a new PHP server or infrastructure
- Evaluating whether to switch from Apache to Nginx or to a newer architecture
- Optimizing the web server layer for performance

## When NOT To Use

- When the current web server meets all SLOs and doesn't require change
- For single-server development environments where architecture differences are negligible
- When migration cost exceeds expected performance benefit

## Prerequisites

- Throughput and latency requirements documented
- Understanding of web server concurrency models (process, event, thread)
- Application's static file vs dynamic request ratio

## Inputs

- Current web server configuration
- Traffic patterns (concurrent connections, request rate, static vs dynamic ratio)
- SSL/TLS termination requirements
- Team operational expertise

## Workflow (numbered steps)

1. Document current architecture: web server type, PHP handler, SSL termination, reverse proxy setup
2. Measure current throughput and p95 latency to establish baseline
3. Identify architecture-specific bottlenecks: slow-connection buffering, SSL overhead, static file serving
4. For high-concurrency static + dynamic workloads: select Nginx + PHP-FPM (event-driven, buffers slow clients)
5. For maximum simplicity and HTTP/3 support: select FrankenPHP (Caddy + PHP in single binary)
6. For Laravel Octane: select RoadRunner (octane:start --server=roadrunner)
7. For legacy applications requiring .htaccess compatibility: stay with Apache
8. Benchmark candidate architecture against current baseline with production workload
9. If throughput improvement <10%, stay with current architecture — migration effort not justified
10. Deploy using blue-green strategy with rollback

## Validation Checklist

- [ ] Current architecture baseline measured
- [ ] Candidate architecture selected based on requirements
- [ ] Candidate benchmarked with production workload
- [ ] SSL/TLS configuration tested (certificates, cipher suites)
- [ ] Static file caching configured (Cache-Control headers, expires)
- [ ] Slow client buffering configured (proxy_buffering, fastcgi_buffering)
- [ ] Deployment automation updated for new architecture

## Common Failures

- **Apache for high-concurrency workloads**: Apache's process-per-connection model does not scale to thousands of concurrent connections
- **Nginx without buffer tuning**: Default proxy buffer sizes may be too small for large responses
- **Ignoring slow client handling**: Without buffering, slow clients hold PHP workers idle — drastically reducing throughput
- **SSL termination at PHP level**: Terminating SSL at the web server (not PHP) improves PHP worker efficiency

## Decision Points

- For >1000 concurrent connections: prefer Nginx (event-driven) or FrankenPHP (thread-based)
- For <100 concurrent connections: Apache with mod_php is adequate and simpler
- For HTTP/3 requirement: prefer FrankenPHP (Caddy) or Nginx with QUIC support
- For Laravel Octane: RoadRunner is the default and best-documented option

## Performance Considerations

- Nginx event loop: handles 10K+ concurrent connections with ~2.5MB RAM per 10K connections
- Apache prefork: each connection requires a process (~10-50MB per connection at peak)
- FrankenPHP: CGO boundary adds 5-10% overhead but single binary simplifies deployment
- Unix sockets are 15-25% faster than TCP for PHP-FPM communication
- SSL termination at web server vs PHP: 5-15% CPU savings when TLS is handled before PHP

## Security Considerations

- TLS termination at the web server (not PHP) ensures encryption before application processing
- Web server access logs may contain sensitive data — configure log rotation and access restrictions
- Rate limiting should be configured at the web server layer (not PHP) to protect against DoS
- Web server runs as a separate user from PHP-FPM for defense in depth

## Related Rules (from 05-rules.md)

- Use Unix Sockets for FPM Communication
- Terminate SSL at Web Server, Not PHP
- Configure Slow Client Buffering
- Match Web Server to Concurrency Requirements

## Related Skills

- FPM Process Manager Mode Selection
- FrankenPHP Installation and Caddyfile Configuration
- RoadRunner Installation and Configuration

## Success Criteria

- Web server architecture selected based on documented requirements
- Baseline vs new architecture benchmark completed
- Throughput meets or exceeds requirements
- SSL/TLS configured correctly with A+ rating
- Team trained on new architecture operations
