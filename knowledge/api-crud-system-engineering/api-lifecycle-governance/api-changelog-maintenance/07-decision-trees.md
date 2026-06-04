# Decision Trees — API Changelog Maintenance

## Tree 1: Changelog Generation Approach

**Decision Context**: Choosing the primary method for generating changelog entries — fully automated, fully manual, or hybrid extraction from PR descriptions with manual curation.

**Decision Criteria**:
- Team size and release frequency
- CI maturity
- Content quality requirements
- Consumer sensitivity to changelog accuracy

**Decision Tree**:
```
Is the API public with external consumers?
├── YES → Use hybrid model: auto-extract from structured PR descriptions + manual curation before release
└── NO → Is the team larger than 5 developers?
    ├── YES → Do you release more than once per week?
    │   ├── YES → Use hybrid model (automation needed for velocity)
    │   └── NO → Use semi-automated: auto-extract with light review
    └── NO → Use curator-author model: one person writes entries from commit history + review
```

**Rationale**: Public APIs need the highest quality changelogs, justifying hybrid investment. Small teams can manage manual curation; large/frequent releases need automation support.

**Recommended Default**: Hybrid model — structured changelog blocks in PR descriptions, CI extracts on merge, human reviews and edits before release.

**Risks**:
- Fully automated loses narrative quality and may include internal noise
- Fully manual is inconsistent and forgotten under release pressure
- Hybrid requires PR discipline (structured changelog blocks)

**Related Rules/Skills**: Rules: Gate Releases on Changelog Updates in CI, Auto-Extract from PR Descriptions, Curate Manually. Skills: Implement API Changelog Maintenance.

---

## Tree 2: Changelog Format and Structure

**Decision Context**: Selecting the changelog format and storage approach — Keep a Changelog vs custom format, single file vs per-version, Markdown vs structured data.

**Decision Criteria**:
- Automated tooling requirements
- Multi-service architecture
- Consumer-facing vs internal use
- Archive and retention needs

**Decision Tree**:
```
Do you need a machine-readable changelog endpoint?
├── YES → Use Keep a Changelog format in CHANGELOG.md + generate JSON endpoint from it
└── NO → Do you have multiple services with shared consumers?
    ├── YES → Use per-service CHANGELOG.md + aggregated index; Keep a Changelog format
    └── NO → Is the changelog primarily for external consumers?
        ├── YES → Use Keep a Changelog format with breaking change markers and migration links
        └── NO → Use Keep a Changelog format (standardize early, even for internal)
```

**Rationale**: Keep a Changelog format is the industry standard with well-defined sections. Consistent format enables eventual automation and consumer tooling.

**Recommended Default**: Keep a Changelog format (`CHANGELOG.md`), sections: Added, Changed, Deprecated, Removed, Fixed, Security. Archive entries older than 2 years to `CHANGELOG-ARCHIVE.md`.

**Risks**:
- Custom formats don't integrate with standard tooling
- Per-service changelogs without index confuse consumers
- No archive strategy leads to unwieldy large files

**Related Rules/Skills**: Rules: Use the Keep a Changelog Format. Skills: Implement API Changelog Maintenance.

---

## Tree 3: Breaking Change Documentation Strategy

**Decision Context**: How to document and communicate breaking changes in the changelog — visual markers, separate section, migration links, and deprecation timing.

**Decision Criteria**:
- Impact severity of breaking change
- Number of affected consumers
- Migration complexity
- Release timing relative to deprecation window

**Decision Tree**:
```
Is the breaking change part of a scheduled major version release?
├── YES → Mark with [BREAKING] tag, link to comprehensive migration guide, group all breaking changes together
└── NO → Was this change announced through deprecation policy?
    ├── YES → Mark with [BREAKING] tag, link to deprecation notice, include migration instructions
    └── NO → Is the change immediately needed (security fix)?
        ├── YES → Mark with [BREAKING] tag + [SECURITY] tag, include urgent migration guide
        └── NO → Consider reverting; breaking changes without deprecation violate backward compatibility policy
```

**Rationale**: Breaking changes require maximum visibility. Tag and group them distinctly, always link to migration guidance. Breaking changes without deprecation cycle are exceptional and need strong justification.

**Recommended Default**: `### Changed [BREAKING] - Description of change with migration link.`

**Risks**:
- Breaking changes buried in changelog cause consumer breakage
- Missing migration links increase support burden
- Non-breaking changes marked as breaking desensitize consumers

**Related Rules/Skills**: Rules: Gate Releases on Changelog Updates in CI. Skills: Implement API Changelog Maintenance.
