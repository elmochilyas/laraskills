# Anti-Patterns: Monolog Architecture & Channel Configuration

## AP-MAC-01: Missing Formatter on Production Channels

**Description:** Configuring a production channel without an explicit `formatter` setting, relying on Monolog's default `LineFormatter`.

**Why It Happens:** The Laravel logging documentation shows `LineFormatter` as the default in many examples. Developers copy the example without changing the formatter for production.

**Consequences:**
- Log aggregators receive non-machine-parseable text instead of structured JSON
- Field extraction in ELK/Loki requires custom grok patterns
- Switching to JSON later requires changing log ingestion pipelines

**Detection:** Check `config/logging.php` for channels that lack a `formatter` key. If absent, Monolog's default applies.

**Remediation:** Add `'formatter' => Monolog\Formatter\JsonFormatter::class` to every production channel.

---

## AP-MAC-02: Nesting Stack Drivers

**Description:** Referencing a `stack` channel inside another `stack` channel's `channels` array, creating recursive fan-out.

**Why It Happens:** The `stack` driver is intuitively named — developers think "I want a stack of channels" and simply list all channels, including other stacks.

**Consequences:**
- Each log entry is written multiple times to the same destination
- Log volume multiplies exponentially with each nesting level
- Storage costs increase proportionally

**Detection:** Review `channels` arrays in all `stack` configurations. If any referenced channel is also a `stack`, that's the anti-pattern.

**Remediation:** Restructure so stacks reference only leaf channels. If you need to compose stacks, create a new leaf channel that corresponds to the desired output directly.

---

## AP-MAC-03: No Level Threshold on Notification Channels

**Description:** Configuring a Slack, Telegram, or email handler without a `level` setting, allowing all log severities to trigger external notifications.

**Why It Happens:** Developers configure the channel and test with a single `Log::error()` call. They never experience the volume of debug-level messages in production.

**Consequences:**
- Slack channels become unusable due to message volume
- Alert fatigue — critical errors are ignored because they blend with noise
- API rate limits exceeded for notification services

**Detection:** Check notification channels for absence of `level` key. Any notification channel without `level: 'warning'` or higher is suspect.

**Remediation:** Set `'level' => 'warning'` as minimum for all notification channels. Use `critical` for direct pager notifications.

---

## AP-MAC-04: Direct Monolog Instantiation

**Description:** Creating Monolog handlers directly with `new Logger('name')` and adding handlers programmatically, bypassing Laravel's `config/logging.php` configuration system.

**Why It Happens:** Developers need a custom handler setup that feels awkward to express in config arrays. It's easier to write PHP code.

**Consequences:**
- Logging configuration is hidden in service providers or bootstrap code
- Environment-specific overrides require code changes instead of `.env` updates
- New team members cannot discover log configuration by reading `config/logging.php`

**Detection:** Search for `new Logger`, `new StreamHandler`, `new RotatingFileHandler` in service providers and bootstrap code.

**Remediation:** Express the configuration in `config/logging.php` using the custom driver syntax: `'driver' => 'monolog', 'handler' => HandlerClass::class, 'handler_with' => [...]`.
