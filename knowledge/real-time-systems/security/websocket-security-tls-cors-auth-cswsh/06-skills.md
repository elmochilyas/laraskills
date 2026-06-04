# Skill: Secure WebSocket Connections with TLS, Origin Validation, and Auth

## Purpose
Implement defense-in-depth security for WebSocket connections: enforce WSS transport, validate origins to prevent CSWSH, use token-based authentication, and configure channel-level authorization.

## When To Use
- All production Reverb deployments (WSS is mandatory)
- Any application handling user data or requiring authentication
- Multi-tenant applications where channel isolation is critical

## When NOT To Use
- Local development environments (plain WS is acceptable)
- Internal-only services on isolated networks

## Prerequisites
- SSL/TLS certificate for WSS (terminated at Nginx or at Reverb)
- Reverb configured with `allowed_origins`
- Authentication system (Sanctum, JWT, or custom tokens)
- Channel authorization via `routes/channels.php`

## Inputs
- Echo configuration (forceTLS, auth headers)
- Reverb config (`allowed_origins`)
- Nginx TLS configuration
- Token-based auth implementation

## Workflow
1. Enforce WSS in production: `forceTLS: true` in Echo configuration
2. Terminate TLS at Nginx, proxy plain WS to Reverb internally
3. Configure `allowed_origins` with explicit allowlist in Reverb config
4. Implement token-based authentication for WebSocket auth endpoint
5. Set SameSite cookies to Lax or Strict for defense in depth
6. Validate origins at both Reverb level and application middleware level
7. Configure message size limits in Reverb (`max_message_size`)
8. Implement channel-level authorization via `routes/channels.php`
9. Keep Reverb updated to latest version for security patches
10. Test CSWSH scenario: malicious page attempting WebSocket connection

## Validation Checklist
- [ ] WSS enforced in production (`forceTLS: true` in Echo)
- [ ] `allowed_origins` configured with explicit allowlist (no wildcards)
- [ ] TLS certificate valid and not expired
- [ ] Token-based authentication used (not cookie-only)
- [ ] Reverb updated to v1.7.0+ for CVE fix
- [ ] Channel authorization via `/broadcasting/auth` implemented
- [ ] Message size limits configured in Reverb
- [ ] SameSite cookies set to Lax or Strict
- [ ] Origin validation at both Reverb and application level

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| WebSocket traffic sent in plaintext | `forceTLS: false` or missing Nginx TLS | Set `forceTLS: true`, terminate TLS at Nginx |
| CSWSH: malicious page opens WS | No `allowed_origins` or wildcard set | Set explicit allowlist |
| Cookie sent automatically enabling CSWSH | Cookie-only auth with no token | Implement Bearer token auth |
| WebSocket handshake fails due to origin | Missing origin in `allowed_origins` | Add origin to Reverb config |
| CORS error but WebSocket still connects | Mistaking CORS for WebSocket protection | Use server-side origin validation — CORS doesn't apply to WS |

## Decision Points
- **Auth token vs cookie**: Token-based auth for CSWSH resistance; cookie-only only for isolated internal apps
- **Single vs dual origin validation**: Dual (Reverb + app middleware) for defense in depth; single for simpler setups
- **TLS at Nginx vs Reverb**: Terminate at Nginx for performance; only terminate at Reverb if no Nginx proxy

## Performance/Security Considerations
- WSS handshake adds ~50-200ms for TLS negotiation (acceptable for security)
- TLS session resumption reduces handshake overhead for reconnections
- Origin validation via string comparison is O(n) in allowlist length — negligible cost
- Token validation (JWT verification) adds per-connection latency
- CSWSH is the primary WebSocket-specific threat; origin validation is the primary defense

## Related Rules (from 05-rules.md)
- Always Use WSS in Production
- Always Configure `allowed_origins` with an Explicit Allowlist
- Always Use Token-Based Authentication Over Cookie-Only
- Never Rely Solely on CORS for WebSocket Protection
- Always Validate Origins at Both Reverb and Application Level
- Always Keep Reverb Updated for Security Patches

## Related Skills
- Configure Nginx as a WebSocket Proxy for Reverb
- Patch and Protect Against CVE-2026-23524 (Reverb Redis Deserialization)
- Use Private Channel Auth with JWT/Sanctum

## Success Criteria
- All WebSocket traffic uses WSS (encrypted) in production
- Only allowlisted origins can establish WebSocket connections
- CSWSH attack fails: malicious page cannot open authenticated WebSocket
- Channel-level authorization prevents unauthorized subscription
- Reverb is updated to latest patched version
