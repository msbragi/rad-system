# Frontend AI Agent Guide

Refer to the main [root copilot instructions](../../.github/copilot-instructions.md) for all general rules, architecture, and workflows.

## Frontend-Specific Docs
- [Architecture](./architecture.md)
- [Quick Reference & Patterns](./quick-reference-patterns.md)
- [Open API reference for services](../../rag-openapi3-spec.json)

- **DO NOT** create or execute DB migration scripts.
    - **Instead:** Provide the data structure and the developer will apply DB changes.

---

### Before Writing Any Code
- **ASK TO DEVELOPER:** Where to find examples or guidelines for the feature you’re working on.   
- The project uses **Angular 20** with **Angular Material**
- Always use **standalone components**
- There are many helper, utilities, and services already written to reuse 
    ask before implementing inside the component something already existent 
    for example:
    * a spinner component activate on every http request
    * a Store service for configuration
    * a Snackbar service for displaying messages

### Patterns
- Use the new Angular syntax @if - @for @switch instead of old *ngIf - *ngFor - *ngSwitch
- never implement the error callback in subscription inside a component, 
  errors are trapped at service level
- When in @agent mode, ask for confirmation before making changes

### Architecture
- **Services**: Use existing services from `Services/api/` and `Services/common/`
- **Components**: Use Angular Material components for UI consistency
- **Forms**: Use Reactive Forms with proper validation

### Translations
- Use `@jsverse/transloco` with `*transloco="let t"` directive
- Translation files: Uses json format stored in `assets/i18n/[lang-code].json`
- Translation files Uses flattened structure for keys ex: `"common.edit": "Edit"`

### Styling
- Use Angular material components whenever possible and leave angular to set styling
- Never override Material standards unless explicitly requested
- Use SCSS with BEM methodology
- Do not define/override background and color styles
- Component encapsulation for isolated styles

---