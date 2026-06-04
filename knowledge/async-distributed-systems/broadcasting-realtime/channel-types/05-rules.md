# Rule Card: K032 — Channel Types: Public, Private, Presence

---

## Rule 1

**Rule Name:** use-private-channels-for-user-data

**Category:** Always

**Rule:** Always use private channels for user-specific data.

**Reason:** Public channels have no access control — any client with the channel name can subscribe.

**Bad Example:**
```php
return ['orders.'.$this->orderId]; // Public — any client can subscribe
```

**Good Example:**
```php
return [new PrivateChannel('orders.'.$this->orderId)]; // Authorized access only
```

**Exceptions:** Public announcements, system-wide notifications can use public channels.

**Consequences Of Violation:** A malicious user enumerates order IDs and subscribes to all order channels — intercepts order notifications, status updates, and personal data.

---

## Rule 2

**Rule Name:** return-user-data-from-presence-auth

**Category:** Always

**Rule:** Always return user data array from presence channel auth callbacks, not `true`.

**Reason:** Presence channels need user data to share with other subscribers — returning `true` causes an authorization error.

**Bad Example:**
```php
Broadcast::channel('chat.{id}', fn($user, $id) => true); // Error — expects array
```

**Good Example:**
```php
Broadcast::channel('chat.{id}', fn($user, $id) => [
    'id' => $user->id,
    'name' => $user->name,
    'avatar' => $user->avatar_url,
]);
```

**Exceptions:** None — presence channel callbacks must return user data.

**Consequences Of ViolATION:** The client receives an auth error and cannot subscribe to the presence channel — the user appears offline to all other subscribers.

---

## Rule 3

**Rule Name:** keep-auth-callbacks-fast

**Category:** Always

**Rule:** Always keep channel auth callbacks fast — avoid database queries and slow I/O.

**Reason:** Auth callbacks run synchronously on every subscription attempt — slow callbacks delay subscription.

**Bad Example:**
```php
Broadcast::channel('orders.{id}', function ($user, $id) {
    return $user->id === DB::table('orders')->find($id)->user_id; // DB query per sub
});
```

**Good Example:**
```php
Broadcast::channel('orders.{id}', function ($user, $id) {
    return $user->id === (int) Cache::remember("order:{$id}:owner", 3600, fn() =>
        DB::table('orders')->find($id)->user_id
    );
});
```

**Exceptions:** Low-traffic applications (< 10 subscriptions/second) can tolerate simple queries.

**Consequences Of ViolATION:** Under load, each subscription triggers a database query — auth callbacks become a bottleneck, causing subscription timeouts and degraded UX.

---

## Rule 4

**Rule Name:** register-channels-in-correct-file

**Category:** Always

**Rule:** Always register channel auth callbacks in `routes/channels.php`, not `web.php` or `api.php`.

**Reason:** The broadcasting system specifically loads `routes/channels.php` for channel authorization.

**Bad Example:**
```php
// routes/web.php — not loaded by broadcasting system
Broadcast::channel('orders.{id}', fn($user, $id) => $user->id === (int) $id);
```

**Good Example:**
```php
// routes/channels.php — loaded by broadcasting system
Broadcast::channel('orders.{id}', fn($user, $id) => $user->id === (int) $id);
```

**Exceptions:** None — the file location is fixed by the broadcasting system.

**Consequences Of ViolATION:** Auth callbacks never fire — all private and presence channel subscriptions return 403, effectively disabling all authenticated broadcasting.
