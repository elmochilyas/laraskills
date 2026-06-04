# Anti-Patterns: Self-Hosted Analytics Platforms

## Direct Browser-to-Analytics Tracking
The JavaScript tracking snippet points directly to the analytics server's IP or hostname. Ad blockers see the request and block it. Users can identify the analytics server. The analytics server is exposed to the internet.

**Solution:** Always proxy tracking requests through a reverse proxy or Laravel application URL. Configure the tracking snippet to point to the proxy URL.

## Running Analytics on the Application Server
Plausible or Matomo runs on the same server as the Laravel application. Analytics database queries compete with application database queries for memory and I/O. An analytics traffic spike slows down the application.

**Solution:** Separate analytics infrastructure from application infrastructure. At minimum, use separate databases and separate PHP processes.

## Unlimited Data Retention Without Planning
No retention limits configured on the analytics platform. Event data accumulates for years. Database size grows unbounded, query performance degrades, and backup times become unmanageable.

**Solution:** Configure data retention policies from day one. Prune or aggregate old data. Plan for archival strategy.

## Ignoring Analytics Server Logs
The analytics server generates access and error logs that contain visitor information. If these logs are stored without anonymization, they become a GDPR exposure.

**Solution:** Configure the reverse proxy to anonymize IPs before forwarding to the analytics server. Ensure proxy logs also anonymize or exclude IP data.

## PostHog Without Session Recording Limits
Enabling PostHog session recording without configuring storage limits or retention. A few days of session recording fills the disk, causing PostHog to crash and lose all analytics data.

**Solution:** Configure session recording limits: maximum recording duration per session, sampling rate, and retention period. Monitor disk usage daily.
