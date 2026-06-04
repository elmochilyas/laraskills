## Always Use Standard Reverb Environment Variables for Laravel Cloud
---
## Framework Usage
---
Always configure standard Reverb environment variables (`BROADCAST_CONNECTION`, `REVERB_APP_ID`, `REVERB_APP_KEY`, etc.) for Laravel Cloud deployments.
---
Laravel Cloud reads standard Reverb config to provision the managed WebSocket backend. Without these variables, broadcasting is not configured on the platform.
---
```env
# Missing broadcast config — no WebSocket infrastructure
```
---
```env
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=app-id
REVERB_APP_KEY=app-key
REVERB_APP_SECRET=app-secret
```
---
No common exceptions; standard Reverb env vars are required for Laravel Cloud broadcasting.
---
No WebSocket infrastructure provisioned; broadcasting non-functional.

## Always Monitor Connection Usage Against Plan Limits
---
## Maintainability
---
Always track WebSocket connection counts against Laravel Cloud's plan limits to avoid throttling or unexpected charges.
---
Laravel Cloud pricing is usage-based. Without monitoring, a traffic spike can exceed plan limits (causing connection rejection) or generate unexpected charges.
---
```bash
# No monitoring — surprise limits or charges
```
```bash
# Monitor connection count and compare to plan
current=$(curl -s /apps/123/connections | jq '.connections')
plan_limit=10000
if [ "$current" -gt "$((plan_limit * 0.8))" ]; then alert("Approaching plan limit"); fi
```
---
Applications with predictable traffic below plan thresholds. No common exceptions.
---
Connection throttling; unexpected charges; capacity surprises.

## Always Implement Channel Authorization
---
## Security
---
Always implement channel authorization via `/broadcasting/auth` — Laravel Cloud handles infrastructure, not application security.
---
Laravel Cloud manages WebSocket infrastructure, but channel authorization is still the application's responsibility. Skipping it leaves all channels accessible to any authenticated user.
---
```php
// No channel auth — all users can subscribe to all channels
```
```php
// routes/channels.php
Broadcast::channel('orders.{orderId}', fn($user, $orderId) => $user->id === (int)$orderId);
```
---
Public-channel-only applications. No common exceptions for private channels.
---
Unauthorized data access; data leakage across users.

## Always Test Geographic Latency for Global User Bases
---
## Performance
---
Always test WebSocket connection latency from target geographic regions when using Laravel Cloud.
---
Laravel Cloud's global edge distribution varies by region. Without testing, users in certain regions may experience high latency or poor real-time performance.
---
```javascript
// No latency testing — users in some regions have poor experience
```
```javascript
// Measure connection time from different regions
const start = Date.now();
const echo = new Echo({...});
echo.connector.pusher.connection.bind('connected', () => {
    console.log('Connection time:', Date.now() - start);
});
```
---
Single-region user bases. No common exceptions for global user bases.
---
High latency in unserved regions; poor real-time UX.

## Always Document a Migration Plan Off Laravel Cloud
---
## Maintainability
---
Always document the migration path from Laravel Cloud's managed WebSockets to self-hosted Reverb.
---
If requirements outgrow Laravel Cloud (cost, features, compliance), having a documented migration path prevents vendor lock-in and enables a smooth transition.
---
```php
/**
 * MIGRATION: Laravel Cloud → Self-Hosted Reverb
 * 1. Provision server with Nginx + Supervisor
 * 2. Copy REVERB_* env vars to new server
 * 3. Point DNS to new server
 * 4. Update Echo wsHost in frontend deploy
 * No event, channel, or Echo API changes needed
 */
```
---
No common exceptions; migration readiness is a production best practice.
---
Vendor lock-in; costly emergency migration; architecture constraints.
