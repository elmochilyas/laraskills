# ECC Anti-Patterns — WebSocket Security (TLS, CORS, Auth, CSWSH)

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Security |
| **Knowledge Unit** | WebSocket Security (TLS, CORS, Auth, CSWSH) |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Plain WS in Production (No TLS)
2. Wildcard or Empty `allowed_origins` (CSWSH Vulnerability)
3. Cookie-Only Authentication for WebSocket
4. Relying on CORS for WebSocket Protection
5. Single Origin Validation Layer

---

## Repository-Wide Anti-Patterns

- God Services
- Hidden Database Queries

---

## Anti-Pattern 1: Plain WS in Production (No TLS)

### Category
Security

### Description
Using plain `ws://` instead of `wss://` in production, transmitting all WebSocket communication unencrypted and exposing event payloads to eavesdropping and MITM attacks.

### Warning Signs
- Echo configured with `forceTLS: false`
- Client connects via `ws://` in production
- No TLS certificate configured for WebSocket endpoint
- WebSocket traffic visible in plaintext on the network

### Why It Is Harmful
Plain `ws://` transmits all real-time data unencrypted over the network. Any party with access to the network path (ISP, corporate firewall, WiFi hotspot operator, attacker on the same network) can read every WebSocket frame. Event payloads often contain sensitive data: user IDs, order information, chat messages, system metrics, or authentication tokens.

### Real-World Consequences
A SaaS application uses `ws://` in production for simplicity. Employees access it from a coffee shop WiFi. An attacker on the same network captures WebSocket frames using Wireshark. They extract event payloads containing order details, customer names, and payment amounts — all in plaintext. The attacker uses this for social engineering attacks against customers.

### Preferred Alternative
Enforce WSS in production by setting `forceTLS: true` in Echo and terminating TLS at Nginx.

### Refactoring Strategy
1. Configure TLS certificate for the WebSocket domain
2. Set `forceTLS: true` in Echo configuration
3. Update client connection URL from `ws://` to `wss://`
4. Verify DevTools shows encrypted WebSocket frames

### Detection Checklist
- [ ] `ws://` in production
- [ ] `forceTLS: false`
- [ ] No TLS certificate for WebSocket

### Related Rules
- (Rule: Always use WSS in production)

---

## Anti-Pattern 2: Wildcard or Empty `allowed_origins` (CSWSH Vulnerability)

### Category
Security

### Description
Setting `allowed_origins` to `['*']` or leaving it empty in Reverb config, allowing any website to open WebSocket connections to the server and enabling Cross-Site WebSocket Hijacking (CSWSH).

### Warning Signs
- `allowed_origins` set to `['*']` in production
- `allowed_origins` array empty
- No origin validation on WebSocket connections
- WebSocket accessible from any website

### Why It Is Harmful
The browser's Same-Origin Policy does not restrict WebSocket connections — any website can open a WebSocket to any server. Without origin validation, an attacker's page can open a WebSocket to your Reverb server using the victim's session (cookies sent automatically). The attacker subscribes to channels and receives real-time events containing the victim's data.

### Real-World Consequences
An attacker creates `evil.com` with JavaScript that opens a WebSocket to `wss://example.com`. The victim's browser automatically sends cookies for `example.com`. The attacker subscribes to the user's private notification channel and receives all their real-time notifications — including order updates, messages, and personal data.

### Preferred Alternative
Configure `allowed_origins` with an explicit allowlist of specific domains — never use wildcards in production.

### Refactoring Strategy
1. Replace `['*']` with explicit domain list in `config/reverb.php`
2. Include all first-party domains that need WebSocket access
3. Test that unauthorized origins receive 403
4. Add middleware-level origin validation for defense in depth

### Detection Checklist
- [ ] `allowed_origins` set to `['*']` or empty
- [ ] Any domain can connect to WebSocket
- [ ] No origin validation on connections

### Related Rules
- (Rule: Always configure allowed_origins with an explicit allowlist)

---

## Anti-Pattern 3: Cookie-Only Authentication for WebSocket

### Category
Security

### Description
Relying solely on cookie-based authentication for WebSocket connections, which browsers automatically attach to the WebSocket upgrade request — enabling CSWSH attacks.

### Warning Signs
- No auth token sent in WebSocket connection
- Echo configured without `auth.headers`
- Session cookie used for WebSocket authentication
- WebSocket auth callback reads session only

### Why It Is Harmful
Browsers automatically send cookies with WebSocket upgrade requests. This means an attacker's page can trigger a WebSocket connection to your server, and the victim's browser will attach their session cookie. The server authenticates the connection based on the cookie, granting the attacker access to the victim's channels. Token-based authentication requires the attacker to know the token — they cannot obtain it from cross-origin requests.

### Real-World Consequences
An attacker's website opens a WebSocket to a victim's banking app. The browser sends session cookies. The server authenticates the connection using the cookie. The attacker subscribes to the victim's transaction notification channel and receives real-time alerts about transfers and payments.

### Preferred Alternative
Use token-based authentication (Bearer tokens) for WebSocket connections. Tokens are explicitly provided and not automatically attached by browsers.

### Refactoring Strategy
1. Generate a short-lived auth token on login
2. Configure Echo to send the token in auth headers
3. Validate the token in the broadcast auth callback
4. Set cookies with `SameSite=Strict` for defense in depth
5. Test that connections without valid tokens are rejected

### Detection Checklist
- [ ] Cookie-only WebSocket authentication
- [ ] No token-based auth for Echo
- [ ] Auth callback relies on session alone

### Related Rules
- (Rule: Always use token-based authentication over cookie-only)

---

## Anti-Pattern 4: Relying on CORS for WebSocket Protection

### Category
Security

### Description
Configuring CORS headers expecting them to restrict WebSocket access, when the browser does not enforce CORS preflight for WebSocket upgrade requests.

### Warning Signs
- CORS headers configured as primary WebSocket security
- No `allowed_origins` in Reverb config
- Team believes CORS protects WebSocket
- Cross-origin WebSocket works despite CORS settings

### Why It Is Harmful
CORS (Cross-Origin Resource Sharing) does not apply to WebSocket connections. Browsers do not send a CORS preflight (`OPTIONS`) request before WebSocket upgrades. They directly initiate the WebSocket handshake. The `Access-Control-Allow-Origin` header has no effect on WebSocket connections. Relying on CORS for WebSocket protection provides zero security while creating a false sense of safety.

### Real-World Consequences
A team sets `header('Access-Control-Allow-Origin: https://example.com')` and believes WebSocket is protected. An attacker creates `evil.com` with a WebSocket connection to the server. The browser allows the connection (no CORS enforcement for ws://). The attacker accesses the victim's channels. The team is shocked because "CORS was configured."

### Preferred Alternative
Use server-side origin validation via Reverb's `allowed_origins` config — the only effective defense against CSWSH.

### Refactoring Strategy
1. Configure `allowed_origins` in `config/reverb.php`
2. Remove CORS headers if they were intended for WebSocket protection
3. Verify cross-origin WebSocket connections are blocked
4. Educate the team that CORS does not protect WebSocket

### Detection Checklist
- [ ] CORS relied on for WebSocket protection
- [ ] No `allowed_origins` configured
- [ ] Cross-origin WebSocket works despite CORS

### Related Rules
- (Rule: Never rely solely on CORS for WebSocket protection)

---

## Anti-Pattern 5: Single Origin Validation Layer

### Category
Security

### Description
Configuring origin validation in only one place (Reverb config or application middleware) instead of both, creating a single point of failure for CSWSH protection.

### Warning Signs
- Origin validation configured only in Reverb config
- No application-level origin validation middleware
- Security relies on a single configuration file
- No defense-in-depth for WebSocket origin check

### Why It Is Harmful
A single validation layer can be bypassed or misconfigured. A Reverb config typo (`allowed_origins` misspelled), an environment override that clears the array, or a deployment that deploys without the production config can all silently disable origin validation. With two independent layers, a failure in one is caught by the other.

### Real-World Consequences
A deployment script overwrites `config/reverb.php` with a default config that has `allowed_origins = []`. Without application-level validation, the Reverb server now accepts connections from any origin. CSWSH protection is silently disabled. A security audit 3 months later discovers the issue. The application was vulnerable for the entire period.

### Preferred Alternative
Validate origins at both the Reverb config level and the Laravel application middleware level for defense in depth.

### Refactoring Strategy
1. Configure `allowed_origins` in `config/reverb.php` with explicit domains
2. Create a middleware that validates the `Origin` header against the same allowlist
3. Apply the middleware to the broadcasting auth route and WebSocket endpoints
4. Test that connections from unauthorized origins are rejected

### Detection Checklist
- [ ] Origin validation in only one layer
- [ ] No application-level origin middleware
- [ ] Single config error can disable CSWSH protection

### Related Rules
- (Rule: Always validate origins at both Reverb and application level)
