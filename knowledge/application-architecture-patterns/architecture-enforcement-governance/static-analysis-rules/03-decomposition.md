# Decomposition: Static analysis rules for architecture

## Topic Overview

Static analysis rules enforce architecture constraints at the code level without running tests. PHPStan (with custom rules) and Larastan can detect import violations, forbidden method calls, incorrect type usage, and missing contracts.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
AEG-03-static-analysis-rules/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Static analysis rules for architecture
- **Purpose:** Static analysis rules enforce architecture constraints at the code level without running tests. PHPStan (with custom rules) and Larastan can detect import violations, forbidden method calls, incorrect type usage, and missing contracts.
- **Difficulty:** Advanced
- **Dependencies:** COS-07 Static analysis

## Dependency Graph

This KU depends on: COS-07 Static analysis
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **PHPStan rule:** A class implementing `PHPStan\Rules\Rule`. Inspects AST nodes and reports errors when a violation is detected. **Custom architecture rule:** A PHPStan rule that checks project-specif...
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent architectural patterns covered in related KUs.

## Future Expansion Opportunities

None identified � the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization