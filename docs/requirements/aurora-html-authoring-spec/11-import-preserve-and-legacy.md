# Import, Preserve, and Legacy HTML

## Import behavior

1. Parse source HTML
2. Identify known elements
3. Preserve supported structure
4. Preserve custom elements under policy
5. Mark restricted elements
6. Normalize invalid nesting
7. Run accessibility checks
8. Record compatibility diagnostics

## Unknown/custom elements

Example:

```html
<my-product-card product-id="123"></my-product-card>
```

Preserve as a custom element node when allowed.

## Legacy elements

Recognize but do not promote:
- `font`
- `center`
- `strike`
- `big`
- `tt`
- `acronym`
- `marquee`
- frame-related elements

Offer:
- preserve
- convert
- inspect
- remove

## Migration examples

`<font color="red">` -> `<span style="color:red">` or semantic CSS class

`<center>` -> CSS alignment on a container

`<strike>` -> `<s>` where semantically appropriate
