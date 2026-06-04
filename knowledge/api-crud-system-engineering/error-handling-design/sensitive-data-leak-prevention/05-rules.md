# Phase 5: Rules — Sensitive Data Leak Prevention

## Rule: Never Include Sensitive Data in Exception Context at the Source
---
## Category
Security
---
## Rule
Always exclude passwords, tokens, API keys, credit card numbers, PII, and raw request data from exception context arrays when throwing custom exceptions; rely on prevention, not redaction.
---
## Reason
Prevention is the only reliable defence — if sensitive data never enters the exception context, it can never be leaked. Redaction is a safety net, not a primary defence.
---
## Bad Example
```php
class UserRegistrationException extends OperationalException
{
    public function __construct(array $requestData)
    {
        parent::__construct(
            errorCode: ErrorCodes::VALIDATION_ERROR,
            statusCode: 422,
            message: 'Registration failed.',
            context: $requestData, // Contains password, credit card!
        );
    }
}
```
---
## Good Example
```php
class UserRegistrationException extends OperationalException
{
    public function __construct(string $email, string $failureReason)
    {
        parent::__construct(
            errorCode: ErrorCodes::VALIDATION_ERROR,
            statusCode: 422,
            message: 'Registration failed.',
            context: [
                'email_hash' => hash('sha256', $email),
                'failure_reason' => $failureReason,
                // Never include password, credit card, or raw PII
            ],
        );
    }
}
```
---
## Exceptions
No common exceptions — sensitive data must never be passed to exception context at the source.
---
## Consequences Of Violation
Sensitive data inevitably leaks through logs, error tracking, and API responses; compliance violation (PCI DSS, GDPR); credential exposure.

---

## Rule: Apply Layered Defence — Source, Handler, and Log Redaction
---
## Category
Security | Reliability
---
## Rule
Always implement three layers of sensitive data protection: (1) don't throw sensitive data, (2) sanitise context in the exception handler before rendering, (3) apply log processor redaction before writing to any log channel.
---
## Reason
A single layer can fail (developer forgets, new code path missed). Three layers ensure no single mistake causes a data leak. Each layer catches failures from the previous layer.
---
## Bad Example
```php
// Single layer — if source prevention fails, data leaks
// No handler sanitisation, no log redaction
```
---
## Good Example
```php
// Layer 1: Source prevention — exceptions exclude sensitive fields
throw new UserNotFoundException($userId); // No sensitive data in context

// Layer 2: Handler sanitisation before response
public function render($request, Throwable $e): JsonResponse
{
    $context = (new SanitiseExceptionContext())->sanitise($e->getContext());
    // Build envelope with sanitised context
}

// Layer 3: Log processor redaction
// config/logging.php
'processor' => [function ($record) {
    $record['context'] = (new SanitiseExceptionContext())->sanitise($record['context']);
    return $record;
}]
```
---
## Exceptions
No common exceptions — three-layer defence is mandatory for production APIs.
---
## Consequences Of Violation
Single missed `$request->all()` call leaks credentials to logs and error tracking; data breach occurs before detection.

---

## Rule: Implement Global Key-Name Redaction for Context Arrays
---
## Category
Security | Maintainability
---
## Rule
Always implement a recursive sanitisation class that scans context arrays for sensitive key patterns (`password`, `token`, `secret`, `credit_card`, `authorization`) and replaces their values with `[REDACTED]`; never rely on manual per-key sanitisation.
---
## Reason
Manual per-key sanitisation is inconsistent — new fields are added without redaction. A global key-name scanner catches all fields matching sensitive patterns regardless of where they appear in the context tree.
---
## Bad Example
```php
// Manual sanitisation — easy to miss new keys
$context = [
    'password' => '[REDACTED]',
    'email' => $request->email,
    'api_token' => $request->api_token, // Forgot to redact!
];
```
---
## Good Example
```php
class SanitiseExceptionContext
{
    protected array $sensitiveKeys = [
        'password', 'password_confirmation', 'secret', 'token',
        'api_key', 'credit_card', 'ssn', 'authorization',
    ];

    public function sanitise(array $context): array
    {
        foreach ($context as $key => $value) {
            if ($this->isSensitive($key)) {
                $context[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $context[$key] = $this->sanitise($value);
            }
        }
        return $context;
    }

    protected function isSensitive(string $key): bool
    {
        foreach ($this->sensitiveKeys as $pattern) {
            if (str_contains(strtolower($key), $pattern)) {
                return true;
            }
        }
        return false;
    }
}
```
---
## Exceptions
No common exceptions — global key-name redaction must always be applied.
---
## Consequences Of Violation
New sensitive fields added to context bypass redaction; manual review misses edge cases.

---

## Rule: Strip Server Paths from Stack Traces Before Logging
---
## Category
Security
---
## Rule
Always strip or replace the server root directory path in stack trace file paths before logging or tracking; never log raw file paths.
---
## Reason
Stack trace file paths reveal the server directory structure (`/var/www/vhosts/site/releases/20260601/...`), exposing deploy directory conventions and filesystem layout to attackers.
---
## Bad Example
```php
Log::error('Error occurred', [
    'exception' => $e, // __toString includes full file paths
]);
```
---
## Good Example
```php
// Strip server root before logging
$trace = array_map(function ($frame) {
    $frame['file'] = str_replace(base_path(), '{APP_ROOT}', $frame['file'] ?? '');
    return $frame;
}, $e->getTrace());

Log::error('Error occurred', [
    'message' => $e->getMessage(),
    'class' => $e::class,
    'trace' => $trace, // File paths are {APP_ROOT}/app/...
]);
```
---
## Exceptions
Local development where server paths are not sensitive.
---
## Consequences Of Violation
Server directory structure exposed in logs; deploy convention revealed; attacker gains knowledge of release process and file locations.

---

## Rule: Never Log Raw Request Bodies
---
## Category
Security
---
## Rule
Always log only explicitly selected fields from the request; never log `$request->all()`, `$request->input()`, or `$request->getContent()`.
---
## Reason
Raw request bodies contain all submitted data including passwords, tokens, credit card numbers, and PII fields. Even a single full-request log entry is a data breach if it captures a password.
---
## Bad Example
```php
Log::info('Request received', [
    'body' => $request->all(), // Contains everything — passwords, tokens, PII
]);
```
---
## Good Example
```php
Log::info('Request received', [
    'action' => $request->input('action'),
    'resource_id' => $request->input('resource_id'),
    'method' => $request->method(),
    'url' => $request->fullUrl(),
    // Never raw request body
]);
```
---
## Exceptions
GDPR/CCPA compliance investigations where full request capture is required by law; use a dedicated audited log channel with short retention.
---
## Consequences Of Violation
Credentials, tokens, and PII captured in logs; compliance violation; legal liability for data processing without consent.

---

## Rule: Apply Redaction Globally in Log Channel Configuration
---
## Category
Security | Code Organization
---
## Rule
Always configure redaction at the log channel configuration level using Monolog processors in `config/logging.php`; never rely on each developer calling a sanitisation function manually at each log call.
---
## Reason
Centralised configuration in `config/logging.php` applies redaction to every log line from every code path automatically. Manual sanitisation at each log call is inevitably missed in new code.
---
## Bad Example
```php
// Manual sanitisation in each controller — easy to skip
Log::info('User updated', [
    'email' => $this->sanitise($request->email), // Manual — new developer may skip
]);
```
---
## Good Example
```php
// config/logging.php — applied to all channels globally
'channels' => [
    'daily' => [
        'driver' => 'daily',
        'path' => storage_path('logs/laravel.log'),
        'tap' => [App\Logging\SensitiveDataProcessor::class],
    ],
];

// App\Logging\SensitiveDataProcessor.php
class SensitiveDataProcessor
{
    public function __invoke(array $record): array
    {
        $record['context'] = app(SanitiseExceptionContext::class)->sanitise($record['context']);
        return $record;
    }
}
```
---
## Exceptions
No common exceptions — global log redaction is mandatory.
---
## Consequences Of Violation
New developers add log calls without sanitisation; sensitive data appears in production logs; code review cannot catch every log call.

---

## Rule: Use Allowlist for Dev Mode Debug Output
---
## Category
Security | Maintainability
---
## Rule
Always use an explicit allowlist of safe fields to include in dev-mode debug output; never use a blocklist approach that assumes fields are safe by default.
---
## Reason
An allowlist approach assumes all data is sensitive by default and explicitly permits safe fields. A blocklist assumes all data is safe and specifically blocks known-sensitive fields — missing any field causes a leak.
---
## Bad Example
```php
// Blocklist — assumes everything is safe except known-sensitive
if (config('app.debug')) {
    $debugData = $e->context; // Could include PII
    unset($debugData['password']); // But forgot to unset 'token', 'ssn'
}
```
---
## Good Example
```php
// Allowlist — explicitly include only known-safe fields
$allowedKeys = ['user_id', 'order_id', 'resource_type', 'trace_id'];

if (config('app.debug') && app()->isLocal()) {
    $debugData = array_intersect_key($e->context, array_flip($allowedKeys));
    $response->setData($response->getData(true) + ['debug' => $debugData]);
}
```
---
## Exceptions
No common exceptions — allowlists are always safer than blocklists for debug output.
---
## Consequences Of Violation
New context keys added to exceptions automatically appear in dev debug output; accidental PII exposure in screenshots or bug reports.

---

## Rule: Test Redaction with Automated CI Tests
---
## Category
Testing | Security
---
## Rule
Always write CI tests that throw an exception containing known sensitive keys and assert that all sensitive values are redacted in the response and not present in the log output.
---
## Reason
Automated redaction tests catch regression when the sanitisation class changes, when new exception classes bypass sanitisation, or when context structure evolves.
---
## Bad Example
```php
// No redaction tests — regression goes undetected
```
---
## Good Example
```php
public function test_sensitive_data_is_redacted_from_error_response(): void
{
    app()->detectEnvironment(fn () => 'production');
    config(['app.debug' => false]);

    // Trigger an exception that contains sensitive context
    $response = $this->postJson('/api/login', [
        'email' => 'test@example.com',
        'password' => 'secret123',
    ]);

    // Assert the response does not contain the password value
    $response->assertStatus(401);
    $response->assertJsonMissingPath('error.detail.password');
    $content = $response->getContent();
    $this->assertStringNotContainsString('secret123', $content);
    $this->assertStringNotContainsString('[REDACTED] details', ''); // ensure redaction happens
}
```
---
## Exceptions
No common exceptions — automated redaction testing is mandatory for security compliance.
---
## Consequences Of Violation
Redaction regression goes undetected; sensitive data exposed in production response or logs; compliance audit failure.

---

## Rule: Audit Error Logs Quarterly for Sensitive Data Patterns
---
## Category
Security | Compliance
---
## Rule
Always schedule a quarterly audit of production error logs (or automated scan) for leaked sensitive data patterns — passwords, credit card numbers, emails, tokens; never assume logs are clean.
---
## Reason
New code paths, third-party packages, and developer mistakes inevitably introduce sensitive data into logs. Regular scanning catches these before they become data breach incidents.
---
## Bad Example
```php
// Logs never audited — leak persists until external discovery
```
---
## Good Example
```php
// Scheduled command for quarterly scanning:
class ScanLogsForSensitiveData extends Command
{
    public function handle(): int
    {
        $patterns = [
            '/"password":".*?"/',
            '/"token":".*?"/',
            '/\b[\w\.-]+@[\w\.-]+\.\w+\b/',
            '/\b\d{16}\b/', // Credit card number candidate
        ];
        $logFile = storage_path('logs/laravel.log');
        $matches = [];
        foreach ($patterns as $pattern) {
            exec("grep -oP '{$pattern}' {$logFile}", $matches);
        }
        if (! empty($matches)) {
            Log::warning('Sensitive data detected in logs', ['count' => count($matches)]);
            // Notify security team
        }
        return 0;
    }
}
```
---
## Exceptions
No common exceptions — regular auditing is a security best practice.
---
## Consequences Of Violation
Undetected data leak in logs persists for months; discovered during external security audit or data breach notification; regulatory fines.
