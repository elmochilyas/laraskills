# Knowledge Unit: Mysql Full Text

## Metadata

- **ID:** ku-00
- **Subdomain:** 02-database-fulltext-search
- **Source:** Laravel Scout / Industry
- **Maturity:** Stable
- **Laravel Relevance:** Mysql Full Text

## Executive Summary

MySQL FULLTEXT indexes enable full-text search directly in the database using MATCH ... AGAINST syntax. Scout's database engine leverages these indexes when the SearchUsingFullText attribute is applied to model columns. MySQL supports Boolean Mode (with +/- operators), Natural Language Mode (relevance-based), and Query Expansion. Default minimum word length is 3 characters.

## Core Concepts

- **FULLTEXT Index**: Special index type on CHAR/VARCHAR/TEXT columns for word-based search
- **Boolean Mode**: Supports +word (must include), -word (must exclude), * (wildcard)
- **Natural Language Mode**: Relevance-based sorting using TF-IDF; 50% threshold rule
- **Query Expansion**: Automatically adds related terms from top result documents
- **50% Threshold**: In Natural Language Mode, terms in >50% of rows return zero results

## Internal Mechanics

Standard implementation patterns for Mysql Full Text.

## Patterns

- Standard patterns apply for Mysql Full Text.

## Architectural Decisions

Standard architectural patterns for search and retrieval systems.

## Tradeoffs

- Standard tradeoffs apply, balancing complexity with capability.

## Performance Considerations

- Performance depends on scale and infrastructure choices.

## Production Considerations

- Standard production deployment practices apply.

## Common Mistakes

- Review anti-patterns and common pitfalls for Mysql Full Text.

## Failure Modes

- Understand failure modes for production resilience.

## Ecosystem Usage

Standard usage in Laravel search and retrieval applications.

## Related Knowledge Units

- - K002 (Scout database engine)
- - K015 (SearchUsingFullText attribute)
- - K016 (SearchUsingPrefix attribute)

## Research Notes

Source: Industry documentation and community best practices.

## Mental Models

- **Abstraction Layer**: Common patterns apply across search and retrieval systems.
