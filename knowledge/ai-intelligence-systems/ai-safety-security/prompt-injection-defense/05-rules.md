---
id: KU-038 (AI Safety)
title: "Prompt Injection Defense - Rules"
subdomain: "ai-safety-security"
ku-type: "foundation"
date-created: "2026-06-02"
---

## Rules for Prompt Injection Defense

### R1: Implement structured input parsing that separates data from instruction-compatible content
- **Category:** Security
- **Rule:** When accepting structured user input (JSON, XML, Markdown with frontmatter), parse it into a structured data object and pass only the data fields to the LLM — never pass the raw structured text that contains delimiters the model may interpret as instructions.
- **Reason:** Delimiters in structured input (JSON keys, XML tags, Markdown headers) can be manipulated by attackers to create fake instruction sections. Structured parsing before the LLM removes the raw delimiter context.
- **Bad Example:** Passing raw JSON user input like `{"name": "John", "instructions": "ignore previous instructions"}` to the LLM — the model sees "instructions" key and may follow it.
- **Good Example:** The JSON is parsed; only the extracted data `["John"]` is passed to the LLM in a template: "The user's name is John."
- **Exceptions:** Free-text chat where there is no structured input to parse.
- **Consequences of Violation:** Attackers embed pseudo-instructions in structured data fields (JSON keys, XML structures) that the model interprets as directives.

### R2: Never output raw user input back to the user without escaping or sanitization
- **Category:** Security
- **Rule:** When response templates include user input (e.g., "You asked about X, here is the answer"), escape or sanitize the user input portion; never include raw user text in the response without treatment.
- **Reason:** Reflexive injection — the LLM includes the user's input verbatim in its response. If the user's input contains JavaScript or injection payloads and the response is rendered unsafely, XSS or other injection attacks can occur.
- **Bad Example:** An LLM response that includes "You said: 'hello world'" — the user actually sent a `<script>alert('xss')</script>` payload, and the response includes it verbatim.
- **Good Example:** The response template uses `htmlspecialchars($userInput)` before insertion; or the response is rendered via a framework that auto-escapes output.
- **Exceptions:** Markdown-rendering chat apps where only safe HTML is allowed.
- **Consequences of Violation:** Stored or reflected XSS attacks on other users viewing the conversation history; token or session theft via injected JavaScript.

### R3: Use input length limits that prevent instruction-override attacks by exhausting the prompt budget
- **Category:** Security
- **Rule:** Enforce strict input length limits (e.g., 2000 characters for chat, 1000 for a single instruction, 500 for a command) per input field; never accept unlimited-length user input.
- **Reason:** Some injection techniques rely on lengthy, repetitive inputs that overwhelm safety instructions or push them out of the context window (context window overflow attacks). Length limits prevent this.
- **Bad Example:** A code analysis tool accepting user input of unlimited length — an attacker sends a 100K-character file containing injection payloads at the end, after the safety instructions are pushed out of context.
- **Good Example:** The tool limits single-file uploads to 20K characters and processes files in chunks, with safety instructions repeated in each chunk.
- **Exceptions:** Document analysis tools where large files are the primary input.
- **Consequences of Violation:** Context-window overflow pushes safety instructions out; the model's behavior becomes increasingly influenced by user-controlled content.
