# Decision Trees: SCD Type 1/2 Dimension Handling in Laravel Star-Schema

## Decision: SCD Type Selection

**Q: Does the attribute change affect historical reporting?**
- Yes → Type 2 (versioned)
- No → Type 1 (overwrite) or Type 0 (retain)

**Q: How often does the attribute change?**
- Rarely (yearly) → Type 2 is fine
- Monthly → Type 2 acceptable with monitoring
- Weekly or daily → Type 2 not recommended; use Type 1 or snapshot fact

**Q: Are regulatory requirements for auditability?**
- Yes → Type 2 (full history) or Type 3 (previous value only)
- No → Type 1 may be acceptable

## Decision: Implementation Tool

**Q: Is dbt available in the project?**
- Yes → Use dbt snapshots
- No → Implement custom SCD with hash comparison
