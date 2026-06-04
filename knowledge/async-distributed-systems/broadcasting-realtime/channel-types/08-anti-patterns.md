---
Domain: Async & Distributed Systems
Subdomain: Broadcasting & Real-Time
Knowledge Unit: K032 — Channel Types: Public, Private, Presence
Knowledge ID: K032
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Hardcoded "Yes" for All Channel Auth | Security | Critical |
| 2 | Presence Channels for Every Subscription | Performance | Medium |
| 3 | Database Queries in Auth Callbacks Without Caching | Performance | High |
| 4 | Registering Channels in Wrong Routes File | Configuration | High |
| 5 | Channel Name Collisions | Design | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Catch-All Channel Auth (`* -> true`) | Critical — disables all access control | Ban pattern in code review; static analysis rule |
| Presence Overuse (unnecessary state tracking) | Medium — bandwidth waste for non-collaborative features | Evaluate need for join/leave events before choosing presence |
| Subscription-Time Database Queries | High — auth becomes bottleneck under load | Cache auth results; use Redis for channel permissions |

---

## 1. Hardcoded "Yes" for All Channel Auth

### Category
Security

### Description
Registering a catch-all channel authorization callback that returns `true` for every channel pattern: `Broadcast::channel('*', fn () => true)`. This disables all access control — any authenticated user can subscribe to any private or presence channel.

### Why It Happens
- Developer wants to bypass auth during development and forgets to remove it
- Not understanding that the catch-all pattern `*` matches ALL channels including private and presence
- Convenience during prototyping without considering production implications
- Copy-paste from tutorials that show simplified auth callbacks
- "We'll fix it later" — never revisited

### Warning Signs
- `Broadcast::channel('*', ...)` exists in `routes/channels.php`
- Auth callback returns `true` unconditionally
- User A can subscribe to User B's private channel
- Private channel authorization is never actually checked
- Security audit reveals subscription to any channel succeeds

### Why Harmful
- ALL private and presence channels are accessible to any authenticated user
- User A can subscribe to User B's `private-orders.123` and receive all order updates
- Presence channel user data is exposed to unauthorized users
- The application's entire broadcasting security model is disabled
- No audit trail of who accessed which channels

### Consequences
- Data breach — user-specific data broadcast to unauthorized subscribers
- Privacy violation — users can observe other users' activity
- Presence channel exposes user data (names, avatars) to all
- Compliance violation (GDPR, HIPAA) for exposed personal data
- Complete security failure requiring emergency fix

### Alternative
- Remove the catch-all pattern entirely
- Register specific channel patterns with exact authorization logic:
  ```php
  Broadcast::channel('orders.{id}', fn ($user, $id) => $user->id === (int) Order::findOrFail($id)->user_id);
  ```
- Use access control checks in each callback, never return unconditional `true`

### Refactoring Strategy
1. Remove `Broadcast::channel('*', fn () => true)` immediately
2. Identify all channel patterns used in the application
3. Register each pattern with specific authorization callback
4. Test that authorized users can subscribe and unauthorized users receive 403
5. Add code review rule: no catch-all channel patterns

### Detection Checklist
- [ ] No `Broadcast::channel('*', ...)` pattern in codebase
- [ ] Every channel pattern has specific authorization logic
- [ ] No callback returns unconditional `true` without parameter check
- [ ] Unauthorized subscription returns 403
- [ ] Security audit confirms channel-level access control

### Related Rules
- register-channels-in-correct-file

### Related Skills
- Configure Channel Types — Public, Private, Presence

### Related Decision Trees
- Public vs Private Channel Selection

---

## 2. Presence Channels for Every Subscription

### Category
Performance

### Description
Using presence channels (`PresenceChannel`) for all real-time subscriptions, even when there is no need to track connected users or broadcast "who's online" state. Presence channels add join/leave event overhead and broadcast user data to all subscribers.

### Why It Happens
- Developer likes the presence features (here, joining, leaving) and uses them everywhere
- Not distinguishing between features that need online state and those that don't
- "Presence is cooler" — treating it as the default channel type
- Copy-paste from collaborative features (chat, document editing) to non-collaborative contexts
- Assuming presence is required for any authenticated channel

### Warning Signs
- Presence channels used for features that don't show online users
- High volume of join/leave events on every page navigation
- Users' online status broadcast unnecessarily to non-collaborative channel subscribers
- Bandwidth includes recurring user data payloads for every join/leave
- Client-side `here()`/`joining()`/`leaving()` callbacks are never implemented

### Why Harmful
- Each presence subscription fires join/leave events to ALL subscribers
- Page reload generates leave + join event burst — multiplied by number of users
- User data (name, avatar) is broadcast on every state change unnecessarily
- Presence channel overhead scales with number of subscribers, not just messages
- Broadcasting driver costs increase with message volume (Pusher/Ably charge per message)

### Consequences
- Unnecessary WebSocket traffic from join/leave events
- Higher broadcasting costs (more messages)
- User data exposed on channels that don't need it
- Client-side processing of join/leave events that have no UI
- Presence channel limits hit (Pusher limits concurrent presence subscribers)

### Alternative
- Use `PrivateChannel` for most user-specific subscriptions without online state
- Only use `PresenceChannel` when the feature needs to show "who's online" or broadcast user presence
- Evaluate: does the feature use `here()`, `joining()`, or `leaving()` callbacks? If not, use private.

### Refactoring Strategy
1. Identify all presence channels in the codebase
2. For each, check if `here()`/`joining()`/`leaving()` Echo callbacks are implemented
3. Replace unnecessary presence channels with `new PrivateChannel('...')`
4. Update event class `broadcastOn()` to return `PrivateChannel`
5. Verify subscription behavior still works with private channels

### Detection Checklist
- [ ] Presence channels used only when join/leave state tracking is needed
- [ ] No presence channel without corresponding `here()`/`joining()`/`leaving()` callbacks
- [ ] Private channels used for non-collaborative subscriptions
- [ ] Join/leave event volume is proportional to actual collaboration features
- [ ] No user data broadcast unnecessarily via presence channel state

### Related Rules
- return-user-data-from-presence-auth

### Related Skills
- Configure Channel Types — Public, Private, Presence

### Related Decision Trees
- Public vs Private Channel Selection

---

## 3. Database Queries in Auth Callbacks Without Caching

### Category
Performance

### Description
Querying the database directly inside channel auth callbacks for every subscription request. Under load, each subscription triggers a synchronous query — auth callbacks become a bottleneck, causing subscription timeouts.

### Why It Happens
- Auth callback naturally checks authorization against database records
- Developer doesn't consider that callbacks run on EVERY subscription attempt
- Not profiling auth callback latency under load
- Simple queries feel fast in development (low concurrency)
- No awareness that subscription is synchronous HTTP request to `/broadcasting/auth`

### Warning Signs
- Auth callback contains `DB::query()`, `Model::find()`, or `Model::where()`
- Subscription latency increases under concurrent users
- Database query count spikes during page load (multiple channels subscribed)
- Auth callback takes >50ms when database is under load
- Users report slow subscription or subscription timeouts

### Why Harmful
- Each private/presence subscription makes an HTTP request to `/broadcasting/auth`
- That request fires the auth callback, which queries the database
- Under load (100+ subscriptions/second), database connections pool is strained
- Slow callbacks delay subscription — users see "connecting..." for seconds
- Cascading failure: slow DB → slow auth → connection timeouts → more retries

### Consequences
- Subscription timeouts under load
- Database connection pool exhaustion from auth callback queries
- Degraded user experience — real-time features take seconds to connect
- Increased latency for all subscribers during concurrent connection bursts
- Database bottleneck for what should be a fast auth check

### Alternative
- Cache authorization results in Redis:
  ```php
  Broadcast::channel('orders.{id}', function ($user, $id) {
      return $user->id === (int) Cache::remember("order:{$id}:owner", 3600, fn() =>
          DB::table('orders')->where('id', $id)->value('user_id')
      );
  });
  ```
- Use eager-loaded relationships or user-level permissions cache
- For simple ownership checks, compare IDs without database query
- Use Redis for real-time channel permission storage

### Refactoring Strategy
1. Identify all auth callbacks that query the database
2. Add caching layer with appropriate TTL
3. For ownership checks, verify if the relationship is already cached
4. Measure subscription latency before and after caching
5. Monitor database query rate from auth callbacks

### Detection Checklist
- [ ] No direct database queries in auth callbacks
- [ ] Auth callbacks use cache for authorization data
- [ ] Subscription latency under 50ms under load
- [ ] Database query rate from auth is near zero (all cached)
- [ ] Cache invalidation strategy in place for authorization changes

### Related Rules
- keep-auth-callbacks-fast

### Related Skills
- Configure Channel Types — Public, Private, Presence

### Related Decision Trees
- Public vs Private Channel Selection

---

## 4. Registering Channels in Wrong Routes File

### Category
Configuration

### Description
Placing `Broadcast::channel()` calls in `routes/web.php` or `routes/api.php` instead of `routes/channels.php`. The broadcasting system specifically loads `routes/channels.php` — channel registrations in other files are never executed.

### Why It Happens
- Developer doesn't know about `routes/channels.php`
- Copy-paste from route patterns into the familiar `web.php` file
- Refactoring that reorganizes routes without separating channel routes
- Not reading the Laravel broadcasting setup guide
- Assuming all routes work regardless of file location

### Warning Signs
- Private/presence channel subscriptions return 403
- Auth callbacks are defined in `web.php` or `api.php`
- `routes/channels.php` is missing or empty
- Broadcasting works in development but produces 403 in production
- New developer subscriptions fail while existing ones work (if channels were registered before refactoring)

### Why Harmful
- Channel auth callbacks are never loaded — no authorization check fires
- All private and presence channel subscriptions return 403 (unauthorized)
- Real-time features that require authentication are completely broken
- Public channels still work (no auth needed) — masking the issue
- Debugging is confusing: auth callback code exists but never executes

### Consequences
- All private/presence channel features are broken
- Users cannot receive private notifications or join presence channels
- Support tickets: "real-time features not working"
- Hours of debugging auth, middleware, and broadcasting configuration
- Emergency fix to move channel registrations to the correct file

### Alternative
- Always register channel auth callbacks in `routes/channels.php`
- Only `Broadcast::channel()` calls belong there — no HTTP routes
- If code organization is needed, include sub-files from `routes/channels.php`

### Refactoring Strategy
1. Find all `Broadcast::channel()` calls outside `routes/channels.php`
2. Move them to `routes/channels.php`
3. Remove the `use Broadcast` import from other route files
4. Test private channel subscription (should succeed if auth passes)
5. Test unauthenticated subscription (should return 403)

### Detection Checklist
- [ ] All `Broadcast::channel()` calls are in `routes/channels.php`
- [ ] No channel registrations in `web.php`, `api.php`, or other route files
- [ ] `routes/channels.php` exists and is loaded
- [ ] Private channel subscriptions return 403 for unauthorized users
- [ ] Channel auth callbacks are executed (verify via logging)

### Related Rules
- register-channels-in-correct-file

### Related Skills
- Configure Channel Types — Public, Private, Presence

### Related Decision Trees
- Public vs Private Channel Selection

---

## 5. Channel Name Collisions

### Category
Design

### Description
Two or more features using the same or overlapping channel name patterns, causing events from one feature to be delivered to subscribers of another. The broadcast system delivers events to all subscribers of a channel — collisions cause data leaks across features.

### Why It Happens
- Generic channel names like `orders` or `notifications` without specific IDs
- Different teams choose similar channel names independently
- No channel name registry or documentation
- Feature copy-paste from another feature without updating channel names
- Assuming channel namespace isolation without explicit naming convention

### Warning Signs
- Echo listener receives events meant for a different feature
- User sees notifications intended for other users on shared channels
- Events from feature A trigger callbacks in feature B's code
- Testing shows events delivered to unexpected clients
- Channel naming convention is inconsistent across features

### Why Harmful
- Events leak across features — users see data meant for other features
- Client-side callbacks execute for unintended events
- Data from one feature mixed with another (e.g., order updates in chat feed)
- Broadcast payload parsing errors when payload shape doesn't match listener
- Security implications if sensitive data leaks to less-protected features

### Consequences
- Users see incorrect data in their UI
- Client-side errors from mismatched payload structures
- Confusing UX — notifications, updates, and messages mixed together
- Debugging nightmare — events firing callbacks in unrelated features
- Data privacy violations if user-specific data leaks to shared channels

### Alternative
- Use hierarchical channel naming with feature prefix: `orders.{orderId}`, `chat.{roomId}`, `notifications.{userId}`
- Always include a unique identifier in channel names (user ID, resource ID)
- Document all channel patterns in a single reference file
- Use `broadcastAs()` to provide unique event names within channels
- Review channel names for collisions during code review

### Refactoring Strategy
1. Create a channel name registry documenting all channel patterns and their features
2. Identify overlapping or ambiguous channel names
3. Rename channels to use feature-specific prefixes and unique identifiers
4. Update `broadcastOn()` in event classes
5. Update Echo listeners to use new channel names
6. Verify events are delivered only to intended channels

### Detection Checklist
- [ ] All channel names include feature-specific prefix
- [ ] Channel names include unique identifier (user ID, resource ID)
- [ ] No two features share the same channel name pattern
- [ ] `broadcastAs()` provides unique event names within channels
- [ ] Channel name registry documented in project
- [ ] Code review checks for channel naming collisions

### Related Rules
- register-channels-in-correct-file

### Related Skills
- Configure Channel Types — Public, Private, Presence

### Related Decision Trees
- Public vs Private Channel Selection
