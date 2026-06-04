# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 03-etl-elt-pipelines
**Knowledge Unit:** data-vault-20
**Difficulty:** Advanced
**Category:** Data Modeling
**Last Updated:** 2026-06-03

---

# Overview

Data Vault 2.0 is an enterprise-grade data modeling methodology that separates data integration into three core constructs: **Hubs** (business keys), **Links** (relationships), and **Satellites** (context attributes). Unlike star schema (optimized for query performance) or 3NF (optimized for storage efficiency), Data Vault is optimized for auditability, flexibility, and parallel loading.

It is ideal for large-scale data warehouses integrating from multiple heterogeneous sources where schema agility and full historical tracking are requirements. The methodology provides a formal approach to handling source system changes without redesigning the warehouse — new columns become new satellites, new relationships become new links, new business keys become new hubs.

Engineers must care because Data Vault represents the most rigorous approach to enterprise data warehousing. It handles the hard problems — schema drift, multi-source integration, full auditability, parallel loading — that simpler models cannot address. For Laravel applications serving enterprise clients with complex data integration requirements, Data Vault provides a proven architectural pattern.

---

# Core Concepts

## Hub

A Hub stores unique business keys and their first-seen metadata. It does not contain any context attributes — just the key itself, a surrogate key, and tracking metadata (load date, record source).

## Link

A Link captures the relationships between Hubs. It stores the surrogate keys of related Hubs and may include relationship-specific metadata. Links are the equivalent of fact tables in Data Vault but without measures.

## Satellite

A Satellite stores the context attributes for a Hub or Link. Separate satellites for different source systems or attribute categories. Each satellite records the load date and tracks attribute changes over time.

## PIT (Point-In-Time) Table

A PIT table provides a pre-computed view of the state of all satellites at a specific point in time. It resolves the effective-dating complexity for temporal queries, enabling simple "as of" queries against Data Vault models.

## Bridge Table

A Bridge table pre-joins Hubs and Links at a specific grain for query performance. It is the Data Vault equivalent of a materialized view for star schema.

---

# When To Use

- Enterprise data warehouses integrating from 5+ heterogeneous source systems
- Regulatory environments requiring full audit trails on data provenance
- Systems where source schemas change frequently and independently
- Multi-source data integration with complex relationship mapping
- Environments requiring parallel loading of data from multiple sources
- Long-term archival with full historical tracking requirements

---

# When NOT To Use

- Simple analytics with 1-2 data sources (star schema is more practical)
- Real-time dashboards requiring sub-second query performance (Data Vault is read-optimized)
- Small data warehouses where full auditability is not a requirement
- Teams without Data Vault experience (the methodology has a steep learning curve)
- Prototype analytics where speed of implementation is critical

---

# Best Practices

## Business Key Uniqueness

Business keys in Hubs must be unique and immutable. If a business key changes, it represents a new entity, not an update. Use natural keys that are guaranteed unique by the source system.

## Load Date Tracking

Every Hub, Link, and Satellite must include a load date and record source. These enable full lineage tracking and point-in-time reconstruction of the data as it existed at any moment.

## Separate Satellites by Source and Rate of Change

Group attributes by source system and by change frequency. Rapidly changing attributes go in one satellite; stable attributes in another. This prevents unnecessary versioning of stable data.

## Satellite Overlap Prevention

Overlapping satellite effective dates must be prevented. A Hub should never have two satellites with overlapping date ranges claiming the same attribute. Use satellite type designators (Pit, Effectivity, Status Tracking) to organize.

---

# Architecture Guidelines

## Layer Placement

Data Vault occupies the Silver layer in Medallion Architecture, between raw Bronze ingestion and Gold presentation marts. Hubs and Links establish the structural foundation; Stars provide query performance.

## Loading Process

1. Staging → Bronze (raw data landing)
2. Bronze → Hubs (extract business keys)
3. Bronze → Links (extract relationships)
4. Bronze → Satellites (extract context attributes)
5. Hubs + Links + Satellites → PIT/Bridge → Gold (presentation)

## Parallel Loading

Data Vault supports fully parallel loading of Hubs, Links, and Satellites because they have no interdependencies at insert time. This enables massive throughput for batch loading.

---

# Performance Considerations

- Data Vault queries require 15-20 JOINs for a typical report. This is expected and by design — the model is optimized for loading, not querying.
- PIT tables reduce temporal query JOINs to 5-7, which is acceptable for most BI tools.
- Bridge tables reduce complex multi-path relationships to single-access queries.
- Materialized views or aggregations on Data Vault should use the Gold layer, not the Vault layer.

---

# Security Considerations

- Satellites may contain sensitive data. Use separate satellites for PII columns to enable column-level security.
- Record source metadata can be used for data governance and access control (users see only data from authorized sources).
- Data Vault's full audit trail means every data change is tracked. Ensure compliance with data retention policies for this metadata.

---

# Common Mistakes

## Mistake: Data Vault for OLTP

Using Data Vault as the application database model. Data Vault is designed for batch-loaded data warehouses, not for real-time transactional systems.

**Better approach:** Use Eloquent's normalized models for OLTP. Use Data Vault only in the warehouse layer.

## Mistake: Too Many Satellites

Creating a separate satellite for every minor attribute category. The satellite count becomes unmanageable, and querying requires joining 50+ satellites.

**Better approach:** Group related attributes into satellites. Use 5-10 satellites per Hub for most models.

## Mistake: Ignoring PIT Tables

Querying Data Vault directly for temporal reports without PIT tables. Each query requires complex window functions to resolve effective dates, making queries slow and error-prone.

**Better approach:** Create PIT tables for all Hubs that are queried for point-in-time analysis.

---

# Anti-Patterns

## Data Vault as a Silver Bullet

Applying Data Vault to every data warehousing problem, regardless of scale or requirements. The complexity of Data Vault is only justified when its specific advantages (auditability, parallel loading, schema flexibility) are needed.

**Solution:** Start with star schema for most analytics. Escalate to Data Vault only when star schema limitations become blockers.

## Business Keys in Satellites

Storing business key attributes in Satellites instead of Hubs. Business keys belong in Hubs; Satellites describe context around the business key.

**Solution:** Move business keys to the Hub. Satellites should contain only descriptive attributes that can change over time.

## Direct Gold Layer Queries on Data Vault

BI tools querying Data Vault tables directly instead of through PIT/Bridge or Gold marts. Query performance is poor, and temporal resolution logic is duplicated across every report.

**Solution:** Always create Gold marts for BI consumption. Data Vault is not a presentation layer.
