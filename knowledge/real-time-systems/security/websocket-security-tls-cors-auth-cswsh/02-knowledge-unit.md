# Metadata
Domain: Real-Time Systems
Subdomain: Security
Knowledge Unit: WebSocket Security (TLS, CORS, Auth, CSWSH)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
WebSocket security spans multiple layers: transport security (WSS/TLS), origin validation (CORS, CSWSH prevention), authentication (token, session, ticket-based), authorization (channel-level via Laravel's broadcasting auth), and input validation (message size, payload sanitization). The primary threats are Cross-Site WebSocket Hijacking (CSWSH), where a malicious site uses the victim's cookies to open an authenticated WebSocket to your server, and data interception/eavesdropping on unencrypted connections. WSS (WebSocket Secure) is mandatory in production. CSWSH prevention relies on Origin header validation and token-based authentication. The OWASP WebSocket Security Cheat Sheet provides the authoritative reference for these protections.

## Core Concepts
WebSocket connections bypass the browser's Same-Origin Policy (SOP)—unlike HTTP requests, WebSocket handshakes do not require CORS preflight and can be initiated cross-origin. This makes CSWSH a unique threat: a malicious page can open a WebSocket to your server and the browser automatically sends cookies. Mitigation combines origin validation (the server checks the `Origin` header on every handshake), token-based authentication (cookies not required), and SameSite cookie attributes. TLS (WSS) encrypts the entire WebSocket communication, preventing eavesdropping and man-in-the-middle attacks.

## Mental Models
WebSocket connections are like phone calls that bypass the front desk. Without proper security, anyone can call and impersonate a legitimate user. Origin validation checks the caller ID. Token authentication requires a password even if the caller ID looks right. WSS encrypts the conversation so no one can listen in.

## Internal Mechanics
The WebSocket handshake is an HTTP GET request with `Upgrade: websocket`. Browsers include the `Origin` header automatically (cannot be overridden by JavaScript). Cookies are sent if present and if SameSite allows. The server validates the `Origin` against an allowlist. For token-based auth, the token is passed in the URL query string (visible in logs) or in the first message after connection. Reverb's `allowed_origins` config validates origins at the WebSocket server level. Laravel's channel authorization (`/broadcasting/auth`) handles per-channel access control via a separate HTTP request after the WebSocket connection is established.

## Patterns
- **Always WSS**: Use `wss://` in production; plain `ws://` is only for local development
- **Origin validation**: Explicit allowlist of trusted origins in Reverb/Pusher config
- **Token-based authentication**: Pass temporary tokens (JWT or ephemeral) to avoid cookie dependency
- **CSRF-like tokens for WebSocket**: Include a token in the WebSocket handshake URL or first message
- **Channel authorization**: Laravel's auth endpoint validates channel-level access (second layer after connection auth)
- **SameSite cookies**: Set `SameSite=Lax` or `Strict` on session cookies to limit cross-site request sending

## Architectural Decisions
- **TLS termination at Nginx**: Nginx handles WSS decryption so Reverb receives plain WS internally
- **Origin validation at server level**: Both Reverb and your Laravel auth endpoint should validate origins
- **Auth token in query string vs. first message**: Query string is simpler but logs the token; first message is more secure but requires custom protocol handling

## Tradeoffs
- **Token in query string**: Appears in server logs, referrer headers, and browser history; use short-lived tokens or first-message auth
- **Origin validation limitations**: Non-browser clients (mobile apps, server-to-server) don't send the `Origin` header reliably
- **WSS overhead**: TLS handshake adds latency to initial connection (~50-200ms); mitigated by TLS session resumption
- **CSWSH protection vs. convenience**: More secure auth (first-message token) adds client-side complexity

## Performance Considerations
- WSS handshake: TLS negotiation adds ~50-200ms to initial connection (worth it for security)
- TLS session resumption (session IDs, session tickets) reduces handshake overhead for reconnections
- Origin validation via string comparison is O(n) in allowlist length; negligible cost
- Token validation (JWT verification, database lookup) adds per-connection latency
- Message size limits prevent DoS via oversized payloads (configure in Reverb: `max_message_size`)

## Production Considerations
- Enable WSS with valid TLS certificate (Let's Encrypt for free certificates)
- Configure `allowed_origins` in `config/reverb.php` to restrict which domains can connect
- Set `forceTLS: true` in Echo configuration for production
- Never expose the WebSocket server on plain HTTP in production
- Use token-based authentication for API-driven apps; avoid cookie-only auth for WebSocket
- Implement CVE patching: keep Reverb at v1.7.0+ (CVE-2026-23524 fixed)
- Monitor WebSocket handshake failures for CSWSH attempts (wrong origin, invalid auth)
- Log WebSocket connection events with client IP, origin, and user ID for audit trails

## Common Mistakes
- Running WebSocket on `ws://` (not WSS) in production (all traffic unencrypted, MITM vulnerable)
- Not configuring `allowed_origins` (any website can open WebSocket to your server)
- Relying solely on Cookie-based auth for WebSocket (vulnerable to CSWSH)
- Not updating Reverb after CVE announcements (CVE-2026-23524 had CVSS 9.8)
- Exposing Reverb on a public port without Nginx reverse proxy (bypasses WSS termination)
- Allowing `*` in CORS or `allowed_origins` in production

## Failure Modes
- **CSWSH exploit**: Missing origin validation allows attacker to hijack authenticated WebSocket connection, read private channel events, and send client events
- **TLS certificate expiry**: WSS connections fail with certificate errors; clients cannot connect
- **Token leakage**: Auth token in query string appears in access logs; log compromise leaks authentication tokens
- **Auth bypass**: Channel authorization callback returns true unconditionally; any connected user accesses any channel
- **Message injection**: No input validation on client events; malicious payloads broadcast to all channel members

## Ecosystem Usage
- Required security configuration for all production Reverb deployments
- Standard for Pusher Channels and Ably (they handle transport security; you handle channel auth)
- OWASP WebSocket Security Cheat Sheet as the industry reference
- Laravel's `allowed_origins` and channel authorization system provide defense in depth

## Related Knowledge Units
- K25: CVE-2026-23524 (Reverb Redis Deserialization)
- K29: Private Channel Auth with JWT/Sanctum
- K12: Channel Authorization (routes/channels.php)
- K32: Nginx WebSocket Proxy Configuration

## Research Notes
The OWASP WebSocket Security Cheat Sheet (latest update 2025) covers the full threat model. Browser SameSite cookie defaults (Lax in Chrome since 2020) provide partial CSWSH protection but are not a complete mitigation—explicit origin validation is still the primary defense. Include Security's CSWSH research (April 2025) showed that Firefox's Total Cookie Protection effectively blocks CSWSH, while Chrome still allows it in default configuration. The CWE identifier for missing WebSocket origin validation is CWE-1385. Reverb's `allowed_origins` is the first line of defense, with Laravel's channel authorization as the second layer.
