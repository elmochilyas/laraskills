## Declare Schema on Every Structured Agent
---
## Category
Framework Usage | Maintainability
---
## Rule
Always implement `HasStructuredOutput` and declare a `schema()` method on agents that return data for programmatic consumption; avoid parsing unstructured text responses.
---
## Reason
The `schema()` method provides type-safe, provider-enforced structured output. Without it, you must parse raw text, which is fragile, error-prone, and sensitive to prompt changes. Schema enforcement at the provider level guarantees the shape of the response.
---
## Bad Example
```php
class InvoiceParserAgent extends Agent {
    protected string $instructions = 'Extract invoice number, date, and total as JSON.';
}
```
---
## Good Example
```php
class InvoiceParserAgent extends Agent implements HasStructuredOutput {
    public function instructions(): string {
        return 'Extract invoice fields from the provided text.';
    }
    public function schema(): JsonSchema {
        return JsonSchema::object([
            'invoice_number' => JsonSchema::string(),
            'date' => JsonSchema::string(),
            'total' => JsonSchema::number(),
        ])->required(['invoice_number', 'date', 'total']);
    }
}
```
---
## Exceptions
Free-form chat agents where the response is displayed directly to a human and never parsed programmatically do not need structured output.
---
## Consequences Of Violation
Unreliable parsing, silent data corruption, production crashes from unexpected response formats.

## Always Include `description` on Schema Fields
---
## Category
Design | Reliability
---
## Rule
Provide a clear `description` for every field in your `JsonSchema` definition; never omit descriptions on any property.
---
## Reason
LLMs use field descriptions to understand what content to place in each field. Without descriptions, the LLM fills fields with plausible but incorrect data, significantly degrading extraction accuracy. A description is the most impactful quality lever per token spent.
---
## Bad Example
```php
JsonSchema::object([
    'priority' => JsonSchema::string(), // What values? What does this mean?
]);
```
---
## Good Example
```php
JsonSchema::object([
    'priority' => JsonSchema::string()
        ->description('Ticket priority level: low, medium, high, or critical'),
]);
```
---
## Exceptions
Self-explanatory fields (e.g., `extracted_text` in a transcription schema) may omit descriptions if the field name is unambiguous.
---
## Consequences Of Violation
LLM hallucinates field values, incorrect data propagates downstream, requires manual correction.

## Keep Schemas Flat and Concise
---
## Category
Performance | Reliability
---
## Rule
Limit structured output schemas to 5-10 fields at the top level; prefer flat structures over deep nesting beyond 2 levels.
---
## Reason
Deeply nested schemas increase LLM generation time by 10-50% and raise the failure rate (provider may reject or the LLM may deviate). Flat schemas with clear descriptions produce more reliable results with lower latency and token cost.
---
## Bad Example
```php
JsonSchema::object([
    'customer' => JsonSchema::object([
        'contact' => JsonSchema::object([
            'email' => JsonSchema::string(),
            'phone' => JsonSchema::string(),
        ]),
        'address' => JsonSchema::object([
            'street' => JsonSchema::object([
                'line1' => JsonSchema::string(),
                'line2' => JsonSchema::string(),
            ]),
        ]),
    ]),
]);
```
---
## Good Example
```php
JsonSchema::object([
    'customer_email' => JsonSchema::string(),
    'customer_phone' => JsonSchema::string(),
    'street_line1' => JsonSchema::string(),
    'street_line2' => JsonSchema::string(),
]);
```
---
## Exceptions
Document extraction for complex nested domains (legal contracts, medical records) may require 2-3 levels of nesting; test with your target provider before committing.
---
## Consequences Of Violation
Provider 400 errors, LLM fails to populate nested fields, increased latency and cost, schema validation failures.

## Make Critical Fields Required
---
## Category
Reliability | Framework Usage
---
## Rule
Mark fields as `required()` when they are essential for downstream processing; avoid marking every field required.
---
## Reason
Optional fields degrade extraction reliability — the LLM may omit them if uncertain. Required fields force the LLM to provide a value. However, making all fields required increases the chance the LLM refuses to respond if it cannot determine every field. Balance is critical.
---
## Bad Example
```php
// Nothing required — LLM may omit critical data
JsonSchema::object([
    'order_id' => JsonSchema::string(),
    'amount' => JsonSchema::number(),
])->required([]);
```
---
## Good Example
```php
JsonSchema::object([
    'order_id' => JsonSchema::string(),
    'amount' => JsonSchema::number(),
    'notes' => JsonSchema::string(),
])->required(['order_id', 'amount']);
```
---
## Exceptions
Forms where all fields are mandatory for the business process may require all fields to be required; test that the provider can satisfy this constraint.
---
## Consequences Of Violation
Missing critical data in downstream systems, silent processing failures, or LLM refusal to respond.

## Handle SchemaValidationException Gracefully
---
## Category
Reliability
---
## Rule
Always catch `SchemaValidationException` when calling agents with structured output; log the raw response for debugging.
---
## Reason
Provider-side schema enforcement is not absolute — the LLM may return malformed JSON, missing fields, or type violations. Without a catch block, the application crashes. The raw response contains critical debugging information to diagnose schema issues.
---
## Bad Example
```php
$result = $agent->prompt('Extract data from this document');
// If schema validation fails, this line throws an uncaught exception
$processed = $this->processResult($result->text);
```
---
## Good Example
```php
try {
    $response = $agent->prompt('Extract data from this document');
    $processed = $this->processResult($response->structured());
} catch (SchemaValidationException $e) {
    Log::warning('Schema validation failed', [
        'raw_response' => $e->rawResponse(),
        'agent' => get_class($agent),
    ]);
    $processed = $this->fallbackExtraction($e->rawResponse());
}
```
---
## Exceptions
Prototype or non-critical agents may omit the catch block if schema failures are acceptable during development.
---
## Consequences Of Violation
Unhandled exceptions crash the request, production outages, lost response data, difficult debugging without raw response context.

## Version Your Schemas
---
## Category
Maintainability
---
## Rule
Include a version identifier in your schema or store it alongside prompt versioning; never change a schema in production without coordinating with downstream consumers.
---
## Reason
Schemas define the contract between the LLM and your application. Breaking changes (renaming fields, changing types) silently corrupt data for consumers expecting the old format without throwing errors. Versioning enables safe migration.
---
## Bad Example
```php
// Changed 'customer_email' to 'email' — old consumers break silently
public function schema(): JsonSchema {
    return JsonSchema::object([
        'email' => JsonSchema::string(), // Was 'customer_email'
    ]);
}
```
---
## Good Example
```php
public function schema(): JsonSchema {
    return JsonSchema::object([
        'schema_version' => JsonSchema::string()
            ->description('Schema version identifier'),
        'customer_email' => JsonSchema::string(),
    ])->required(['customer_email']);
}
```
---
## Exceptions
Pre-production schemas (development, staging) may change freely; communicate changes when promoting to production.
---
## Consequences Of Violation
Downstream processing silently fails, data corruption in databases, API response changes break client integrations.
