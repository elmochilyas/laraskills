# Decomposition: Websocket Security Tls Cors Auth Cswsh

## Topic Overview
WebSocket security spans multiple layers: transport security (WSS/TLS), origin validation (CORS, CSWSH prevention), authentication (token, session, ticket-based), authorization (channel-level via Laravel's broadcasting auth), and input validation (message size, payload sanitization). The primary threats are Cross-Site WebSocket Hijacking (CSWSH), where a malicious site uses the victim's cookies to open an authenticated WebSocket to your server, and data interception/eavesdropping on unencrypt...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
security/K24-websocket-security-tls-cors-auth-cswsh/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Websocket Security Tls Cors Auth Cswsh
- **Purpose:** WebSocket security spans multiple layers: transport security (WSS/TLS), origin validation (CORS, CSWSH prevention), authentication (token, session, ticket-based), authorization (channel-level via Laravel's broadcasting auth), and input validation (message size, payload sanitization). The primary threats are Cross-Site WebSocket Hijacking (CSWSH), where a malicious site uses the victim's cookies to open an authenticated WebSocket to your server, and data interception/eavesdropping on unencrypt...
- **Difficulty:** Intermediate
- **Dependencies:
  - K25: CVE-2026-23524 (Reverb Redis Deserialization)
  - K29: Private Channel Auth with JWT/Sanctum
  - K12: Channel Authorization (routes/channels.php)
  - K32: Nginx WebSocket Proxy Configuration

## Dependency Graph
**Depends on:**
  - K25: CVE-2026-23524 (Reverb Redis Deserialization)
  - K29: Private Channel Auth with JWT/Sanctum
  - K12: Channel Authorization (routes/channels.php)
  - K32: Nginx WebSocket Proxy Configuration

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Always WSS**: Use `wss://` in production; plain `ws://` is only for local development**Origin validation**: Explicit allowlist of trusted origins in Reverb/Pusher config**Token-based authentication**: Pass temporary tokens (JWT or ephemeral) to avoid cookie dependency**CSRF-like tokens for WebSocket**: Include a token in the WebSocket handshake URL or first message**Channel authorization**: Laravel's auth endpoint validates channel-level access (second layer after connection auth)**SameSite cookies**: Set `SameSite=Lax` or `Strict` on session cookies to limit cross-site request sending**TLS termination at Nginx**: Nginx handles WSS decryption so Reverb receives plain WS internally**Origin validation at server level**: Both Reverb and your Laravel auth endpoint should validate origins**Auth token in query string vs. first message**: Query string is simpler but logs the token; first message is more secure but requires custom protocol handling**Token in query string**: Appears in server logs, referrer headers, and browser history; use short-lived tokens or first-message auth**Origin validation limitations**: Non-browser clients (mobile apps, server-to-server) don't send the `Origin` header reliably**WSS overhead**: TLS handshake adds latency to initial connection (~50-200ms); mitigated by TLS session resumption**CSWSH protection vs. convenience**: More secure auth (first-message token) adds client-side complexityWSS handshake: TLS negotiation adds ~50-200ms to initial connection (worth it for security)TLS session resumption (session IDs, session tickets) reduces handshake overhead for reconnectionsOrigin validation via string comparison is O(n) in allowlist length; negligible costToken validation (JWT verification, database lookup) adds per-connection latencyMessage size limits prevent DoS via oversized payloads (configure in Reverb: `max_message_size`)Enable WSS with valid TLS certificate (Let's Encrypt for free certificates)Configure `allowed_origins` in `config/reverb.php` to restrict which domains can connectSet `forceTLS: true` in Echo configuration for productionNever expose the WebSocket server on plain HTTP in productionUse token-based authentication for API-driven apps; avoid cookie-only auth for WebSocketImplement CVE patching: keep Reverb at v1.7.0+ (CVE-2026-23524 fixed)Monitor WebSocket handshake failures for CSWSH attempts (wrong origin, invalid auth)Log WebSocket connection events with client IP, origin, and user ID for audit trailsRunning WebSocket on `ws://` (not WSS) in production (all traffic unencrypted, MITM vulnerable)Not configuring `allowed_origins` (any website can open WebSocket to your server)Relying solely on Cookie-based auth for WebSocket (vulnerable to CSWSH)Not updating Reverb after CVE announcements (CVE-2026-23524 had CVSS 9.8)Exposing Reverb on a public port without Nginx reverse proxy (bypasses WSS termination)Allowing `*` in CORS or `allowed_origins` in production**CSWSH exploit**: Missing origin validation allows attacker to hijack authenticated WebSocket connection, read private channel events, and send client events**TLS certificate expiry**: WSS connections fail with certificate errors; clients cannot connect**Token leakage**: Auth token in query string appears in access logs; log compromise leaks authentication tokens**Auth bypass**: Channel authorization callback returns true unconditionally; any connected user accesses any channel**Message injection**: No input validation on client events; malicious payloads broadcast to all channel membersRequired security configuration for all production Reverb deploymentsStandard for Pusher Channels and Ably (they handle transport security; you handle channel auth)OWASP WebSocket Security Cheat Sheet as the industry referenceLaravel's `allowed_origins` and channel authorization system provide defense in depthK25: CVE-2026-23524 (Reverb Redis Deserialization)K29: Private Channel Auth with JWT/SanctumK12: Channel Authorization (routes/channels.php)K32: Nginx WebSocket Proxy Configuration

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization