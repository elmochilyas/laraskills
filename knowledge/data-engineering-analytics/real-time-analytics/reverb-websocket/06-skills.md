# Skills: Laravel Reverb WebSocket Broadcasting

## Skill: Setting Up Reverb for Analytics Dashboards
**Purpose:** Deploy and configure Reverb for real-time analytics broadcasting.
**When to use:** Adding real-time updates to analytics dashboards.
**Steps:**
1. Install Reverb via Composer
2. Configure Reverb application ID, key, and secret
3. Start Reverb server with `php artisan reverb:start`
4. Configure Echo on the client side with correct endpoints
5. Create ShouldBroadcast event for analytics updates
6. Implement private channel authorization
7. Test real-time delivery with Laravel Echo
8. Configure Nginx reverse proxy with TLS
