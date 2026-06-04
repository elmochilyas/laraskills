# Decision Trees: Data Vault 2.0 Modeling

## Decision: Data Vault vs Star Schema

**Q: How many source systems feed the warehouse?**
- 1-3 → Star schema or simple dimensional model
- 4-10 → Consider Data Vault for integration layer
- 10+ → Data Vault recommended

**Q: How frequently do source schemas change?**
- Monthly or less → Star schema manageable
- Weekly → Data Vault's schema flexibility is beneficial
- Daily or continuous → Data Vault strongly recommended

**Q: Is full auditability required?**
- Yes (regulatory, compliance) → Data Vault
- No → Star schema or dimensional model

**Q: What is the primary warehouse goal?**
- Fast query performance → Star schema
- Fast loading + audit trail → Data Vault
- Integration of heterogeneous sources → Data Vault

## Decision: Satellite Design

**Q: How many attributes does the Hub have?**
- < 5 → Single Satellite
- 5-20 → 2-3 Satellites by category
- 20+ → Multiple Satellites by source and change rate

## Decision: PIT or No PIT

**Q: Do reports need "as of" date queries?**
- Yes → Create PIT tables
- No → Bridge tables may suffice
