# Decision Trees: Laravel Vapor

## Serverless Platform Selection

**Need WebSockets?**
- Yes → Use Laravel Cloud (not Vapor)
- No → Vapor is viable

**Existing AWS investment:**
- Heavy AWS user → Vapor integrates naturally
- Multi-cloud → Consider platform-agnostic options

**Traffic pattern:**
- Very low with idle periods → Vapor (zero cost when idle)
- Consistent high traffic → Traditional server may be cheaper
- Unpredictable spikes → Vapor scales automatically
