# Decomposition: Medallion Architecture (Bronze → Silver → Gold)

## Topic Overview
The Medallion Architecture — also called the "multi-hop" or "Bronze/Silver/Gold" architecture — is a data design pattern that progressively refines raw data through three layers of increasing quality and structure. Originating from Databricks and adopted by dbt as the standard ELT pattern, it maps naturally onto the Laravel analytics pipeline: raw events land in Bronze (append-only, immutable), are cleaned and deduplicated into Silver (staged, validated), and aggregated into Gold (marts, pre-computed for dashboards). The architecture's key benefit is decoupling data ingestion from consumption — schema changes at any layer only affect downstream layers, not upstream.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k014-medallion-architecture/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Medallion Architecture (Bronze → Silver → Gold)
- **Purpose:** The Medallion Architecture — also called the "multi-hop" or "Bronze/Silver/Gold" architecture — is a data design pattern that progressively refines raw data through three layers of increasing quality and structure.
- **Difficulty:** Advanced
- **Dependencies:** K004 (ETL Manifesto): Extracts from sources → feeds Bronze layer, K015 (dbt Incremental Models): dbt's incremental strategy for Silver/Gold, K033 (Late-Arriving Dimensions): Handling delayed data in Silver layer, K044 (Data Vault 2.0): Alternative to Medallion with Hubs/Links/Satellites

## Dependency Graph
**Depends on:**
- K004 (ETL Manifesto): Extracts from sources → feeds Bronze layer
- K015 (dbt Incremental Models): dbt's incremental strategy for Silver/Gold
- K033 (Late-Arriving Dimensions): Handling delayed data in Silver layer
- K044 (Data Vault 2.0): Alternative to Medallion with Hubs/Links/Satellites

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Bronze layer:
- Silver layer:
- Gold layer:
- Data promotion:
- Incremental processing:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K004 (ETL Manifesto): Extracts from sources → feeds Bronze layer, K015 (dbt Incremental Models): dbt's incremental strategy for Silver/Gold, K033 (Late-Arriving Dimensions): Handling delayed data in Silver layer, K044 (Data Vault 2.0): Alternative to Medallion with Hubs/Links/Satellites

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization