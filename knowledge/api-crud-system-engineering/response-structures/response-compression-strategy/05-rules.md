# Rules: Response Compression Strategy

## Rule: Enable Compression At Web Server Level
- **Condition:** When configuring compression for API responses
- **Action:** Enable gzip compression at the web server (nginx/apache) or CDN level. Avoid PHP-level compression.
- **Consequence:** Better performance; offloads CPU work from PHP.
- **Enforcement:** Infrastructure review verifies compression configuration.

## Rule: Use Brotli Where Supported
- **Condition:** When clients support brotli encoding
- **Action:** Enable brotli compression with gzip fallback. Brotli provides 20-30% better compression for JSON.
- **Consequence:** Better compression ratios for supported clients.
- **Enforcement:** CDN performance review includes compression algorithm selection.

## Rule: Set Appropriate Compression Levels
- **Condition:** When configuring compression algorithm
- **Action:** Use compression level 1-3. Higher levels provide diminishing returns.
- **Consequence:** Good compression without excessive CPU overhead.
- **Enforcement:** Performance review verifies compression level is not set higher than 6.

## Rule: Monitor Compression Effectiveness
- **Condition:** When compression is enabled
- **Action:** Monitor compression ratio, compression time, and bandwidth savings. Verify `Content-Encoding` header is present.
- **Consequence:** Compression benefits are measured; issues are detected.
- **Enforcement:** Monitoring dashboard includes compression metrics.

## Rule: BREACH Mitigation For Sensitive Endpoints
- **Condition:** When returning sensitive data in compressed responses over HTTPS
- **Action:** Implement BREACH attack mitigation: response padding or rate limiting on sensitive endpoints.
- **Consequence:** Prevents compression ratio side-channel attacks.
- **Enforcement:** Security review for endpoints returning sensitive data with compression.
