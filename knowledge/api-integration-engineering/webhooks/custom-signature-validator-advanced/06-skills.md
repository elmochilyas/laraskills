# Skill: Build Custom Signature Validators for Incoming Webhooks

## Purpose
Implement custom signature validation for incoming webhooks using non-standard signing schemes, supporting multiple providers with different validation rules.

## When To Use
- Multiple webhook sources requiring different signature algorithms
- Proprietary or unusual signature schemes
- Custom HMAC, RSA, or composite signing

## When NOT To Use
- Standard webhook signature verification (use Spatie or Standard Webhooks)
- Each provider has a unique built-in verification package

## Prerequisites
- Shared secrets for each webhook provider
- Middleware pipeline or webhook processor

## Workflow
1. Create validator class per provider implementing a `SignatureValidator` interface
2. Extract provider identity from request (header, path prefix)
3. Route to correct validator based on provider
4. Extract raw body via `$request->getContent()` to avoid JSON mutation
5. Compute and compare signature with `hash_equals()`
6. Include timestamp validation in signature computation
7. Cache validation result for request lifetime
8. Return 401/403 on validation failure

## Validation Checklist
- [ ] Validator per provider with interface
- [ ] Provider routing determines correct validator
- [ ] Raw body retrieved via `getContent()`
- [ ] Constant-time comparison used
- [ ] Timestamp validated for replay protection
- [ ] Validators return 401/403 on failure
