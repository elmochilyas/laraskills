# Decision Trees: Database Migration CI

## Migration Strategy

**Deployment approach:**
- Zero-downtime → Forward-compatible migrations before code deploy
- Maintenance window → Migrations during deploy after traffic stopped
- Blue-green → Migrations shared, must work for both versions

## Migration Risk Assessment

**Rows affected:**
- < 100k rows → Standard migration is safe
- 100k-10M rows → Consider offline peak time migration
- > 10M rows → Use online schema change tool (pt-osc, gh-ost)
