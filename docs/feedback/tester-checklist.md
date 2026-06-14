# Beta tester checklist

Use this checklist to structure your LaraSkills testing session. You don't need to complete every item — pick the areas most relevant to your workflow.

## Installation

- [ ] `npm install --save-dev laraskills` completes without errors
- [ ] `npx laraskills install --profile core` completes without errors
- [ ] `npx laraskills doctor` reports `Status: HEALTHY`
- [ ] `npx laraskills validate --format json` returns `"valid": true`
- [ ] Operating layer files are present (skills, rules, agents in project root)
- [ ] No existing project files were overwritten

## Retrieval

- [ ] `npx laraskills retrieve "add active storage to a model" --mode compact` returns useful output
- [ ] `npx laraskills search "pest test"` returns relevant knowledge units
- [ ] `npx laraskills get <canonical-id> --include-content` returns full content
- [ ] Specifying `--format json` produces valid JSON on `retrieve`, `search`, and `get`

## AI tool integration

- [ ] Agent behavior is visibly improved with installed skills/rules
- [ ] Agent respects rules (e.g., does not suggest `dd()`, raw SQL, or mass-assignment bypasses)
- [ ] MCP server connects (if configured) without errors
- [ ] MCP `retrieve_context_bundle` returns useful context for a Laravel task

## Feature building

Try building one or more of the following:

- [ ] REST API for a model with Form Request validation, Policy, API Resource, and pagination
- [ ] Database migration with indexes and foreign keys
- [ ] Queue job with retry and failure handling
- [ ] Event listener that fires on model creation
- [ ] Authorization gate for a non-model action
- [ ] Full-text search query using `whereFullText`
- [ ] Tests in Pest for an existing feature

## Issues encountered

- [ ] Any `npm` errors during install or setup
- [ ] Any agent behavior that contradicts installed skills/rules
- [ ] Retrieval results that were irrelevant or missing key guidance
- [ ] Broken links in documentation
- [ ] Instructions that were unclear or incomplete

## Feedback to include

- [ ] LaraSkills version
- [ ] Node.js version and OS
- [ ] AI coding tool used
- [ ] Installation profile
- [ ] `npx laraskills doctor` output (if available)
- [ ] `npx laraskills validate --format json` output (if available)
- [ ] Steps to reproduce any issues
