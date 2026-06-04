# Skill: Implement API Changelog Maintenance

## Purpose
Maintain a human-readable API changelog documenting all API changes: new endpoints, breaking changes, deprecations, fixes, and version release notes with dates and migration guides.

## When To Use
- API version management
- API consumer communication
- Change tracking and audit

## When NOT To Use
- Internal code changelogs (use git)
- Unreleased/development changes

## Inputs
- Change log entries per version

## Workflow
1. Create `CHANGELOG.md` in API documentation directory
2. Follow Keep a Changelog format: version, date, categories (Added, Changed, Deprecated, Removed, Fixed, Security)
3. Group changes by API version
4. Link each change to relevant documentation or migration guide
5. Include deprecation notices with sunset dates
6. Include breaking change descriptions with migration instructions
7. Date each entry in ISO 8601 format
8. Update changelog with every API release
9. Review changelog for completeness before release
10. Link changelog from API documentation

## Validation Checklist
- [ ] CHANGELOG.md maintained
- [ ] Keep a Changelog format
- [ ] Changes grouped by version
- [ ] Deprecation notices with dates
- [ ] Breaking changes with migration guides
- [ ] Updated with every release
- [ ] Linked from API documentation

## Related Skills
- Deprecation Policy Design
- Breaking Change Process
- API Documentation Strategy
