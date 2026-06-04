# json-api-resource-structure Rules

## Rule 1: Always Include `type` and `id` in Every Resource Object
---
## Category
Design
---
## Rule
Always include both mandatory `type` and `id` members in every JSON:API resource object — never omit either.
---
## Reason
`type` and `id` are the minimal resource identifier per the JSON:API spec. Omitting either breaks client-side normalization by `type:id`, which is the core value proposition of JSON:API.
---
## Bad Example
```php
public function toArray($request)
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        // no "type" — non-compliant
    ];
}
```
---
## Good Example
```php
public function toArray($request)
{
    return [
        'type' => 'users',
        'id' => (string) $this->id,
        'attributes' => [
            'name' => $this->name,
        ],
    ];
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Client normalization stores cannot index resources. Ember Data, Redux, and Orbit.js clients fail to process the response. Spec compliance validation fails.

## Rule 2: Always Cast `id` to String
---
## Category
Framework Usage
---
## Rule
Always cast `id` values to string with `(string) $this->id` in JSON:API resources.
---
## Reason
The JSON:API spec REQUIRES `id` to be a string. Integer IDs violate the spec and cause type mismatches in clients that expect string-typed IDs for normalization.
---
## Bad Example
```php
'id' => $this->id, // integer — spec violation
```
---
## Good Example
```php
'id' => (string) $this->id, // string — spec compliant
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Spec compliance check fails. Client code that uses strict comparison (`===`) for ID matching breaks. JSON:API validator tools reject the response.

## Rule 3: Separate Attributes from Relationships
---
## Category
Design
---
## Rule
Always put resource-specific scalar data in the `attributes` object and relationship links/data in the `relationships` object — never mix them.
---
## Reason
JSON:API defines `attributes` as an object containing only non-relationship fields. Mixing relationship data into `attributes` breaks client traversal logic that expects relationships in the designated section.
---
## Bad Example
```php
public function toArray($request)
{
    return [
        'type' => 'articles',
        'id' => (string) $this->id,
        'attributes' => [
            'title' => $this->title,
            'author_name' => $this->author->name, // relationship data in attributes
        ],
    ];
}
```
---
## Good Example
```php
public function toArray($request)
{
    return [
        'type' => 'articles',
        'id' => (string) $this->id,
        'attributes' => [
            'title' => $this->title,
            'body' => $this->body,
        ],
        'relationships' => [
            'author' => [
                'data' => ['type' => 'people', 'id' => (string) $this->author_id],
            ],
        ],
    ];
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Spec compliance failure. Clients expecting relationship data in `relationships` miss it. Attribute-name collision between relationship-derived values and actual attributes.

## Rule 4: Use Pluralized Kebab-Case for Type Names
---
## Category
Design
---
## Rule
Always use pluralized kebab-case (e.g., `blog-posts`, `user-accounts`) for JSON:API `type` member values across the entire API.
---
## Reason
JSON:API recommends pluralized kebab-case for type names. Consistent naming enables client normalization, predictable endpoint-to-type mapping, and spec compliance.
---
## Bad Example
```php
'type' => 'BlogPost',    // PascalCase — non-standard
'type' => 'blog_posts',  // snake_case — non-standard
```
---
## Good Example
```php
'type' => 'blog-posts',  // pluralized kebab-case — spec convention
'type' => 'user-accounts',
```
---
## Exceptions
Existing APIs with established type naming conventions — maintain consistency above spec preference.
---
## Consequences Of Violation
Client normalization stores cannot map endpoints to types predictably. Type-name collisions when PascalCase and kebab-case variants coexist for the same conceptual resource.

## Rule 5: Include Resource Linkage (`data` with `type:id`) in Every Relationship
---
## Category
Design
---
## Rule
Always include the `data` member with `type` and `id` in relationship objects wherever possible, not just `links`.
---
## Reason
Resource linkage lets clients build complete resource graphs without additional HTTP requests. Providing only `links` forces clients to fetch each relationship endpoint just to get the related resource IDs.
---
## Bad Example
```php
'relationships' => [
    'author' => [
        'links' => [
            'related' => '/articles/1/author',
        ],
        // No "data" — client must fetch /articles/1/author to get the ID
    ],
]
```
---
## Good Example
```php
'relationships' => [
    'author' => [
        'links' => [
            'self' => '/articles/1/relationships/author',
            'related' => '/articles/1/author',
        ],
        'data' => ['type' => 'people', 'id' => '9'],
    ],
]
```
---
## Exceptions
To-many relationships with zero records — `data` is an empty array.
---
## Consequences Of Violation
Client must make a separate HTTP request for every relationship to obtain IDs. Compound documents cannot map included resources to relationships.

## Rule 6: Never Include Pagination Metadata in `attributes`
---
## Category
Design
---
## Rule
Always put pagination metadata in the top-level `meta` and `links` objects, never inside resource `attributes`.
---
## Reason
Pagination is transport metadata, not resource data. Placing it in `attributes` mixes concerns and breaks client code that expects pagination at the document level.
---
## Bad Example
```php
'data' => [
    [
        'type' => 'articles',
        'id' => '1',
        'attributes' => [
            'title' => '...',
            'current_page' => 1, // pagination metadata in attributes
        ],
    ],
]
```
---
## Good Example
```php
'data' => [
    [
        'type' => 'articles',
        'id' => '1',
        'attributes' => [
            'title' => '...',
        ],
    ],
],
'meta' => [
    'current_page' => 1,
    'total' => 50,
],
'links' => [
    'first' => '/articles?page=1',
    'next' => '/articles?page=2',
]
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Client pagination logic must traverse resource attributes to find navigation data. Pagination metadata duplicated across every resource object in the collection.

## Rule 7: Use `route()` Helper for `self` Links, Never Hardcoded URLs
---
## Category
Security
---
## Rule
Always generate `self` link URLs with Laravel's `route()` helper, never hardcoded strings or string concatenation.
---
## Reason
Hardcoded URLs break when the application moves to a different domain, adds a prefix, or uses HTTPS. `route()` generates correct URLs based on the current request context and named route definitions.
---
## Bad Example
```php
'links' => [
    'self' => 'https://api.example.com/articles/' . $this->id,
]
```
---
## Good Example
```php
'links' => [
    'self' => route('api.articles.show', $this),
]
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
URLs break when deploying to different environments. HTTPS downgrade to HTTP behind proxies. Route prefix changes require updating every hardcoded URL.
