---
## Rule Name
Use Engine-Native Highlighting When Available

## Category
Framework Usage

## Rule
Always use Meilisearch's `_formatted` or Algolia's `_highlightResult` for result highlighting over custom PHP string replacement.

## Reason
Engine-native highlighting is accurate, handles edge cases (HTML tags, multi-term phrases), and requires zero custom code.

## Bad Example
```php
// Custom highlighting — error-prone
$snippet = str_replace($query, "<strong>$query</strong>", $result->description);
```

## Good Example
```php
// Meilisearch native highlighting — accurate
$snippet = $result->_formatted->description;  // Already highlighted with <em>
```

## Exceptions
Scout database engine which doesn't support native highlighting.

## Consequences Of Violation
Incorrect highlights — partial word matches, HTML injection, missing multi-term phrases.

---
## Rule Name
Strip and Re-Wrap Highlight Tags

## Category
Maintainability

## Rule
Always strip engine-native highlight tags and re-wrap with your CSS framework's convention.

## Reason
Different engines use different tags (`<em>`, `<highlight>`). Normalizing to your framework's convention ensures consistent styling.

## Bad Example
```php
// Using engine tags directly — styling tied to engine markup
{!! $result->_formatted->title !!}  // <em> tags in output
```

## Good Example
```php
// Normalize to your convention
$highlighted = str_replace(
    ['<em>', '</em>'],
    ['<mark class="bg-yellow-200">', '</mark>'],
    $result->_formatted->title
);
```

## Exceptions
CSS frameworks that target `<em>` tags directly.

## Consequences Of Violation
Inconsistent highlight styling when switching engines or CSS frameworks.

---
## Rule Name
Highlight in Snippet Context

## Category
UX

## Rule
Always display highlighted terms within a snippet of surrounding text, not just the raw matched field.

## Reason
Users need context around the matched term to evaluate relevance. A single word highlight without context is meaningless.

## Bad Example
```php
// Just the matched word — no context
<p>{{ $result->title }}</p>
<p><strong>{{ $query }}</strong></p>
```

## Good Example
```php
// Snippet with context
<p>{{ Str::limit($result->description, 200) }}</p>
<p>{!! snippetWithHighlight($result->_formatted->description, 150) !!}</p>
```

## Exceptions
Very short fields (titles, names) where the entire field is the context.

## Consequences Of Violation
Users see matched terms without context and cannot judge result relevance.
