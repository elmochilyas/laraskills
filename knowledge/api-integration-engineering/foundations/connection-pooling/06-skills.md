# Skill: Configure HTTP Connection Pooling for High-Throughput Integrations

## Purpose
Optimize outbound HTTP connections with connection pooling, persistent connections (Keep-Alive), and connection reuse to reduce latency and improve throughput for high-volume API integrations.

## When To Use
- High-throughput API integrations (100+ requests/minute)
- Multiple requests to the same external API host
- Queue workers making repeated API calls
- Reducing TCP handshake overhead

## When NOT To Use
- Low-volume integrations (connection overhead is negligible)
- APIs that don't support Keep-Alive
- Serverless environments where connection reuse is limited

## Prerequisites
- Guzzle HTTP client configuration access
- Understanding of TCP connection lifecycle

## Workflow
1. Configure Guzzle with `curl` handler for connection pooling
2. Set `CURLOPT_TCP_KEEPALIVE` and `CURLOPT_KEEPALIVE_TIME`
3. Reuse Guzzle client instance across requests (connection reuse)
4. Set appropriate connection limit per host
5. Configure idle connection timeout to prevent stale connections
6. Monitor pool statistics (active, idle, total connections)
7. Handle connection pool exhaustion errors
8. For SaloonPHP: configure connector's Guzzle client to reuse pool

## Validation Checklist
- [ ] Guzzle client reused across requests (not created per request)
- [ ] Connection limits configured per remote host
- [ ] Keep-Alive enabled with appropriate timeouts
- [ ] Idle connection timeout prevents stale connections
- [ ] Pool statistics monitored
- [ ] Connection exhaustion errors handled gracefully
