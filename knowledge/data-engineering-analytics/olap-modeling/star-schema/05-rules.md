# Rules: Star Schema Fact/Dimension Modeling Fundamentals

## Rule SS-01: Declare Grain First
The grain of every fact table MUST be declared and documented before schema design. The grain determines dimension scope and measures.

## Rule SS-02: Surrogate Keys for Dimensions
All dimension tables MUST use surrogate keys as primary keys. Natural keys are subject to change and must be stored as separate columns.

## Rule SS-03: Denormalized Dimensions
Dimension tables MUST be denormalized. Sub-dimension normalization (snowflake schema) is not permitted for analytics tables.

## Rule SS-04: Additive Facts Only
Fact measures MUST be additive across all dimensions. Non-additive measures must be decomposed into additive components.

## Rule SS-05: Date Foreign Key Required
Every fact table MUST have a date dimension foreign key. Time-based analysis requires dimensional date attributes.

## Rule SS-06: Conformed Dimensions Across Marts
Common dimensions (date, customer, product) MUST be conformed across all marts. Different dimension definitions in different marts prevent cross-mart analysis.

## Rule SS-07: No Descriptive Attributes in Facts
Facts MUST contain only measures and dimension foreign keys. Descriptive attributes belong in dimension tables.

## Rule SS-08: Partition Fact by Date
Fact tables MUST be partitioned by date for query performance, TTL management, and partition pruning.

## Rule SS-09: Document Dimension Role-Playing
Dimensions that play multiple roles (e.g., Order Date vs Ship Date both using dim_date) MUST be documented with role-playing examples.

## Rule SS-10: Design for Query Patterns
Star schema design MUST be driven by known query patterns, not by source system structure. Schema design starts from "what questions will we answer?"
