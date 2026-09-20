---
name: Generated fetch client DOM iterable support
description: TypeScript configuration needed when Orval-generated clients enumerate Headers.
---

Generated fetch clients may call `Headers.entries()`, which requires the `dom.iterable` library in the shared client TypeScript configuration.

**Why:** The generated API client typecheck fails even though code generation succeeds when the DOM iterable declarations are missing.

**How to apply:** If a future OpenAPI codegen run reports `Property 'entries' does not exist on type 'Headers'`, add `dom.iterable` beside `dom` in the affected client package's `lib` compiler option.