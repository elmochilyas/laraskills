# Knowledge Unit: Data Privacy & PII Protection

## Metadata

- **ID:** ku-04
- **Subdomain:** AI Safety & Security
- **Slug:** data-privacy---pii-protection
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Data privacy and PII (Personally Identifiable Information) protection in AI systems involves detecting, classifying, redacting, and governing sensitive user data that flows through LLM requests and responses. Because LLMs process and may retain data, every user message that reaches an LLM provider represents a potential data exposure risk. This KU covers the techniques and architecture for ensuring sensitive data is protected throughout the AI pipeline â€” from input ingestion through LLM processing to output delivery and logging.

## Core Concepts

- **PII (Personally Identifiable Information):** Any data that can identify an individual (name, email, SSN, phone, address, IP, device ID, biometrics).
- **PII Detection:** Identifying PII in text using pattern matching (regex), named entity recognition (NER), or ML classifiers.
- **PII Redaction:** Replacing PII with placeholders (e.g., `[EMAIL]`, `[NAME]`) before sending data to the LLM.
- **PII Masking:** Reversible replacement (e.g., tokenized values) that can be de-redacted in the response.
- **Data Residency:** Ensuring data is processed and stored in specific geographic regions to comply with regulations (GDPR, CCPA, LGPD).
- **Data Retention:** Policies for how long raw user data (messages, embeddings) is stored before deletion.
- **Consent Management:** Tracking which data a user has consented to be processed and for what purposes.
- **Anonymization:** Irreversibly removing PII so data can no longer be associated with an individual.

## Mental Models

- **PII (Personally Identifiable Information):** Any data that can identify an individual (name, email, SSN, phone, address, IP, device ID, biometrics).
- **PII Detection:** Identifying PII in text using pattern matching (regex), named entity recognition (NER), or ML classifiers.
- **PII Redaction:** Replacing PII with placeholders (e.g., `[EMAIL]`, `[NAME]`) before sending data to the LLM.


## Internal Mechanics

The internal mechanics of Data Privacy & PII Protection follow established patterns within the AI Safety & Security domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Redact PII before sending to any LLM provider.** Even if the provider claims not to train on data, assume all third-party calls are potential data leaks.
- **Never send raw PII to LLM APIs** unless you have verified zero-retention policies and a DPA is in place.
- **Implement reversible masking** for cases where the LLM needs to reference PII (e.g., "email the user at [EMAIL]"). De-redact in the response.
- **Classify data sensitivity** at ingestion. Not all data needs the same level of protection. Apply context-aware policies.
- **Log PII detection events** (what was detected, what action was taken) for compliance auditing.
- **Provide data deletion APIs** â€” users must be able to request deletion of their data (conversations, embeddings, profiles).

## Patterns

- **Redact PII before sending to any LLM provider.** Even if the provider claims not to train on data, assume all third-party calls are potential data leaks.
- **Never send raw PII to LLM APIs** unless you have verified zero-retention policies and a DPA is in place.
- **Implement reversible masking** for cases where the LLM needs to reference PII (e.g., "email the user at [EMAIL]"). De-redact in the response.
- **Classify data sensitivity** at ingestion. Not all data needs the same level of protection. Apply context-aware policies.
- **Log PII detection events** (what was detected, what action was taken) for compliance auditing.
- **Provide data deletion APIs** â€” users must be able to request deletion of their data (conversations, embeddings, profiles).

## Architectural Decisions

- Implement PII protection as a **middleware layer** in the AI gateway, applied to both requests and responses.
- Use a **privacy tag system**: tag messages with their sensitivity level (`public`, `internal`, `sensitive`, `restricted`) and apply policies per tag.
- For RAG systems, store embeddings in an **isolated vector index** per tenant or per user â€” never mix PII across tenants.
- The PII redaction layer should be **provider-agnostic** â€” redact before the provider-specific transformation.
- For Laravel, use **Eloquent encryption** (`cast` with `encrypted`) for stored PII and **queue encryption** for queued jobs containing PII.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Regex-based PII detection is <1ms. NER-based detection is 10-100ms depending on model size.
- Redaction adds minimal overhead (string replacement). Masking with tokenization adds a lookup.
- For streaming, PII protection must either buffer chunks (adds latency) or process per-chunk (complex).
- Cache PII detection results: if the same user sends similar content, the PII profile is likely similar.
- Encrypted storage adds ~10-20% overhead on read/write. Plan database capacity accordingly.

## Production Considerations

- **Provider data handling:** Verify your LLM provider's data retention policy. Opt out of training data usage. Sign a DPA.
- **De-redaction attacks:** If using reversible masking, ensure the mapping store is as secure as the original PII.
- **Context leakage:** Even without explicit PII, LLMs may infer sensitive information from context (e.g., "the user's medical history").
- **Embedding reversal:** Recent research shows embeddings can be partially reversed to recover training data. Embedding PII is a risk.
- **Cross-tenant data isolation:** In multi-tenant systems, one tenant's PII must never be visible to another tenant.

## Common Mistakes

- Only redacting PII from the request but not from the response (LLM may echo back PII).
- Using irreversible redaction when the LLM needs to reference the PII (causes poor UX).
- Not considering indirect PII (combinations of non-PII fields that together identify a person).
- Sending PII to providers despite zero-retention claims â€” "zero retention" is not "zero exposure".
- Storing raw conversation history without PII redaction in logs or training data.

## Failure Modes

- **Redact-Everything:** Redacting all data indiscriminately (including non-PII). Breaks application functionality. Use targeted detection.
- **Manual PII Tagging:** Relying on users or developers to manually tag PII. Automate detection.
- **PII in Embeddings:** Storing PII in vector embeddings that cannot be easily deleted on user request. Exclude PII from embedded content.
- **One Policy for All Data:** Applying the same privacy policy to all data types. Different data needs different protection levels.

## Ecosystem Usage

### PII Redaction Pipeline
```php
class PiiProtectionMiddleware implements MiddlewareInterface {
    public function processRequest(array $request): array {
        $patterns = [
            'EMAIL' => '/\b[\w\.-]+@[\w\.-]+\.\w+\b/',
            'PHONE' => '/\b\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/',
            'SSN' => '/\b\d{3}-\d{2}-\d{4}\b/',
            'IP' => '/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/',
        ];

        foreach ($request['messages'] as &$message) {
            $content = $message['content'] ?? '';
            foreach ($patterns as $type => $pattern) {
                $content = preg_replace($pattern, "[{$type}]", $content);
            }
            $message['content'] = $content;
        }

        return $request;
    }
}
```

### Reversible Masking
```php
class PiiMasker {
    private array $mapping = [];

    public function mask(string $value, string $type): string {
        $token = "{{$type}_" . count($this->mapping) . "}";
        $this->mapping[$token] = $value;
        return $token;
    }

    public function unmask(string $response): string {
        return str_replace(
            array_keys($this->mapping),
            array_values($this->mapping),
            $response
        );
    }
}
```

## Related Knowledge Units

- ku-01 (Prompt Injection Prevention): Related security-in-depth techniques.
- ku-06 (Secure Output Handling): Ensuring PII doesn't leak in output.
- ai-middleware-gateway/ku-04: PII redaction as a gateway transform.
- retrieval-augmented-generation/ku-06: PII in RAG document processing.
- vector-database-integration/ku-04: Secure vector storage with PII isolation.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

