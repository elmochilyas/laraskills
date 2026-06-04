# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Code Organization Standards
**Knowledge Unit:** Namespace conventions and directory-to-namespace mapping
**Generated:** 2026-06-03

---

# Decision Inventory

* Keep root namespace as App\ vs change to project-specific name
* Deep sub-namespace nesting vs flat namespace structure
* Namespace aliasing vs class renaming for disambiguation

---

# Architecture-Level Decision Trees

---

## Keep Root Namespace as App\ vs Change to Project-Specific Name

---

## Decision Context

Laravel defaults to `App\` → `app/`. Some teams change the root namespace to match their project or company name (`Company\Project\`). This affects all `artisan make:` commands, stub templates, and package compatibility.

---

## Decision Criteria

* performance considerations — no performance impact from namespace prefix
* architectural considerations — custom root signals project identity but breaks framework tooling
* security considerations — no security impact
* maintainability considerations — changing root namespace requires updating every file's namespace declaration

---

## Decision Tree

Change from App\ namespace?
↓
Project is a reusable package distributed to others?
YES → Use package-specific namespace
NO → Project is a multi-tenant platform requiring namespace isolation?
    YES → Consider custom root namespace
    NO → Project is a white-label product sold to multiple clients?
        YES → Consider custom root namespace
        NO → Keep App\ namespace
            Keep App\ as default

---

## Rationale

All Laravel tools, packages, and documentation assume `App\` as the root namespace. Changing it requires stub overrides, breaks `artisan make:` defaults, and confuses new developers. The benefit of a custom namespace rarely justifies the cost.

---

## Recommended Default

**Default:** Keep `App\` as the root namespace
**Reason:** All packages and tooling assume `App\`. Changing it requires updating every file's namespace declaration and overriding stubs. The cost outweighs the benefit for most projects.

---

## Risks Of Wrong Choice

Custom root namespaces break `artisan make:` commands, require stub overrides, and confuse Laravel-experienced developers. Changing back is a massive refactoring effort.

---

## Related Rules

- R05: Keep Root Namespace as `App\` Unless Absolutely Necessary (COS-04/05-rules.md)
- R06: Update Both File Path and Namespace When Refactoring (COS-04/05-rules.md)

---

## Related Skills

- Apply Namespace Conventions Aligned with Directory Structure (COS-04/06-skills.md)
- Configure PSR-4 Autoloading for Custom Directories (COS-03/06-skills.md)

---

## Deep Sub-Namespace Nesting vs Flat Namespace Structure

---

## Decision Context

Sub-namespace depth affects FQCN readability, file path length, and IDE navigation. Deep nesting provides granular organization but creates unwieldy class references. Flat namespaces are simpler but risk class name collisions.

---

## Decision Criteria

* performance considerations — no autoloading performance impact with optimized class maps
* architectural considerations — deep nesting enables domain hierarchy; flat namespaces risk collisions
* security considerations — no security impact
* maintainability considerations — deep nesting reduces readability and approaches Windows MAX_PATH limits

---

## Decision Tree

Namespace depth decision?
↓
Sub-namespace depth exceeds 5-6 segments?
YES → Simplify — flatten or reorganize
NO → FQCN is readable and fits on standard line (120 chars)?
    YES → Acceptable depth
    NO → Reduce nesting or abbreviate directory names
    No → Long FQCN reduces readability

---

## Rationale

Deep namespace nesting reduces code readability and creates long import statements. The 5-6 segment limit balances organizational clarity with practicality. Windows MAX_PATH (260 chars) is a hard technical limit for file paths.

---

## Recommended Default

**Default:** Limit sub-namespace depth to 5-6 segments maximum
**Reason:** Deeper namespaces reduce readability, create long import statements, and approach Windows MAX_PATH limits on deeply nested projects.

---

## Risks Of Wrong Choice

Excessive nesting makes FQCNs unreadable and import statements excessively long. Too flat namespaces cause class name collisions and lack organizational clarity.

---

## Related Rules

- R04: Keep Sub-Namespace Depth at 5-6 Levels Maximum (COS-04/05-rules.md)
- R02: Keep `app/` Directory Nesting at 4 Levels Max (COS-01/05-rules.md)

---

## Related Skills

- Apply Namespace Conventions Aligned with Directory Structure (COS-04/06-skills.md)
- Apply Naming Conventions for Classes and Files (COS-08/06-skills.md)

---

## Namespace Aliasing vs Class Renaming for Disambiguation

---

## Decision Context

When two classes share the same unqualified name (e.g., two different `User` models), developers can either alias one with `use ... as ...` or rename one class to differentiate them. The choice affects import readability and long-term maintainability.

---

## Decision Criteria

* performance considerations — no performance impact from aliasing
* architectural considerations — aliasing masks naming problems; renaming fixes them
* security considerations — no security impact
* maintainability considerations — aliasing is a local fix; renaming is global but permanent

---

## Decision Tree

Two classes share the same unqualified name?
↓
Are both classes in the same application codebase?
YES → Rename one class to differentiate — aliasing masks the problem
NO → One is a vendor package class?
    YES → Aliasing is acceptable for disambiguation
    NO → Restructure namespaces to avoid collision

---

## Rationale

Namespace aliasing (`use App\Models\User as AppUser`) indicates poor naming or namespace structure. Two classes with the same unqualified name in the same application should be renamed to eliminate the ambiguity. Aliasing is acceptable for vendor package disambiguation.

---

## Recommended Default

**Default:** Rename conflicting application classes; alias only for vendor disambiguation
**Reason:** Aliasing masks poor naming choices. If two application classes have the same name, restructure or rename rather than creating aliases everywhere.

---

## Risks Of Wrong Choice

Excessive aliasing spreads naming confusion across the codebase. Aliases are local to each file, so different files may alias the same class differently, creating import inconsistency.

---

## Related Rules

- R03: Never Use Namespace Aliasing for Application Classes (COS-04/05-rules.md)
- R08: Ensure Custom Namespace Prefixes Do Not Conflict with Vendor Packages (COS-04/05-rules.md)

---

## Related Skills

- Apply Namespace Conventions Aligned with Directory Structure (COS-04/06-skills.md)
- Apply Naming Conventions for Classes and Files (COS-08/06-skills.md)
