# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-2 Blueprint Column Types
**Generated:** 2026-06-03

---

# Decision Inventory

* Column type selection per data category
* Numeric precision vs storage tradeoffs
* UUID vs auto-increment primary keys

---

# Architecture-Level Decision Trees

---

## Column Type Selection

---

## Decision Context

Choosing the correct Blueprint column type for each attribute, balancing storage efficiency, query performance, and data integrity.

---

## Decision Criteria

* performance: smaller types = faster scans, more rows per page
* architectural: type determines indexing capability and range
* maintainability: type changes require migrations
* security: type coercion can hide data issues

---

## Decision Tree

Choosing a column type for an attribute?
↓
Is the data monetary (prices, amounts, totals)?
YES → Use integer (cents) or decimal(10,2)
    → NEVER use float/double (rounding errors)
NO → Is the data a numeric identifier (ID, counter)?
    YES → Is it a primary key?
        YES → bigIncrements() or uuid()/ulid()
        NO → Is it a foreign key?
            YES → foreignId() (unsignedBigInteger) or uuid()
            NO → Use smallest integer type: tinyInteger/smallInteger/integer
NO → Is the data textual?
    YES → Is it searchable and < 255 chars?
        YES → string('col', $max_length)
        NO → Is it > 65KB?
            YES → longText
            NO → text or mediumText
NO → Is it date/time?
    YES → Need timezone-aware?
        YES → timestampTz() (PG) or datetime() with app-level tz
        NO → timestamp() or datetime()
NO → Is it JSON?
    YES → PostgreSQL: jsonb(). MySQL: json() or jsonb with generated column
NO → Is it spatial?
    → Use geometry() / geography() (check DB support)

---

## Rationale

Choosing the smallest correct type saves storage and improves performance. float/double for money causes cumulative rounding errors that become significant at scale. UUIDs are better for public identifiers but larger and slower for internal FK joins.

---

## Recommended Default

**Default:** bigIncrements() for PK, string(255) for names, text for long content, decimal(10,2) for money
**Reason:** Big increments support high-volume tables. String(255) is the practical maximum for indexable columns. Decimal prevents floating-point errors for financial data.

---

## Risks Of Wrong Choice

* float/double for money: rounding errors accumulate
* Oversized strings: wasted storage, slower in-memory sorting
* timestamp vs datetime confusion: Year 2038 problem with MySQL timestamp
* unsigned mismatch: FK reference type mismatch

---

## Related Rules

* Use smallest type that fits the data
* Never use float/double for monetary values

---

## Related Skills

* Define Blueprint Column Types
