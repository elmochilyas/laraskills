# Metadata

**Domain:** real-time-systems
**Subdomain:** sse-server-sent-events
**Knowledge Unit:** laravel-wave-sse-package
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Echo integration tested with the project's Echo version
- [ ] Event buffer configured with TTL
- [ ] Fallback plan documented (migration to Reverb or native SSE)
- [ ] Always Configure Event Buffer TTL for Wave
- [ ] Always Configure Redis for Multi-Server Wave Deployments
- [ ] Always Have a Fallback Plan for Wave Deprecation
- [ ] Always Monitor PHP-FPM Worker Pool for SSE Connections
- [ ] Always Set X-Accel-Buffering: no for SSE Through Nginx
- [ ] Echo integration tested with `broadcaster: 'wave'`
- [ ] Event buffer configured with TTL
- [ ] Fallback plan documented (migration to Reverb)
- [ ] Apply rate limiting to SSE endpoints
- [ ] Configure event buffer with appropriate TTL in `config/wave.php`
- [ ] Configure Nginx with `X-Accel-Buffering: no` for SSE streaming
- [ ] Echo connects via Wave and receives events on subscribed channels
- [ ] Event buffer prevents data loss during brief disconnections
- [ ] Fallback migration path to Reverb is documented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Apply rate limiting to SSE endpoints
- [ ] Configure event buffer with appropriate TTL in `config/wave.php`
- [ ] Configure Nginx with `X-Accel-Buffering: no` for SSE streaming
- [ ] Document fallback plan (migration to Reverb or native SSE)
- [ ] For multi-server deployments, configure Redis pub/sub in Wave config
- [ ] Install Wave: `composer require qruto/laravel-wave` and `php artisan wave:install`
- [ ] Set Echo broadcaster to `'wave'` on the frontend
- [ ] Size PHP-FPM `pm.max_children` to accommodate expected SSE connections plus HTTP traffic
- [ ] Test Echo integration with the project's Echo version
- [ ] Always Configure Event Buffer TTL for Wave
- [ ] Always Configure Redis for Multi-Server Wave Deployments
- [ ] Always Have a Fallback Plan for Wave Deprecation

---

# Performance Checklist

- [ ] Channel subscription registry is in-memory per server; horizontal scaling requires shared state
- [ ] Event buffer in Redis adds memory overhead proportional to buffer duration and event volume
- [ ] Event fan-out to SSE connections is O(n) in connected client count
- [ ] No per-connection WebSocket overhead (no upgrade handshake, no frame parsing)
- [ ] SSE connections via Wave consume PHP-FPM workers (same as native SSE)
- [ ] Each SSE connection holds a PHP-FPM worker for its durationâ€”size worker pool accordingly
- [ ] Event buffer in Redis adds memory overhead proportional to buffer duration and event volume
- [ ] SSE endpoints should be rate limited to prevent connection exhaustion attacks

---

# Security Checklist

- [ ] Allowed origins should be configured to prevent unauthorized connections
- [ ] Event buffer should be protectedâ€”buffered events may contain sensitive data
- [ ] SSE endpoints should be rate limited to prevent abuse
- [ ] Wave uses standard Laravel auth for channel authorization
- [ ] SSE endpoints should be rate limited to prevent connection exhaustion attacks

---

# Reliability Checklist

- [ ] Client events/whispers not working
- [ ] Events lost on reconnect
- [ ] Events never reach client
- [ ] High memory/worker usage
- [ ] Always Configure Event Buffer TTL for Wave
- [ ] Always Configure Redis for Multi-Server Wave Deployments
- [ ] Always Have a Fallback Plan for Wave Deprecation
- [ ] Always Monitor PHP-FPM Worker Pool for SSE Connections
- [ ] Always Set X-Accel-Buffering: no for SSE Through Nginx
- [ ] Never Use Wave for Bidirectional Features

---

# Testing Checklist

- [ ] Echo connects via Wave and receives events on subscribed channels
- [ ] Echo integration tested with `broadcaster: 'wave'`
- [ ] Echo integration tested with the project's Echo version
- [ ] Event buffer configured with TTL
- [ ] Event buffer prevents data loss during brief disconnections
- [ ] Fallback migration path to Reverb is documented
- [ ] Fallback plan documented (migration to Reverb or native SSE)
- [ ] Fallback plan documented (migration to Reverb)
- [ ] Nginx configured with `X-Accel-Buffering: no`
- [ ] Nginx configured with `X-Accel-Buffering: no` for SSE

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Wave for Bidirectional Features (Client Events, Whispers)]
- [ ] [No Event Buffer TTL (Events Lost on Reconnect)]
- [ ] [Multi-Server Wave Without Redis Pub/Sub]
- [ ] [No PHP-FPM Worker Pool Sizing for SSE Connections]
- [ ] [No Fallback Plan for Wave Deprecation]
- [ ] Not testing with the specific Echo version
- [ ] Relying on Wave for production-critical broadcasting
- [ ] Using Wave in horizontally scaled app servers without Redis

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


