| Metadata | |
|---|---|
| KU ID | ku-04 |
| Subdomain | search-ux-and-analytics |
| Topic | Search Result Highlighting |
| Source | Laravel / Search Engine Docs |
| Maturity | Stable |

## Overview

Search result highlighting shows which terms matched in the result snippet, helping users understand why each result was returned. Engines provide native highlighting (Meilisearch _formatted, Algolia _highlightResult, PostgreSQL 	s_headline). Custom highlighting is needed for Scout's database engine.

## Core Concepts

- **Engine Native Highlighting**: Meilisearch _formatted with <em> tags, Algolia _highlightResult
- **ts_headline (PostgreSQL)**: Native snippet generation with search term highlighting
- **Custom Highlighting**: PHP string replacement for database engine
- **Snippet Generation**: Truncating result text around matching terms
- **Stripping Highlight Tags**: Converting <em> to application-specific markup

## When To Use

- Any search results display (improves scanability)
- Long-text content where showing matched context is useful
- Users need to understand why a result was returned

## When NOT To Use

- Very short fields (titles only — no need for highlighting)
- Identifier/ID search (no natural language context)

## Best Practices

1. **Use engine-native highlighting**: Built-in, zero configuration for Meilisearch/Algolia.
2. **Strip and re-wrap tags**: Convert engine markup to your CSS framework's convention.
3. **Highlight in snippet context**: Show surrounding text, not just matched field.
4. **Limit snippet length**: 100-200 characters around match.
5. **Style distinctly**: Bold or colored highlights (not underline, looks like links).

## Related Topics

- K023 (Meilisearch formatted results)
- K015 (PostgreSQL ts_headline)
- K001 (Search UX patterns)

## AI Agent Notes

- Meilisearch and Algolia provide built-in result highlighting
- Scout database engine requires custom highlighting
- For agents: enable engine-native highlighting, implement custom for database engine

## Verification

- [ ] Engine-native highlighting enabled
- [ ] Highlighted fields shown in results
- [ ] Snippet truncation working
- [ ] Highlight styling applied
- [ ] Custom highlighting for database engine
