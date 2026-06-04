# Decision Trees: Coding Standards Documentation

## Metadata
- **KU ID:** onboarding-team-standards/coding-standards-documentation
- **Phase:** 4 (Experience Curation)
- **Curator:** Phase 4 Standardization Process
- **Date Generated:** 2026-06-03
- **Source:** 04-standardized-knowledge.md

## Decision Inventory

| # | Decision | Typical Options | Context |
|---|----------|----------------|---------|
| 1 | What to document | Only non-enforceable / Everything / Architecture only | Avoiding duplication of automated tooling vs comprehensive coverage |
| 2 | Documentation location | Dedicated file / CONTRIBUTING.md / Wiki | Discoverability and maintenance workflow |
| 3 | Enforcement levels | Blocking + Advisory / All blocking / All advisory | How strict the team wants to be with standards |
| 4 | Review cadence | Quarterly / Biannual / On-demand | Keeping standards current without excessive overhead |
| 5 | Format and examples | Tabular / Narrative / Example-driven | Clarity and ease of reference during reviews |

## Architecture-Level Decision Trees

### Tree 1: What to Include in Coding Standards

- **Start:** Deciding what belongs in the coding standards document
- **Is the rule already enforced by Pint or PHPStan?**
  - Yes → Skip. Automation is the documentation. Reference the tool config only. Do not duplicate rules.
  - No → Continue.
- **Is the rule about formatting, spacing, or brace placement?**
  - Yes → Skip. Pint handles this. Do not include.
  - No → Continue.
- **Is the rule about architectural patterns (service layer, actions, DTOs)?**
  - Yes → Include with rationale and examples. These cannot be automated.
  - No → Continue.
- **Is the rule about naming conventions (controllers, models, traits)?**
  - Yes → Include with good/bad examples. Provide team-agreed naming patterns.
  - No → Continue.
- **Is the rule about testing conventions (TestDox, AAA, factories)?**
  - Yes → Include with examples. Testing patterns are team-specific and need documentation.
  - No → Skip. Document when the pattern becomes a recurring PR comment.

### Tree 2: Documentation Location and Structure

- **Start:** Where to store the coding standards
- **Is there already a CONTRIBUTING.md?**
  - Yes → Link from CONTRIBUTING.md to a dedicated file (`docs/standards.md`). Do not bloat CONTRIBUTING.md with detailed standards.
  - No → Continue.
- **Is the document longer than 5 pages?**
  - Yes → Use dedicated file with table of contents. Break into sections by file type (Controllers, Models, Migrations, Tests).
  - No → Include directly in CONTRIBUTING.md if under 3 pages.
- **For each section:** Use tabular format with good/bad code examples. Include a Pint config reference section. Add enforcement level (blocking/advisory) for each standard.

### Tree 3: Enforcement Level Assignment

- **Start:** A standard has been documented
- **Can the rule be enforced by CI (Pint, PHPStan, custom sniff)?**
  - Yes → Mark as Blocking. CI will fail if violated. Remove from human review checklist.
  - No → Continue.
- **Is the rule about logic correctness, security, or performance?**
  - Yes → Mark as Blocking. Must be enforced in code review. CI cannot catch these.
  - No → Continue.
- **Is the rule a team preference (convention, naming, pattern)?**
  - Yes → Mark as Advisory. Reviewers flag during review but do not block. Use "nitpick:" prefix for suggestions.
  - No → Reconsider whether the rule is needed at all.
- **Documentation decision:** Blocking rules go in a separate "Review Checklist" section. Advisory rules go in "Recommendations" section.

### Tree 4: Review and Update Cadence

- **Start:** The coding standards document exists
- **Has there been a team retro or feedback about standards?**
  - Yes → Schedule an immediate review session. Collect proposed changes. Open PR for updates.
  - No → Continue.
- **Is it quarterly review time?**
  - Yes → Continue.
  - No → Return to normal. Wait for quarterly review or team feedback trigger.
- **Review process:**
  1. Review each section for relevance. Remove standards that are no longer applicable.
  2. Check for new tools that automate previously manual standards. Demote documented rules to tool reference.
  3. Incorporate new patterns based on team experience.
  4. Update Pint/PHPStan config references if tooling has changed.
  5. Open PR for changes. Require team review. Merge with changelog entry.
