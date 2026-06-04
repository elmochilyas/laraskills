# Skill: Integrate Laravel Wave SSE Package for Echo-Compatible Streaming

## Purpose
Use the `qruto/laravel-wave` package to provide SSE-based real-time delivery with Echo compatibility, enabling Echo subscriptions without a WebSocket server.

## When To Use
- Applications wanting real-time updates without WebSocket infrastructure
- Shared hosting environments where WebSocket ports are blocked
- Prototypes and MVPs needing quick real-time features
- Projects with simple server-to-client event needs

## When NOT To Use
- Bidirectional features requiring client events (whispers, typing indicators)
- High-traffic applications requiring horizontal WebSocket scaling
- Production-critical systems where first-party support is required
- Chat or collaborative editing applications

## Prerequisites
- Laravel application with broadcasting configured
- Echo installed on the frontend
- PHP-FPM with adequate worker pool

## Inputs
- Wave package configuration
- Echo broadcaster set to `wave`
- Event buffer TTL
- Redis configuration (for multi-server)

## Workflow
1. Install Wave: `composer require qruto/laravel-wave` and `php artisan wave:install`
2. Configure event buffer with appropriate TTL in `config/wave.php`
3. For multi-server deployments, configure Redis pub/sub in Wave config
4. Set Echo broadcaster to `'wave'` on the frontend
5. Configure Nginx with `X-Accel-Buffering: no` for SSE streaming
6. Size PHP-FPM `pm.max_children` to accommodate expected SSE connections plus HTTP traffic
7. Test Echo integration with the project's Echo version
8. Apply rate limiting to SSE endpoints
9. Document fallback plan (migration to Reverb or native SSE)

## Validation Checklist
- [ ] Wave package installed and configured
- [ ] Event buffer configured with TTL
- [ ] Redis set up for cross-server distribution (if multiple app servers)
- [ ] Nginx configured with `X-Accel-Buffering: no`
- [ ] PHP-FPM worker pool sized for expected SSE connections
- [ ] Echo integration tested with `broadcaster: 'wave'`
- [ ] Rate limiting configured on SSE endpoints
- [ ] Fallback plan documented (migration to Reverb)

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Events never reach client | Nginx buffering enabled (no `X-Accel-Buffering`) | Add `X-Accel-Buffering: no` header |
| Client events/whispers not working | Wave is unidirectional SSE | Use Reverb for bidirectional features |
| High memory/worker usage | PHP-FPM workers consumed by SSE connections | Size `pm.max_children` for SSE + HTTP |
| Events lost on reconnect | No event buffer configured | Set buffer TTL in Wave config |

## Decision Points
- **Wave vs Reverb**: Use Wave for simple server-to-client push without WebSocket infrastructure; use Reverb for bidirectional, high-traffic, or production-critical features
- **Event buffer TTL**: Set based on expected reconnection time (30s typical for short reconnections)

## Performance/Security Considerations
- Each SSE connection holds a PHP-FPM worker for its duration—size worker pool accordingly
- Event buffer in Redis adds memory overhead proportional to buffer duration and event volume
- SSE endpoints should be rate limited to prevent connection exhaustion attacks
- Wave is a community package—have a fallback plan for deprecation

## Related Rules (from 05-rules.md)
- Always Configure Event Buffer TTL for Wave
- Always Configure Redis for Multi-Server Wave Deployments
- Always Set `X-Accel-Buffering: no` for SSE Through Nginx
- Never Use Wave for Bidirectional Features
- Always Monitor PHP-FPM Worker Pool for SSE Connections
- Always Have a Fallback Plan for Wave Deprecation

## Related Skills
- Implement Native SSE in Laravel with response()->stream()
- Choose Between WebSocket, SSE, and Polling Transports

## Success Criteria
- Echo connects via Wave and receives events on subscribed channels
- Event buffer prevents data loss during brief disconnections
- PHP-FPM worker pool handles expected SSE connection count
- Fallback migration path to Reverb is documented
