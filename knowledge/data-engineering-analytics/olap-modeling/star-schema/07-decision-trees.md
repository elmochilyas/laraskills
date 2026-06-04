# Decision Trees: Star Schema Fact/Dimension Modeling Fundamentals

## Decision: Grain Determination

**Q: What is the lowest-level event being tracked?**
- Individual transaction → Line-item grain
- Aggregated daily → Daily summary grain
- Monthly snapshot → Monthly grain

**Q: Are multiple grains needed?**
- Yes → Separate fact tables per grain
- No → One fact table at the chosen grain

## Decision: Dimension Role-Playing

**Q: Does a dimension play multiple roles?**
- Yes (Order Date, Ship Date) → Use dimension role-playing with aliased foreign keys
- No → Simple foreign key relationship

## Decision: Degenerate Dimension

**Q: Does the attribute have its own dimension table?**
- Yes → Use dimension foreign key
- No → Store as degenerate dimension in fact table (only if it has < 100K unique values)
