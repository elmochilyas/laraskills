# Skill: Generate Postman Collections

## Purpose
Generate Postman collections from OpenAPI specs with environment variable separation, automated token acquisition via pre-request scripts, test scripts for status code assertions, and versioned collection files.

## When To Use
- APIs consumed by external teams that use Postman
- APIs needing interactive runnable documentation
- APIs requiring integration testing via Newman (Postman's CLI)
- APIs documented via Scribe (includes collection export)

## When NOT To Use
- APIs documented exclusively through OpenAPI without Postman consumers
- Internal-only APIs where curl examples suffice
- Very large APIs (1000+ endpoints) where collection file size is unmanageable

## Prerequisites
- OpenAPI spec generation
- Understanding of Postman Collection v2.1 format
- Newman CLI for automated testing (optional)

## Inputs
- OpenAPI spec file
- Environment variable definitions (base URL, tokens)
- Auth endpoint details for pre-request script

## Workflow
1. Generate collection from OpenAPI spec using `openapi-to-postman` or Scribe's built-in export
2. Separate collection definition from environment variables — store base URL, tokens as Postman variables
3. Create separate environment JSON files per deployment target (dev, staging, production)
4. Write pre-request scripts for automated token acquisition at collection level
5. Add test scripts on every endpoint with at minimum status code assertion
6. Organize endpoints by resource using Postman folders matching API resources
7. Version collections alongside API versions — maintain separate files per version
8. Apply manual enhancements via post-processing scripts, not by editing the generated file

## Validation Checklist
- [ ] Collection generated from OpenAPI spec (not manually maintained)
- [ ] Environment variables used for all environment-specific values
- [ ] Separate environment files per deployment target
- [ ] Pre-request script automates token acquisition
- [ ] Test scripts include status code assertions on every endpoint
- [ ] Collection organized by resource with folders
- [ ] Versioned collections (separate files per API version)
- [ ] Manual enhancements in post-processing scripts, not in generated file

## Common Failures
- Hardcoded environment values — collection cannot be reused across environments
- No test scripts — collection is documentation-only, not usable for regression testing
- Stale auth tokens in environment — use pre-request scripts for dynamic acquisition
- Collection drift from spec — generate from spec, not by hand
- Manual edits to generated files are overwritten on regeneration

## Decision Points
- Generation tool: openapi-to-postman vs Scribe export vs Postman import
- Auth method: pre-request script vs collection-level auth vs environment token
- Collection granularity: one collection per version vs one collection per environment

## Performance Considerations
- 100 endpoints with response examples: 1-5 MB
- Pre-request scripts add latency to first request — cache tokens in environment variables
- Newman test execution scales linearly with endpoint count

## Security Considerations
- Never commit environment files with real tokens or production URLs
- Environment file variable leak — use .gitignore for real value files
- Review collection before sharing to ensure no internal endpoints exposed

## Related Rules
- Separate Collection Definition From Environment Variables
- Automate Token Acquisition With Pre-Request Scripts
- Add Test Scripts For Status Code Assertions
- Generate Collection From Spec Not By Hand
- Version Collections Alongside API Versions

## Related Skills
- Generate OpenAPI Spec
- Integrate Scribe
- Validate Documentation in CI

## Success Criteria
- Collection is auto-generated from spec, not hand-maintained
- Environment variables separate configuration from collection definition
- Token acquisition is fully automated via pre-request scripts
- Every endpoint has at least status code test script
- Collections are version-aligned with API versions
- Newman CI run catches regressions before release
