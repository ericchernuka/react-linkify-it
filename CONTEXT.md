# React Linkify It

React Linkify It turns text inside React children into linked React nodes while preserving surrounding React structure.

## Language

**Children traversal**:
The process of walking React children to find text nodes that should be linkified.
_Avoid_: Parser

**String linkifier**:
The function that splits a single text string into plain text and linked React nodes.
_Avoid_: Parser, children parser

**Generated link node**:
A React node created by the string linkifier for a matched URL, email, mention, hashtag, or custom pattern.
_Avoid_: Parsed link

**Traversal key**:
A deterministic key generated within one children traversal for nodes created or cloned by the library.
_Avoid_: Global key, React id, getKey

## Relationships

- **Children traversal** delegates text strings to the **String linkifier**
- A **String linkifier** produces zero or more **Generated link nodes**
- A **Children traversal** preserves user-provided keys and uses **Traversal keys** only as fallbacks

## Example dialogue

> **Dev:** "Should the parser skip existing anchors?"
> **Domain expert:** "Say **Children traversal** here: existing anchors are React children, while the **String linkifier** only sees plain text."

## Flagged ambiguities

- "parser" was used for both React child walking and string splitting — resolved: use **Children traversal** for React node handling and **String linkifier** for string processing.
- "harness getKey" was used while discussing internal keys — resolved: remove `getKey()` and use **Traversal keys** as render-local deterministic keys.
