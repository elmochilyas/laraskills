# Decision Trees: Write Amplification in ClickHouse MV Chains

## Decision: MV vs Refreshable MV

**Q: How fresh does the aggregated data need to be?**
- Real-time (seconds) → Trigger-based MV
- Near-real-time (minutes) → WAL-backed MV
- Delayed (hours/days) → Refreshable MV (zero write-time amplification)

## Decision: MV Consolidation

**Q: Do multiple MVs read from the same source?**
- Yes → Can they be combined into one MV?
  - Yes → Consolidate into a single MV with multiple aggregation columns
  - No → Keep separate but monitor amplification

## Decision: Projection vs MV

**Q: Is the transformation just a different sort order?**
- Yes → Use projection (lower amplification)
- No → Use MV
