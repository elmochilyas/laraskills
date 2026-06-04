# Ubiquitous Language Mapping — Skills

---

## Skill 1: Map Domain Terminology to Code Artifacts

### Purpose
Create a glossary of domain terms and map each term to its corresponding code artifact (model, method, service, value object), ensuring the codebase speaks the same language as the domain experts.

### When To Use
- Starting a new project or domain module
- The team's domain understanding is inconsistent (same concept, different names)
- You're onboarding new team members to the domain
- Code terms don't match business terms (e.g., `Product` instead of `Listing`)

### When NOT To Use
- The domain is trivial with no specialized terminology
- The team has already established consistent naming with no confusion

### Prerequisites
- Access to domain experts or documentation
- Existing codebase with ambiguous naming
- Whiteboard or shared document for the glossary

### Inputs
- List of domain terms from stakeholders
- Current codebase naming (models, methods, parameters)
- Mismatches between domain language and code

### Workflow

1. **Collect domain terms** from conversations, specs, and existing documentation

2. **Audit the codebase** — search for terms that differ from domain language

3. **Create a mapping table** — domain term → code artifact:

   | Domain Term | Code Artifact | File |
   |---|---|---|
   | Customer | `User` model (rename planned) | `app/Models/User.php` |
   | Booking | `Reservation` model | `app/Models/Reservation.php` |
   | Cancel booking | `Reservation::cancel()` method | `app/Models/Reservation.php` |
   | Listing fee | `Listing::fee` → `ListingFee` VO | `app/ValueObjects/ListingFee.php` |

4. **Rename code artifacts** to match domain terms where practical

5. **Add domain aliases** where renaming is too disruptive (use IDE comments, docblocks)

6. **Document the glossary** in the project README or a `docs/glossary.md`

7. **Review with domain experts** — confirm the mapping is accurate

### Validation Checklist

- [ ] Domain terms are collected and documented
- [ ] Each term maps to at least one code artifact
- [ ] Mismatches are identified and a plan exists to resolve them
- [ ] Renamed artifacts use exact domain terms
- [ ] Glossary is reviewed with domain experts
- [ ] New terminology is adopted in new code (not just refactored)

### Related Rules

| Rule | Reference |
|---|---|
| Name code artifacts after domain terms | `05-rules.md` Rule 1 |
| Document the domain-code mapping | `05-rules.md` Rule 2 |
| Rename mismatched artifacts where feasible | `05-rules.md` Rule 3 |
| Review terminology with domain experts | `05-rules.md` Rule 4 |
| Use domain terms in all new development | `05-rules.md` Rule 5 |

### Success Criteria
- Domain glossary exists (documented mapping)
- Code artifacts are renamed to match domain terms
- Mismatches are identified and addressed
- New code consistently uses domain language
- Domain experts confirm the terminology is correct
