## Always Set `BROADCAST_CONNECTION=pusher` Per Environment
---
## Framework Usage
---
Always set `BROADCAST_CONNECTION=pusher` with environment-specific credentials in each deployment environment.
---
Using the same Pusher credentials across development, staging, and production causes cross-environment message leakage and makes it impossible to distinguish traffic sources.
---
```env
# Same credentials everywhere — cross-environment bleeding
BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=prod-app-id
```
---
```env
# .env.staging
BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=staging-app-id
# .env.production
BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=prod-app-id
```
---
No common exceptions; credentials must be unique per environment.
---
Cross-environment message leakage; distinguishing traffic impossible.

## Always Configure Pusher Webhooks with Signature Verification
---
## Security
---
Always implement HMAC signature verification on Pusher webhook endpoints to prevent forged webhook calls.
---
Without signature verification, an attacker can POST fake webhook events (presence joins, channel occupancy) to your application, triggering incorrect business logic.
---
```php
Route::post('/pusher/webhook', function (Request $request) {
    $event = $request->all(); // No verification — forged events accepted
});
```
---
```php
Route::post('/pusher/webhook', function (Request $request) {
    $webhook = new PusherWebhook($request);
    if (!$webhook->isValid()) abort(401, 'Invalid signature');
    // Process verified events
});
```
---
No common exceptions; webhook signature verification is a security requirement.
---
Forged webhook events; incorrect presence state; security bypass.

## Always Disable Debug Mode in Production
---
## Performance
---
Always set Pusher debug mode to false in production environments.
---
Debug mode logs every Pusher API call including request URLs, response bodies, and timing information. In production, this generates significant log volume and performance overhead.
---
```php
// config/broadcasting.php
'options' => ['debug' => true], // Production performance impact
```
---
```php
'options' => ['debug' => env('PUSHER_DEBUG', false)], // Off in production
```
---
Development environments. No common exceptions for production.
---
Performance degradation; log flooding; sensitive data in logs.

## Always Monitor Pusher Usage Against Plan Limits
---
## Maintainability
---
Always track current connections and message counts against Pusher plan limits to proactively upgrade before hitting caps.
---
Pusher enforces hard connection and message limits per plan. Hitting the cap silently rejects new connections and drops messages, causing partial service outage.
---
```bash
# No monitoring — users silently rejected at limit
```
```bash
# Poll Pusher dashboard API for usage
usage=$(curl -u $key:$secret https://api.pusher.com/apps/$id/usage)
if usage.connections > plan_limit * 0.8; then alert("Approaching plan limit"); fi
```
---
Applications well below plan limits. No common exceptions.
---
Silent connection rejection; message drops; partial outage.

## Always Consider Reverb as a Cost-Effective Alternative at Scale
---
## Architecture
---
Always model the cost of Pusher versus self-hosted Reverb when approaching 10k+ concurrent connections.
---
Pusher costs $500+/month at 10k concurrent connections. At scale, self-hosted Reverb on a $100/month server may be significantly more cost-effective.
---
```bash
# Sticking with Pusher at 50k connections — $2500+/month
```
```bash
# Evaluate Reverb at scale:
# Pusher 50k connections: ~$2500/month
# Reverb on 4-core server: ~$100/month + ops overhead
```
---
Teams without operational capacity to self-host. No common exceptions.
---
Unnecessary costs at scale; budget constraints limit growth.

## Never Expose Pusher Secret in Client-Side Code
---
## Security
---
Never include the Pusher app secret in client-side JavaScript; only the app key is public.
---
The app secret authenticates all server-side API calls. Exposed in client code, it allows anyone to broadcast arbitrary events, manage channels, and access app settings.
---
```javascript
// Secret exposed in bundle — anyone can broadcast
PUSHER_APP_SECRET = 's3cret';
```
---
```php
// Secret stays server-side in config/broadcasting.php
'secret' => env('PUSHER_APP_SECRET'),
```
---
No common exceptions; the secret must never be client-accessible.
---
Unauthorized broadcasts; app takeover; data leakage.
