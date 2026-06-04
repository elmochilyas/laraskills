## Always Validate Structured Output Server-Side

---
## Category
Reliability | Security

---
## Rule
Always validate every structured output response against the expected JSON Schema on the server side; never rely solely on provider guarantees of schema adherence.

---
## Reason
Even with token-level constrained decoding, providers can return invalid JSON, miss fields, or include unexpected values. Server-side validation catches these cases and triggers fallback parsing before the data reaches application logic.

---
## Bad Example
```php
$response = $provider->chat($request->withStructuredOutput($schema));
$data = json_decode($response->content);
return new UserProfile(...$data); // May pass invalid data to constructor
```

---
## Good Example
```php
$response = $provider->chat($request->withStructuredOutput($schema));
$data = json_decode($response->content, true);
$validator = new JsonSchemaValidator();
if (!$validator->validate($data, $schema)) {
    $data = $this->fallbackExtract($text, $schema);
}
return new UserProfile(...$data);
```

---
## Exceptions
When the schema is trivially simple (single boolean field) and provider guarantees are trusted, validation may be omitted in non-critical paths.

---
## Consequences Of Violation
Silent data corruption, runtime type errors, downstream system failures from malformed data.

---

## Keep Schemas Shallow and Simple

---
## Category
Design | Reliability

---
## Rule
Limit response schemas to a maximum of 3 levels of nesting and no more than 10 top-level fields; never define deeply nested schemas with circular references.

---
## Reason
Deeply nested schemas (>3 levels) increase structured output failure rates. Each additional nesting level adds complexity that the LLM must navigate, increasing the probability of invalid responses.

---
## Bad Example
```php
$schema = [
    'type' => 'object',
    'properties' => [
        'user' => [
            'type' => 'object',
            'properties' => [
                'profile' => [
                    'type' => 'object',
                    'properties' => [
                        'address' => [
                            'type' => 'object',
                            // 5 levels of nesting
                        ],
                    ],
                ],
            ],
        ],
    ],
];
```

---
## Good Example
```php
$schema = [
    'type' => 'object',
    'properties' => [
        'user_name' => ['type' => 'string'],
        'user_email' => ['type' => 'string', 'format' => 'email'],
        'street' => ['type' => 'string'],
        'city' => ['type' => 'string'],
        'zip' => ['type' => 'string'],
    ],
    'required' => ['user_name', 'user_email'],
];
```

---
## Exceptions
When the provider supports `$ref` for schema composition and the use case genuinely requires nested data, flatten to a maximum of 3 levels with extensive testing.

---
## Consequences Of Violation
High structured output failure rates, increased fallback parsing, unreliable downstream data.

---

## Always Provide Fallback Parsing

---
## Category
Reliability

---
## Rule
Implement a fallback parsing strategy (regex extraction or secondary LLM call) for when structured output fails or returns invalid JSON; never leave structured output failures unhandled.

---
## Reason
Structured output can fail for multiple reasons: provider timeout, model refusal, content filtering, or schema incompatibility. Without fallback, the entire request fails, producing a poor user experience.

---
## Bad Example
```php
public function extract(string $text, array $schema): object {
    $response = $this->provider->chat(
        (new ChatRequest($text))->withStructuredOutput($schema)
    );
    return json_decode($response->content); // No fallback on failure
}
```

---
## Good Example
```php
public function extract(string $text, array $schema): object {
    $response = $this->provider->chat(
        (new ChatRequest($text))->withStructuredOutput($schema)
    );
    $data = json_decode($response->content, true);

    if (!$this->validator->validate($data, $schema)) {
        $data = $this->fallbackWithCheaperModel($text, $schema);
    }

    return new $schemaClass(...$data);
}
```

---
## Exceptions
When structured output is used for non-critical display purposes and graceful degradation is acceptable, fallback may return a default response.

---
## Consequences Of Violation
Complete request failures on structured output errors, poor reliability for programmatic consumption.

---

## Use Enums for Constrained Fields

---
## Category
Design | Reliability

---
## Rule
Define constrained string fields using JSON Schema `enum` instead of open-ended strings; never let the LLM freely choose values for fields that have a known set of valid options.

---
## Reason
Enum constraints reduce hallucination by limiting the LLM's output space to valid values. Open-ended strings on controlled fields produce unexpected values that cause downstream validation failures.

---
## Bad Example
```php
'properties' => [
    'status' => ['type' => 'string'],
    // LLM may return 'shipped', 'Shipped', 'in_transit', 'unknown', etc.
]
```

---
## Good Example
```php
'properties' => [
    'status' => [
        'type' => 'string',
        'enum' => ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    ],
]
```

---
## Exceptions
Fields that genuinely require free-form text (names, descriptions) should remain open-ended.

---
## Consequences Of Violation
Invalid enum values in downstream systems, data quality degradation, unexpected application behavior.

---

## Never Accept User Input in Response Schema

---
## Category
Security

---
## Rule
Never allow user input to directly influence the response schema definition; always define schemas statically in application code.

---
## Reason
Allowing user input to shape the response schema creates a schema injection vector. An attacker could craft input that exfiltrates data by requesting specific fields or bypasses output restrictions.

---
## Bad Example
```php
public function extract(string $text, array $userDefinedFields): object {
    $schema = $this->buildSchemaFromUserInput($userDefinedFields);
    return $this->client->extract($text, $schema);
    // User controls which fields are extracted — potential data exfiltration
}
```

---
## Good Example
```php
public function extract(string $text, string $type): object {
    $schema = match($type) {
        'product' => ProductSchema::definition(),
        'user' => UserSchema::definition(),
        default => throw new InvalidArgumentException(),
    };
    return $this->client->extract($text, $schema);
}
```

---
## Exceptions
Admin interfaces with authenticated, trusted users may allow limited schema customization with strict validation and audit logging.

---
## Consequences Of Violation
Data exfiltration, schema injection attacks, unauthorized data access through manipulated extraction.
