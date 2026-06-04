# Standardized Knowledge: WebSocket Security (TLS, CORS, Auth, CSWSH)

## Metadata
| Field | Value |
|-------|-------|
| Domain | Real-Time Systems |
| Subdomain | Security |
| Knowledge Unit ID | K24 |
| Title | WebSocket Security (TLS, CORS, Auth, CSWSH) |
| Difficulty | Intermediate |
| Dependencies | K25, K29, K12, K32 |

## Overview
WebSocket security spans multiple layers: transport security (WSS/TLS), origin validation (CORS, CSWSH prevention), authentication (token, session, ticket-based), authorization (channel-level via Laravel's broadcasting auth), and input validation (message size, payload sanitization). The primary threats are Cross-Site WebSocket Hijacking (CSWSH) and data interception on unencrypted connections.

## Core Concepts
- WebSocket connections bypass the browser's Same-Origin Policy—no CORS preflight is required, and the browser automatically sends cookies
- CSWSH: a malicious page opens an authenticated WebSocket to your server using the victim's cookies
- Mitigation: origin validation, token-based authentication, SameSite cookie attributes
- WSS (TLS) encrypts all WebSocket communication, preventing eavesdropping and MITM attacks

## When To Use
- All production Reverb deployments (WSS is mandatory)
- Any application handling user data or requiring authentication
- Multi-tenant applications where channel isolation is critical

## When NOT To Use
- Local development environments (plain WS is acceptable)
- Internal-only services on isolated networks

## Best Practices (Why)
- **Always use WSS in production**: Plain `ws://` sends all traffic unencrypted; WSS prevents eavesdropping and MITM
- **Validate origins with an explicit allowlist**: Configure `allowed_origins` in Reverb config—prevents any website from opening WebSocket to your server
- **Use token-based authentication over cookie-only**: Tokens avoid the automatic cookie-sending behavior that enables CSWSH; use JWTs or ephemeral tokens
- **Set SameSite cookies to Lax or Strict**: Limits cross-site cookie sending, providing defense in depth against CSWSH
- **Implement channel-level authorization**: Laravel's `/broadcasting/auth` endpoint validates per-channel access as a second layer after connection auth

## Architecture Guidelines
- Terminate TLS at Nginx rather than Reverb itself
- Validate origins at both Reverb level (`allowed_origins`) and application level
- Choose between auth token in query string (simpler but logged) or first message (more secure but complex)
- Never expose Reverb on plain HTTP in production
- Keep Reverb updated to patch CVE vulnerabilities (v1.7.0+)

## Performance Considerations
- WSS handshake: TLS negotiation adds ~50-200ms to initial connection (worth it for security)
- TLS session resumption (session IDs, session tickets) reduces handshake overhead for reconnections
- Origin validation via string comparison is O(n) in allowlist length; negligible cost
- Token validation (JWT verification, database lookup) adds per-connection latency

## Security Considerations
- Origin validation is the primary defense against CSWSH; do not rely on SameSite alone
- Non-browser clients (mobile apps, server-to-server) don't send Origin header reliably—use token auth
- Auth token in query string appears in server logs, referrer headers, browser history
- Message size limits prevent DoS via oversized payloads (configure `max_message_size` in Reverb)

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Plain WS in production | All WebSocket traffic unencrypted | Convenience, missing config | MITM attacks, data interception | Always use WSS |
| No allowed_origins | Any website can open WebSocket to your server | Missing configuration | CSWSH vulnerability | Set explicit allowlist in Reverb config |
| Cookie-only auth | Vulnerable to CSWSH via automatic cookie sending | Following HTTP auth patterns | Attacker hijacks authenticated connections | Use token-based authentication |
| Not updating Reverb | Running vulnerable version (CVE-2026-23524) | Ignoring security updates | Remote code execution risk | Keep Reverb at v1.7.0+ |
| Wildcard allowed_origins | Allowing `*` in production | Convenience over security | Any origin can connect | Never use wildcards in production |

## Anti-Patterns
- **Relying solely on CORS for WebSocket protection**: CORS doesn't apply to WebSocket handshakes—origin validation must be done server-side
- **Exposing Reverb on a public port without Nginx**: Bypasses WSS termination and adds direct attack surface
- **Using the same credentials for development and production**: Generated credentials should be unique per environment

## Examples

### Reverb origin validation
```php
// config/reverb.php
'allowed_origins' => [
    'https://example.com',
    'https://admin.example.com',
],
```

### Echo with TLS and token auth
```javascript
const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT,
    wssPort: import.meta.env.VITE_REVERB_PORT,
    forceTLS: true,
    enabledTransports: ['ws', 'wss'],
    auth: {
        headers: {
            Authorization: `Bearer ${userToken}`,
        },
    },
});
```

## Related Topics
- K25: CVE-2026-23524 (Reverb Redis Deserialization)
- K29: Private Channel Auth with JWT/Sanctum
- K12: Channel Authorization (routes/channels.php)
- K32: Nginx WebSocket Proxy Configuration

## AI Agent Notes
- This KU is atomic—no further decomposition needed
- The OWASP WebSocket Security Cheat Sheet is the authoritative reference
- CSWSH is the primary WebSocket-specific threat; origin validation is the primary defense
- Defense in depth: origin validation + token auth + SameSite + channel authorization

## Verification
- [ ] WSS enforced in production (`forceTLS: true` in Echo)
- [ ] `allowed_origins` configured in Reverb config (no wildcards)
- [ ] TLS certificate valid and not expired
- [ ] Token-based authentication used (not cookie-only)
- [ ] Reverb updated to v1.7.0+
- [ ] Channel authorization via `/broadcasting/auth` implemented
- [ ] Message size limits configured
- [ ] SameSite cookies set to Lax or Strict
