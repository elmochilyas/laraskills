# Rules: Structured JSON Logging

## Rule SJL-01: Always configure formatter explicitly on production channels
**Condition:** For every production log channel defined in `config/logging.php`.
**Action:** Set `'formatter' => \Monolog\Formatter\JsonFormatter::class`. Do not rely on default `LineFormatter`.
**Consequence:** Machine-parseable JSON output. No silent fallback to text format.

## Rule SJL-02: Use JsonFormatter with appendNewline=true
**Condition:** When configuring `JsonFormatter` on any channel.
**Action:** Set `'formatter_with' => ['appendNewline' => true]`. Each JSON entry ends with a newline character.
**Consequence:** Log aggregators can parse entries by line, even if entries span multiple lines.

## Rule SJL-03: Set maxNormalizeDepth and maxNormalizeItemCount
**Condition:** When logging context data that may contain complex objects (Eloquent models, nested arrays).
**Action:** Configure `'formatter_with' => ['maxNormalizeDepth' => 5, 'maxNormalizeItemCount' => 100]`.
**Consequence:** Prevents serialization of infinitely nested objects. Limits per-entry size.
**Violation:** A deeply nested Eloquent model serialized to JSON can produce a 10MB+ entry.

## Rule SJL-04: Enforce a single field naming convention project-wide
**Condition:** When adding context data to log entries across the application.
**Action:** Choose snake_case (Laravel convention) or camelCase. Enforce via code review or CI linting.
**Consequence:** Queries in log aggregators work uniformly across all services. No OR conditions needed for field name variations.

## Rule SJL-05: Use ISO 8601 datetime format with timezone
**Condition:** When configuring log entry timestamps.
**Action:** Ensure the `datetime` field is formatted as ISO 8601: `Y-m-d\TH:i:sP` (e.g., `2024-01-01T12:00:00+00:00`).
**Consequence:** Log aggregators correctly parse and index timestamps across time zones.

## Rule SJL-06: Never use LineFormatter in production channels
**Condition:** When reviewing or adding production channel configurations.
**Action:** Verify that no production channel uses `LineFormatter`. All production channels must use `JsonFormatter` or equivalent structured formatter.
**Consequence:** All production logs are uniformly parseable and queryable.
**Exception:** Truly human-only destinations (single developer SSH tailing logs) — but use a dedicated non-production channel.

## Rule SJL-07: Never construct JSON field names from user input
**Condition:** When adding context data to log entries.
**Action:** Use static, documented field names. Do not interpolate user input, request parameters, or database values into field names.
**Consequence:** Predictable schema. No aggregator query breakage. No injection of special characters into field names.

## Rule SJL-08: Benchmark JSON encoding overhead for high-throughput channels
**Condition:** When a channel processes >1000 log entries/second.
**Action:** Measure encoding time with `JsonFormatter` vs `LineFormatter`. If overhead exceeds 100μs per entry, evaluate context size reduction or consider structured alternatives.
**Consequence:** Quantified understanding of logging performance impact.

## Rule SJL-09: Convert non-serializable types before logging
**Condition:** When logging objects that are not natively JSON-serializable (resources, closures, objects without `JsonSerializable`).
**Action:** Convert to string, array, or scalar before passing to log context. Use `json_encode`-compatible types only.
**Consequence:** Prevents JSON encoding errors. Ensures all context is queryable.
