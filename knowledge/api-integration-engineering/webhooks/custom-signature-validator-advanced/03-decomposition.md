# Decomposition: Custom Signature Validator Implementation for Non-Standard Webhooks

## Topic Overview
The Spatie laravel-webhook-client's `DefaultSignatureValidator` implements standard HMAC-SHA256 with raw body verification. However, many webhook providers use non-standard signature schemes: different signing algorithms (Stripe's timestamped format), multi-field concatenation (GitHub's HMAC hex), custom header names, or enveloped payload structures (Adyen, Braintree). Custom `SignatureValidator` implementations adapt the package to each provider's unique signing mechanism while maintaining the same pipeline benefits.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k021-custom-signature-validator/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Custom Signature Validator Implementation for Non-Standard Webhooks
- **Purpose:** The Spatie laravel-webhook-client's `DefaultSignatureValidator` implements standard HMAC-SHA256 with raw body verification. However, many webhook providers use non-standard signature schemes: different signing algorithms (Stripe's timestamped format), multi-field concatenation (GitHub's HMAC hex), custom header names, or enveloped payload structures (Adyen, Braintree). Custom `SignatureValidator` implementations adapt the package to each provider's unique signing mechanism while maintaining the same pipeline benefits.
- **Difficulty:** Intermediate
- **Dependencies:** K003, K011, K022, K035

## Dependency Graph
**Depends on:**
- K003
- K011
- K022
- K035

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- SignatureValidator Interface
- Raw Body Requirement
- Provider-Specific Formats
- Timing-Safe Comparison
- Multi-Header Signatures
- WebhookConfig Access

**Out of scope:**
- K003 topics covered in their respective KUs
- K011 topics covered in their respective KUs
- K022 topics covered in their respective KUs
- K035 topics covered in their respective KUs

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization