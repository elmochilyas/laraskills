# Decision Trees: dbt Model Patterns (Incremental Merge, Append, Insert_Overwrite)

## Decision: Incremental Strategy Selection

**Q: Does the source data have updates to existing records?**
- Yes → Can existing records be identified?
  - Yes, by unique key → Merge strategy
  - No → Append with dedup in next model
- No → Append strategy (fastest)

**Q: Is the target table partitioned?**
- Yes → Insert Overwrite (most efficient for partition-based targets)
- No → Merge or Append

**Q: How large is the target table?**
- < 10M rows → Any strategy works; choose by data characteristics
- 10M-1B rows → Strategy choice matters for cost/performance
- 1B+ rows → Insert Overwrite mandatory for partitioned tables

## Decision: Full Refresh Cadence

**Q: How often does the model logic change?**
- Weekly or more → Schedule full refresh weekly
- Monthly → Schedule full refresh monthly
- Rarely → Full refresh only when logic changes

**Q: Is the source data backfilled?**
- Yes → Run full refresh after backfill completes
- No → Incremental runs sufficient
