# HTML Element Taxonomy

## 1. Document and metadata

`html`, `head`, `body`, `title`, `base`, `link`, `meta`, `style`, `script`, `noscript`, `template`, `slot`

Treatment:
- `html`, `head`, `body`: document boundaries
- `title`, `meta`, `base`, `link`: metadata manager
- `style`, `script`: restricted developer mode
- `template`, `slot`: Web Components/developer mode

## 2. Text and inline semantics

`p`, `span`, `strong`, `em`, `b`, `i`, `u`, `s`, `mark`, `small`, `del`, `ins`, `sub`, `sup`, `br`, `wbr`, `abbr`, `cite`, `q`, `dfn`, `data`, `time`, `kbd`, `samp`, `var`, `ruby`, `rt`, `rp`, `bdi`, `bdo`

## 3. Headings

`h1`, `h2`, `h3`, `h4`, `h5`, `h6`

## 4. Structure

`div`, `section`, `article`, `header`, `footer`, `main`, `nav`, `aside`, `address`, `search`

## 5. Lists

`ul`, `ol`, `li`, `dl`, `dt`, `dd`, `menu`

`li`, `dt`, and `dd` are contextual children.

## 6. Quotes and code

`blockquote`, `pre`, `code`

## 7. Media

`img`, `picture`, `source`, `figure`, `figcaption`, `audio`, `video`, `track`, `canvas`, `svg`, `iframe`, `embed`, `object`, `map`, `area`

Most media children are configuration-driven.

## 8. Tables

`table`, `caption`, `colgroup`, `col`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`

Rows/cells are contextual and managed by the table editor.

## 9. Forms

`form`, `label`, `input`, `textarea`, `select`, `option`, `optgroup`, `button`, `fieldset`, `legend`, `datalist`, `output`, `progress`, `meter`

`input` is a configurable component with a type selector.

## 10. Interactive

`details`, `summary`, `dialog`, `button`, `menu`, `search`, popover-enabled elements

`summary` is contextual under `details`.

## 11. Custom/Web Components

Custom elements matching the custom-element naming rules, `template`, and `slot`.

## 12. Legacy

Recognize and preserve where possible, but do not promote:
`acronym`, `big`, `center`, `font`, `strike`, `tt`, `frame`, `frameset`, `noframes`, `marquee`.

## Classification fields

Every element must be classified as:
- insertable
- contextual
- composite
- configurable
- metadata
- restricted
- preservable
- legacy
