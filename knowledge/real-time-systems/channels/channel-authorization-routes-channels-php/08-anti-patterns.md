# ECC Anti-Patterns — Channel Authorization (routes/channels.php)

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Channel Types & Authorization |
| **Knowledge Unit** | Channel Authorization (routes/channels.php) |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Monolithic Auth Callback
2. Returning `true` Unconditionally
3. Database Queries in Every Auth Callback
4. Auth Callback in Web Routes File
5. No Rate Limiting on Broadcast::routes()

---

## Repository-Wide Anti-Patterns

- God Services
- Massive Configuration Files

---

## Anti-Pattern 1: Monolithic Auth Callback

### Category
Maintainability

### Description
Creating a single auth callback that handles authorization for all channels via string parsing and conditional logic, defeating the purpose of pattern matching.

### Warning Signs
- Single `Broadcast::channel('*', ...)` or using wildcard match-all pattern
- Callback contains `switch`/`if` statements parsing channel name
- Complex logic determining authorization from manually extracted parameters
- No use of wildcard `{param}` placeholders

### Why It Is Harmful
Laravel's channel authorization is designed for pattern matching. A monolithic callback that manually parses channel names duplicates the framework's pattern matching, creates complex untestable logic, and prevents clean separation of authorization concerns.

### Real-World Consequences
A single `Broadcast::channel('{channel}', ...)` callback handles all channels. It parses `$channel` with regex to extract resource type and ID, then checks authorization. The callback is 80 lines of switch statements. Adding a new channel type requires modifying this monolithic function.

### Preferred Alternative
Use separate `Broadcast::channel()` registrations per channel pattern with wildcard parameters.

### Refactoring Strategy
1. Replace wildcard pattern with explicit per-resource patterns
2. Use `{param}` wildcards for variable parts
3. Move each authorization check to its own callback

### Detection Checklist
- [ ] Single catch-all channel pattern
- [ ] Manual channel name parsing in callback
- [ ] Complex conditional logic in callback

### Related Rules
- (Implied: use separate channel patterns — from anti-patterns in knowledge)

---

## Anti-Pattern 2: Returning `true` Unconditionally

### Category
Security

### Description
Returning `true` from a channel authorization callback without checking the authenticated user's authorization, allowing any authenticated user to subscribe to any matching channel.

### Warning Signs
- Auth callback contains `return true;` without conditions
- Private channel with matching pattern accessible by any user
- Orders, chats, or other user-scoped channels accessible cross-user
- No authorization check before returning true

### Why It Is Harmful
Returning `true` unconditionally bypasses all authorization. Any authenticated user can subscribe to any channel matching the pattern. A channel named `orders.{id}` intended for the order owner is accessible by any logged-in user.

### Real-World Consequences
A channel pattern `orders.{orderId}` has callback `fn($user, $orderId) => true`. User Alice can subscribe to `orders.5` (Bob's order) and receive all order updates. Alice sees Bob's shipping address and payment status.

### Preferred Alternative
Always check user authorization against the resource. Return `false` or falsy for unauthorized access.

### Refactoring Strategy
1. Identify all callbacks returning `true` unconditionally
2. Replace with actual authorization check
3. Use `$user->id === (int)$param` or Gate delegation

### Detection Checklist
- [ ] Auth callback returns `true` unconditionally
- [ ] Cross-user data accessible on private channels
- [ ] No authorization logic in callback

### Related Rules
- (Rule: Never return `true` unconditionally from auth callbacks)

---

## Anti-Pattern 3: Database Queries in Every Auth Callback

### Category
Performance

### Description
Running database queries (including model binding) in every channel auth callback, creating database load proportional to subscription rate and cascading failures during reconnection storms.

### Warning Signs
- Auth callbacks contain database queries
- Route-model binding used (adds automatic query)
- Database CPU spikes during reconnection storms
- Auth endpoint latency increases under load
- No caching for repeated authorization checks

### Why It Is Harmful
Auth callbacks execute on every subscription attempt. A database query per callback means every page load, every reconnection, and every re-subscription queries the database. During reconnection storms (network recovery, deploy), this cascades into database overload.

### Real-World Consequences
A reconnection storm after network recovery triggers 10,000 concurrent auth requests. Each callback queries the database. Database connections max out at 100. 9,900 requests queue and timeout. Users see 5+ second auth times. Some give up and refresh, triggering more auth requests.

### Preferred Alternative
Use simple ID comparisons where authorization can be determined without database queries. Cache repeated lookups for model-based authorization.

### Refactoring Strategy
1. Replace model binding with manual ID comparison when possible
2. Add caching for authorization results (e.g., cache user-order ownership)
3. Benchmark auth endpoint under load

### Detection Checklist
- [ ] Database queries in auth callbacks
- [ ] Route-model binding in callbacks
- - [ ] Auth latency increases under reconnection load

### Related Rules
- (Implied: minimize database queries in auth callbacks — from anti-patterns in knowledge)

---

## Anti-Pattern 4: Auth Callback in Web Routes File

### Category
Code Organization

### Description
Defining channel authorization callbacks in `routes/web.php` alongside HTTP routes, mixing concerns and making channel authorization hard to find and maintain.

### Warning Signs
- `Broadcast::channel()` calls in `routes/web.php`
- Channel auth logic interleaved with HTTP route definitions
- Every HTTP route file edit risks breaking channel authorization
- No separate `routes/channels.php` usage

### Why It Is Harmful
Channel authorization is a distinct concern from HTTP routing. Mixing them creates confusion, increases the risk of accidental changes to authorization logic during HTTP route edits, and makes it harder for new developers to find channel auth configuration.

### Real-World Consequences
A developer editing `routes/web.php` accidentally deletes or comments out a `Broadcast::channel()` call thinking it's dead code. All private channel subscriptions fail. It takes 3 days to discover that the channel registration was removed from the web routes file.

### Preferred Alternative
Place all channel authorization in the dedicated `routes/channels.php` file.

### Refactoring Strategy
1. Move all `Broadcast::channel()` calls to `routes/channels.php`
2. Include the file in `bootstrap/app.php` if not already loaded
3. Verify all channel auth still works

### Detection Checklist
- [ ] `Broadcast::channel()` in `routes/web.php`
- [ ] No `routes/channels.php` file used
- [ ] Channel auth mixed with HTTP routes

### Related Rules
- (Implied: use dedicated routes/channels.php — from best practices in knowledge)

---

## Anti-Pattern 5: No Rate Limiting on Broadcast::routes()

### Category
Security

### Description
Registering `Broadcast::routes()` without rate limiting, leaving the auth endpoint vulnerable to abuse and DoS attacks.

### Warning Signs
- `Broadcast::routes()` without throttle middleware
- Auth endpoint receives high request volume without limiting
- No rate limiting configured for `/broadcasting/auth`
- Auth endpoint DoS not prevented

### Why It Is Harmful
Without rate limiting, an attacker can flood the `/broadcasting/auth` endpoint with requests, causing database load from auth callbacks and potentially a DoS condition. During reconnection storms, the uncontrolled auth volume compounds infrastructure load.

### Real-World Consequences
An attacker sends 100,000 POST requests to `/broadcasting/auth` in 5 minutes. Each request triggers a database query from the auth callback. The database CPU spikes to 100%. Real users' auth requests timeout or fail. Private channel subscriptions stop working for 10 minutes.

### Preferred Alternative
Always apply rate limiting middleware to `Broadcast::routes()`.

### Refactoring Strategy
1. Add throttle middleware: `Broadcast::routes(['middleware' => ['auth:sanctum', 'throttle:100,1']])`
2. Set appropriate rate limit based on expected connection rate
3. Verify rate-limited requests return 429

### Detection Checklist
- [ ] `Broadcast::routes()` without throttle
- [ ] No rate limiting on auth endpoint
- [ ] Auth endpoint vulnerable to DoS

### Related Rules
- (Rule: Always register Broadcast::routes() with proper middleware)
