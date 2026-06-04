# Anti-Patterns: Structured JSON Logging

## AP-SJL-01: Default Formatter in Production

**Description:** Configuring a production log channel without an explicit `formatter` setting, causing Monolog to use `LineFormatter` as default.

**Why It Happens:** The `config/logging.php` file created by `php artisan config:publish logging` uses `LineFormatter` implicitly. Developers do not modify it for production.

**Consequences:**
- Log aggregator receives unparseable text instead of structured JSON
- Every query requires custom parsing (grok patterns, regex extraction)
- Field-level searching is impossible — must search within unstructured text
- Changing format later requires reconfiguring the entire ingestion pipeline

**Detection:** Check every channel in `config/logging.php`. If a channel lacks a `formatter` key, it uses Monolog's default (`LineFormatter`).

**Remediation:** Add `'formatter' => \Monolog\Formatter\JsonFormatter::class` to every production channel. Set `formatter_with` parameters for production tuning.

---

## AP-SJL-02: No Newline Delimiter

**Description:** Configuring `JsonFormatter` without setting `appendNewline = true`, producing a single concatenated JSON blob in the log file.

**Why It Happens:** The default value of `appendNewline` is `false`. Developers add `JsonFormatter` without reading the constructor parameter.

**Consequences:**
- Log file contains one line: `{"message":"a"}{"message":"b"}{"message":"c"}`
- No log shipper can parse this — each new object immediately follows the previous
- Debugging by reading the file directly is impractical

**Detection:** Check `config/logging.php` for `'formatter' => \Monolog\Formatter\JsonFormatter::class` without `'formatter_with' => ['appendNewline' => true]`.

**Remediation:** Add `'formatter_with' => ['appendNewline' => true]` to all JSON-formatted channels.

---

## AP-SJL-03: Dynamic Field Names from User Input

**Description:** Constructing JSON field names dynamically from user-controlled data, request parameters, or database values.

**Why It Happens:** A convenient pattern: `Log::info('Processing', [$request->input('type') => $value])`. The field name changes based on user input.

**Consequences:**
- Aggregator queries cannot predict field names — every request may produce different fields
- Field names may contain special characters, whitespace, or injection characters
- Schema evolution is impossible — the set of field names is unbounded
- Security risk: field names could be crafted to break aggregator parsing

**Detection:** Search for variable interpolation in array keys passed to log context — patterns like `[$variable => $value]` in log calls.

**Remediation:** Use static, documented field names. Map dynamic user input to consistent field names: `Log::info('Processing', ['input_type' => $request->input('type'), 'input_value' => $value])`.

---

## AP-SJL-04: Non-JSON-Serializable Types in Context

**Description:** Passing resource handles, closures, objects without `__toString()`, or circular-referenced objects as log context values.

**Why It Happens:** Developers call `Log::info('Processing', ['model' => $eloquentModel])` without considering how the model serializes. Eloquent models have lazy-loaded relationships that create circular references.

**Consequences:**
- `JsonFormatter::format()` throws an exception on unserializable values
- The log entry is lost entirely — no error is logged either
- Deadlock scenarios: an error handler tries to log, logging fails, error handler retries...

**Detection:** Enable `JsonSerializable` test in CI. Check for `\JsonSerializable` interface on types passed to log context.

**Remediation:** Convert to explicit arrays before logging: `['model_id' => $model->id, 'model_type' => get_class($model)]`. Use `$model->toArray()` with caution — it may include more data than intended.
