# Anti-Patterns: Laravel Telescope Debugging for HTTP Client Calls

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | observability-monitoring |
| Knowledge Unit | Laravel Telescope Debugging for HTTP Client Calls |
| Difficulty | Intermediate |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Production Full Data Capture on High-Traffic Applications | Performance | Critical |
| 2 | No Sensitive Data Redaction in Captured Entries | Security | Critical |
| 3 | Telescope as Long-Term Monitoring Solution | Architecture | High |
| 4 | No Filtering of Health Check Noise | Observability | Medium |
| 5 | Expecting Telescope to Capture Non-Http-Facade HTTP Calls | Observability | Medium |

---

## Anti-Pattern 1: Production Full Data Capture on High-Traffic Applications

### Category
Performance

### Description
Leaving Telescope with full data capture enabled in production, storing every HTTP client request/response for every API call without sampling.

### Why It Happens
Telescope works out of the box. Developers enable it for debugging and forget to configure it for production. Since it works fine in development (low traffic), the performance impact in production is a surprise.

### Warning Signs
- `TELESCOPE_ENABLED=true` in production environment
- No `filter` callback configured in `config/telescope.php`
- `telescope_entries` table grows by gigabytes per day
- Database disk usage alert: 90%+ used by Telescope tables
- Dashboard queries for Telescope entries take 30+ seconds
- HTTP call response times increased by 15-50ms due to Telescope middleware + storage writes

### Why Harmful
Telescope writes every request/response to the database synchronously. On a high-traffic application making 100 API calls per minute, this means 100+ database writes per minute just for Telescope. Storage grows rapidly, database write throughput is consumed, and HTTP response times degrade.

### Real-World Consequences
- Production application makes 10,000 HTTP client calls per hour
- Telescope writes each request + response (avg 2KB each) = 20MB/hour = 480MB/day
- Database disk: 15GB/month growth from Telescope alone
- HTTP call latency increases by 30ms (Telescope middleware + DB write)
- Production incident: database disk full (Telescope 80%, real data 20%)
- Fix: disable Telescope, truncate entries table, lose all debugging data

### Preferred Alternative
Disable Telescope in production by default. Enable sampling (10-25%) for performance detection, or use on-demand enablement for specific debugging sessions.

```php
// config/telescope.php
'filter' => function ($entry) {
    if (app()->environment('production')) {
        if ($entry->type === 'request') {
            return mt_rand(1, 100) <= 10; // 10% sampling for HTTP calls
        }
        return false; // Don't capture other entry types in production
    }
    return true; // Full capture in non-production
},

// Or disable entirely in production:
// TELESCOPE_ENABLED=false in .env.production
// Enable on-demand: TELESCOPE_ENABLED=true php artisan serve
```

### Refactoring Strategy
1. Disable Telescope in production (`TELESCOPE_ENABLED=false`)
2. If production monitoring is needed, configure sampling (10-25%) via `filter` callback
3. Enable Telescope on-demand for debugging sessions (set `TELESCOPE_ENABLED=true` per request)
4. Set up automatic pruning with 24-48 hour retention
5. Monitor `telescope_entries` table size before and after changes

### Detection Checklist
- [ ] Telescope is disabled or sampled in production
- [ ] Storage growth from Telescope entries is bounded and acceptable
- [ ] HTTP call latency is not affected by Telescope middleware in production
- [ ] On-demand enablement works for debugging sessions
- [ ] Pruning is configured with appropriate retention

### Related Rules/Skills/Trees
- Rule: Enable Telescope with sampling in production for performance detection
- Rule: Production full data capture on high-traffic applications
- Related KU: Laravel Pulse for production metrics (alternative)

---

## Anti-Pattern 2: No Sensitive Data Redaction in Captured Entries

### Category
Security

### Description
Storing HTTP request/response data in Telescope without redacting sensitive information (API keys, Authorization headers, PII), making sensitive data accessible through the Telescope dashboard.

### Why Happens
Telescope captures everything by default. Developers don't configure the `filter` or `watcher` to redact sensitive headers and body fields.

### Warning Signs
- Telescope entries show `Authorization: Bearer sk_live_***` (full API keys visible)
- Request bodies with user PII (email, phone, address) are stored in plain text
- Response bodies containing customer data are fully visible in Telescope
- No `filter` callback redacts sensitive data
- Telescope entries table contains sensitive data readable by anyone with dashboard access

### Why Harmful
Telescope entries persist in the database (even if only for 24-48 hours). Anyone with Telescope dashboard access can see API keys, OAuth tokens, PII, and internal data. A database breach exposes all captured HTTP traffic. Compliance regulations (GDPR, PCI-DSS, SOC2) require protection of such data.

### Real-World Consequences
- Developer shares Telescope screenshot on GitHub issue; API key visible in request headers
- API key exposed for 48 hours (Telescope retention) before automatic pruning
- Attacker with DB access extracts Authorization headers: all API keys for all integrations
- PII visible in Telescope entries: GDPR violation for storing user data without purpose
- Compliance audit flags Telescope entries as unsecured sensitive data storage
- Remediation: delete all Telescope entries, disable capture until redaction is implemented

### Preferred Alternative
Configure Telescope's `filter` callback to redact sensitive headers and body fields before storage.

```php
// config/telescope.php
'filter' => function ($entry) {
    if ($entry->type === 'request') {
        // Redact sensitive headers
        $entry->content['headers'] = collect($entry->content['headers'])
            ->map(fn ($value, $key) => in_array(strtolower($key), [
                'authorization', 'x-api-key', 'cookie', 'stripe-signature',
            ]) ? '[REDACTED]' : $value)
            ->toArray();
        
        // Redact sensitive body fields
        if (isset($entry->content['body'])) {
            $body = json_decode($entry->content['body'], true);
            foreach (['password', 'secret', 'token', 'ssn', 'card_number'] as $field) {
                if (isset($body[$field])) {
                    $body[$field] = '[REDACTED]';
                }
            }
            $entry->content['body'] = json_encode($body);
        }
    }
    return $entry;
},
```

### Refactoring Strategy
1. Audit captured Telescope entries for sensitive data
2. Implement `filter` callback that redacts headers (Authorization, Cookie, API-Key) and body fields (password, token, secret, SSN)
3. Test redaction by checking stored entries after configuration
4. Clear existing entries that may contain unredacted sensitive data
5. Document redaction policy and maintain list of redacted fields

### Detection Checklist
- [ ] Authorization headers are redacted in captured entries
- [ ] API keys and tokens are not stored in plain text
- [ ] PII in request/response bodies is redacted
- [ ] Redaction is tested and verified
- [ ] Existing unredacted entries have been cleared

### Related Rules/Skills/Trees
- Rule: Redact sensitive data (Authorization, API keys) via filter
- Rule: Capturing sensitive data visible in Telescope entries
- Related KU: Data security and redaction

---

## Anti-Pattern 3: Telescope as Long-Term Monitoring Solution

### Category
Architecture

### Description
Using Telescope as a long-term monitoring and historical analysis tool instead of a debugging aid, relying on its entries for trend analysis, capacity planning, and historical performance data.

### Why It Happens
Telescope captures detailed data that is useful for debugging. Teams extend its retention and rely on it for "monitoring" instead of setting up proper monitoring tools (Pulse, Prometheus, custom dashboards).

### Warning Signs
- Telescope retention is set to 30+ days (intended for historical analysis)
- Repeat queries: "filter Telescope entries to see latency trends over last month"
- No dedicated monitoring solution exists (Pulse, Grafana, DataDog)
- Telescope entries are exported for monthly performance reports
- Team plans to increase retention instead of building proper monitoring
- Telescope dashboard is bookmarked as the primary observability tool

### Why Harmful
Telescope is designed for debugging, not monitoring. Its storage is not optimized for time-series queries, its retention policies are not designed for long-term data management, and its dashboard is not built for trend analysis. Using it as a monitoring tool leads to storage problems, slow queries, and missing monitoring features (alerts, SLO tracking, anomaly detection).

### Real-World Consequences
- Telescope retention set to 90 days; entries table has 50M records
- Dashboard queries for "latency trend over last month" take 45 seconds
- Team builds custom scripts to aggregate Telescope data for reports
- Resource-constrained: Telescope consumes 80% of database I/O
- No alerting: Telescope captures data but doesn't alert on anomalies
- Proper monitoring tool eventually implemented; Telescope data migration required

### Preferred Alternative
Use Telescope for short-term debugging (24-48 hour retention). Use proper monitoring tools (Laravel Pulse, Prometheus/Grafana, DataDog) for trend analysis, alerting, and long-term metrics.

```php
// config/telescope.php — keep retention short
'prune' => [
    'threshold' => 48, // hours — Telescope is for debugging, not monitoring
],

// Use Pulse for metrics and trends (config/pulse.php)
// Use Horizon for queue monitoring
// Use Prometheus/Grafana for long-term storage and alerting
```

### Refactoring Strategy
1. Reduce Telescope retention to 24-48 hours (debugging window only)
2. Export any needed historical data from Telescope before pruning
3. Implement proper monitoring with Pulse (metrics), Horizon (queue), and/or Prometheus (long-term)
4. Update team documentation: Telescope = debugging, Pulse = monitoring
5. Remove Telescope data from any reporting or analysis pipelines

### Detection Checklist
- [ ] Telescope retention is 48 hours or less
- [ ] Proper monitoring tools (Pulse, Prometheus, Grafana) exist for trend analysis
- [ ] No reporting or analysis depends on Telescope data
- [ ] Team understands Telescope is for debugging, not monitoring
- [ ] Telescope data is not used for capacity planning or trend analysis

### Related Rules/Skills/Trees
- Rule: Enable Telescope in production with sampling for performance issue detection
- Rule: Combine Telescope with Horizon for complete integration observability
- Related KU: Laravel Pulse (production metrics and monitoring)

---

## Anti-Pattern 4: No Filtering of Health Check Noise

### Category
Observability

### Description
Capturing health check HTTP calls (ping/pong endpoints called every 30-60 seconds) in Telescope alongside real API integration calls, cluttering the entries with non-actionable data.

### Why Happens
Telescope captures all HTTP client calls by default. Health checks use the same Http facade, so they appear in Telescope entries alongside real integration calls.

### Warning Signs
- Health check endpoints represent 30-50% of all Telescope entries
- Finding real integration issues requires filtering through health check noise
- Health check entries are indistinguishable from real API calls in the dashboard
- No URL pattern filtering in Telescope configuration
- Health checks consume a significant portion of Telescope storage and sampling budget

### Why Harmful
Health check entries crowd out real integration data in Telescope's sampled view. If sampling is 10%, health checks consume 3-5% of that budget for non-actionable data. Debugging an integration issue requires wading through health check entries.

### Real-World Consequences
- Telescope sampling is 10%; 6 integrations each checked every 30 seconds
- Health checks: 720 entries/hour + real traffic: 100 non-health entries/hour
- 88% of Telescope entries are health checks; only 12% show real integration calls
- Developer investigating payment API issue sees mostly "GET /v1/charges?limit=1" (health check)
- Real payment API calls are buried; finding them requires filtering by URL
- Sampling budget is mostly wasted on health check data

### Preferred Alternative
Filter out health check HTTP calls from Telescope capture using URL pattern matching.

```php
// config/telescope.php
'filter' => function ($entry) {
    if ($entry->type === 'request') {
        $url = $entry->content['uri'] ?? '';
        
        // Exclude health check URLs
        if (preg_match('#/health|/ping|/status|health-check#i', $url)) {
            return false;
        }
        
        // Production sampling for real calls
        if (app()->environment('production')) {
            return mt_rand(1, 100) <= 10;
        }
    }
    return true;
},
```

### Refactoring Strategy
1. Identify all health check URL patterns used in the application
2. Add URL pattern exclusion to Telescope `filter` callback
3. Verify health check entries no longer appear in Telescope
4. Monitor Telescope entry volume: should drop by health check percentage
5. Periodically review filter patterns as new health checks are added

### Detection Checklist
- [ ] Health check URLs are excluded from Telescope capture
- [ ] Telescope entry volume decreased by expected amount
- [ ] Health check absence does not affect other monitoring (Pulse, health endpoint)
- [ ] New health checks are added to the exclusion list
- [ ] Health checks still function (just not captured by Telescope)

### Related Rules/Skills/Trees
- Rule: Use Telescope's filter callback to exclude health check noise
- Rule: Not filtering health check noise from Telescope entries
- Related KU: Integration Health Checks (Telescope noise management)

---

## Anti-Pattern 5: Expecting Telescope to Capture Non-Http-Facade HTTP Calls

### Category
Observability

### Description
Assuming Telescope captures ALL outbound HTTP calls, including those made directly with Guzzle, cURL, or other HTTP clients that bypass the Laravel Http facade.

### Why Happens
Telescope's HTTP Client Watcher registers middleware on the Http facade's underlying Guzzle stack. Developers assume all HTTP calls go through this middleware and are surprised when some calls are missing from Telescope.

### Warning Signs
- Telescope does not show certain HTTP calls that the application makes
- Developer uses `GuzzleHttp\Client` directly (not through Http facade)
- cURL calls (`curl_*` functions) are used in some parts of the codebase
- External packages make HTTP calls using their own HTTP client
- Teams cannot debug HTTP issues because "Telescope doesn't show it"
- Assumption that Telescope captures all HTTP traffic, regardless of client

### Why Harmful
If some HTTP calls bypass the Http facade, they are invisible to Telescope. Debugging integration issues with these calls is impossible through Telescope. Teams may waste hours investigating why Telescope doesn't show certain expected requests.

### Real-World Consequences
- Legacy code uses `GuzzleHttp\Client` directly (not through Http facade)
- This client makes payment API calls that don't appear in Telescope
- Developer spends 2 hours debugging a payment issue, checking Telescope repeatedly
- Payment calls are not captured; developer concludes they're not being made
- After extensive investigation: discovery that direct Guzzle calls bypass Telescope
- Fix: refactor to use Http facade + add SaloonPHP for new integrations

### Preferred Alternative
Standardize all HTTP calls through the Laravel Http facade or SaloonPHP, both of which Telescope captures. Audit the codebase for direct HTTP clients.

```php
// Wrong: Direct Guzzle (not captured by Telescope)
$client = new GuzzleHttp\Client();
$response = $client->get('https://api.example.com/data');

// Correct: Http facade (captured by Telescope)
$response = Http::get('https://api.example.com/data');

// Correct: SaloonPHP connector (captured by Telescope via events)
$response = $this->connector->send(new ListDataRequest());
```

### Refactoring Strategy
1. Audit codebase for direct HTTP client usage (Guzzle direct, cURL, file_get_contents)
2. Replace direct HTTP calls with Laravel Http facade or SaloonPHP
3. Update external packages that make HTTP calls to use injected Http facade
4. Add Telescope tag or log message to verify capture of refactored calls
5. Set coding standard: "All HTTP calls must use Http facade or SaloonPHP"

### Detection Checklist
- [ ] All HTTP calls use Http facade or SaloonPHP
- [ ] No direct GuzzleHttp\Client usage in application code
- [ ] No cURL or file_get_contents for API calls
- [ ] External packages with HTTP calls are wrapped or updated
- [ ] Coding standard enforces Http facade/SaloonPHP for HTTP calls

### Related Rules/Skills/Trees
- Rule: Expecting Telescope to capture non-Http-facade HTTP calls
- Rule: SaloonPHP integration via event watcher for SentSaloonRequest
- Related KU: Laravel Http Facade API (standardization)
