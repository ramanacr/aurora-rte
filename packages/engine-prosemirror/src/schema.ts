import { Schema, NodeSpec, MarkSpec } from 'prosemirror-model';

const nodes: Record<string, NodeSpec> = {
  doc: {
    content: 'block+'
  },
  paragraph: {
    group: 'block',
    content: 'inline*',
    attrs: { align: { default: 'left' } },
    parseDOM: [
      {
        tag: 'p',
        getAttrs(dom) {
          const el = dom as HTMLElement;
          const align = el.style.textAlign || el.getAttribute('align') || 'left';
          return { align };
        }
      }
    ],
    toDOM(node) {
      const align = node.attrs.align;
      return align && align !== 'left' ? ['p', { style: `text-align: ${align}` }, 0] : ['p', 0];
    }
  },
  heading: {
    attrs: {
      level: { default: 1 },
      align: { default: 'left' }
    },
    content: 'inline*',
    group: 'block',
    defining: true,
    parseDOM: [
      { tag: 'h1', getAttrs: (dom) => ({ level: 1, align: (dom as HTMLElement).style.textAlign || (dom as HTMLElement).getAttribute('align') || 'left' }) },
      { tag: 'h2', getAttrs: (dom) => ({ level: 2, align: (dom as HTMLElement).style.textAlign || (dom as HTMLElement).getAttribute('align') || 'left' }) },
      { tag: 'h3', getAttrs: (dom) => ({ level: 3, align: (dom as HTMLElement).style.textAlign || (dom as HTMLElement).getAttribute('align') || 'left' }) },
      { tag: 'h4', getAttrs: (dom) => ({ level: 4, align: (dom as HTMLElement).style.textAlign || (dom as HTMLElement).getAttribute('align') || 'left' }) },
      { tag: 'h5', getAttrs: (dom) => ({ level: 5, align: (dom as HTMLElement).style.textAlign || (dom as HTMLElement).getAttribute('align') || 'left' }) },
      { tag: 'h6', getAttrs: (dom) => ({ level: 6, align: (dom as HTMLElement).style.textAlign || (dom as HTMLElement).getAttribute('align') || 'left' }) }
    ],
    toDOM(node) {
      const attrs: Record<string, string> = {};
      if (node.attrs.align && node.attrs.align !== 'left') {
        attrs.style = `text-align: ${node.attrs.align}`;
      }
      return ['h' + node.attrs.level, attrs, 0];
    }
  },
  blockquote: {
    content: 'block+',
    group: 'block',
    defining: true,
    parseDOM: [{ tag: 'blockquote' }],
    toDOM() {
      return ['blockquote', 0];
    }
  },
  callout: {
    content: 'block+',
    group: 'block',
    defining: true,
    attrs: { type: { default: 'info' } },
    parseDOM: [
      {
        tag: 'div[data-aurora-callout]',
        getAttrs: (dom) => ({
          type: (dom as HTMLElement).getAttribute('data-aurora-callout') || 'info'
        })
      }
    ],
    toDOM(node) {
      const type = node.attrs.type || 'info';
      return [
        'div',
        {
          'data-aurora-callout': type,
          class: `aurora-callout aurora-callout-${type}`
        },
        0
      ];
    }
  },
  details: {
    content: 'details_summary block+',
    group: 'block',
    defining: true,
    parseDOM: [{ tag: 'details' }],
    toDOM() {
      return ['details', { class: 'aurora-details' }, 0];
    }
  },
  details_summary: {
    content: 'inline*',
    defining: true,
    isolating: true,
    parseDOM: [{ tag: 'summary' }],
    toDOM() {
      return ['summary', { class: 'aurora-summary' }, 0];
    }
  },
  code_block: {
    content: 'text*',
    marks: '',
    group: 'block',
    code: true,
    defining: true,
    attrs: { language: { default: '' } },
    parseDOM: [
      {
        tag: 'pre',
        preserveWhitespace: 'full',
        getAttrs: (dom) => {
          const el = dom as HTMLElement;
          return { language: el.getAttribute('data-language') || '' };
        }
      }
    ],
    toDOM(node) {
      return ['pre', { 'data-language': node.attrs.language }, ['code', 0]];
    }
  },
  horizontal_rule: {
    group: 'block',
    parseDOM: [{ tag: 'hr' }],
    toDOM() {
      return ['hr'];
    }
  },
  bullet_list: {
    content: 'list_item+',
    group: 'block',
    parseDOM: [{ tag: 'ul' }],
    toDOM() {
      return ['ul', 0];
    }
  },
  ordered_list: {
    content: 'list_item+',
    group: 'block',
    attrs: { order: { default: 1 } },
    parseDOM: [
      {
        tag: 'ol',
        getAttrs(dom) {
          const el = dom as HTMLElement;
          return { order: el.hasAttribute('start') ? Number(el.getAttribute('start')) : 1 };
        }
      }
    ],
    toDOM(node) {
      return node.attrs.order === 1 ? ['ol', 0] : ['ol', { start: node.attrs.order }, 0];
    }
  },
  list_item: {
    content: 'paragraph block*',
    defining: true,
    parseDOM: [{ tag: 'li' }],
    toDOM() {
      return ['li', 0];
    }
  },
  table: {
    content: 'table_row+',
    group: 'block',
    isolating: true,
    attrs: {
      rows: { default: 1 },
      cols: { default: 1 },
      tableWidth: { default: '100%' },
      bordered: { default: true },
      striped: { default: false },
      headerRow: { default: true }
    },
    parseDOM: [
      {
        tag: 'table',
        getAttrs(dom) {
          const el = dom as HTMLElement;
          return {
            rows: parseInt(el.getAttribute('data-rows') || '1', 10),
            cols: parseInt(el.getAttribute('data-cols') || '1', 10),
            tableWidth: el.getAttribute('data-table-width') || el.style.width || '100%',
            bordered: el.getAttribute('data-bordered') !== 'false',
            striped: el.getAttribute('data-striped') === 'true',
            headerRow: el.getAttribute('data-header-row') !== 'false'
          };
        }
      }
    ],
    toDOM(node) {
      const { tableWidth, bordered, striped, headerRow } = node.attrs;
      const classList: string[] = ['aurora-table'];
      if (bordered) classList.push('aurora-table-bordered');
      if (striped) classList.push('aurora-table-striped');
      if (headerRow) classList.push('aurora-table-header-row');

      const style = `width: ${tableWidth || '100%'}; table-layout: fixed; border-collapse: collapse; margin: 12px 0;`;
      return [
        'table',
        {
          class: classList.join(' '),
          style,
          'data-table-width': tableWidth || '100%',
          'data-bordered': String(bordered),
          'data-striped': String(striped),
          'data-header-row': String(headerRow)
        },
        ['tbody', 0]
      ];
    }
  },
  table_row: {
    content: '(table_cell | table_header)+',
    attrs: {
      height: { default: null }
    },
    parseDOM: [
      {
        tag: 'tr',
        getAttrs(dom) {
          const el = dom as HTMLElement;
          return {
            height: el.getAttribute('data-height') || el.style.height || null
          };
        }
      }
    ],
    toDOM(node) {
      const { height } = node.attrs;
      const attrs: Record<string, string> = {};
      if (height) {
        attrs.style = `height: ${typeof height === 'number' ? height + 'px' : height};`;
        attrs['data-height'] = String(height);
      }
      return ['tr', attrs, 0];
    }
  },
  table_cell: {
    content: 'block+',
    isolating: true,
    attrs: {
      colspan: { default: 1 },
      rowspan: { default: 1 },
      colwidth: { default: null },
      background: { default: null },
      align: { default: null }
    },
    parseDOM: [
      {
        tag: 'td',
        getAttrs(dom) {
          const el = dom as HTMLElement;
          return {
            colspan: parseInt(el.getAttribute('colspan') || '1', 10),
            rowspan: parseInt(el.getAttribute('rowspan') || '1', 10),
            colwidth: el.getAttribute('data-colwidth') || el.style.width || null,
            background: el.getAttribute('data-background') || el.style.backgroundColor || null,
            align: el.getAttribute('data-align') || el.style.textAlign || null
          };
        }
      }
    ],
    toDOM(node) {
      const { colspan, rowspan, colwidth, background, align } = node.attrs;
      const styleParts: string[] = [];
      if (colwidth) {
        const w = typeof colwidth === 'number' ? `${colwidth}px` : colwidth;
        styleParts.push(`width: ${w}`);
      }
      if (background) styleParts.push(`background-color: ${background}`);
      if (align) styleParts.push(`text-align: ${align}`);

      const attrs: Record<string, string> = {};
      if (colspan > 1) attrs.colspan = String(colspan);
      if (rowspan > 1) attrs.rowspan = String(rowspan);
      if (styleParts.length > 0) attrs.style = styleParts.join('; ');
      if (colwidth) attrs['data-colwidth'] = String(colwidth);
      if (background) attrs['data-background'] = background;
      if (align) attrs['data-align'] = align;

      return ['td', attrs, 0];
    }
  },
  table_header: {
    content: 'block+',
    isolating: true,
    attrs: {
      colspan: { default: 1 },
      rowspan: { default: 1 },
      colwidth: { default: null },
      background: { default: null },
      align: { default: null }
    },
    parseDOM: [
      {
        tag: 'th',
        getAttrs(dom) {
          const el = dom as HTMLElement;
          return {
            colspan: parseInt(el.getAttribute('colspan') || '1', 10),
            rowspan: parseInt(el.getAttribute('rowspan') || '1', 10),
            colwidth: el.getAttribute('data-colwidth') || el.style.width || null,
            background: el.getAttribute('data-background') || el.style.backgroundColor || null,
            align: el.getAttribute('data-align') || el.style.textAlign || null
          };
        }
      }
    ],
    toDOM(node) {
      const { colspan, rowspan, colwidth, background, align } = node.attrs;
      const styleParts: string[] = [];
      if (colwidth) {
        const w = typeof colwidth === 'number' ? `${colwidth}px` : colwidth;
        styleParts.push(`width: ${w}`);
      }
      if (background) styleParts.push(`background-color: ${background}`);
      if (align) styleParts.push(`text-align: ${align}`);

      const attrs: Record<string, string> = {};
      if (colspan > 1) attrs.colspan = String(colspan);
      if (rowspan > 1) attrs.rowspan = String(rowspan);
      if (styleParts.length > 0) attrs.style = styleParts.join('; ');
      if (colwidth) attrs['data-colwidth'] = String(colwidth);
      if (background) attrs['data-background'] = background;
      if (align) attrs['data-align'] = align;

      return ['th', attrs, 0];
    }
  },
  image: {
    inline: false,
    group: 'block',
    attrs: {
      src: { default: '' },
      alt: { default: '' },
      title: { default: '' },
      width: { default: null },
      height: { default: null },
      aspectRatio: { default: null },
      sizingMode: { default: 'responsive' },
      lockAspectRatio: { default: true },
      objectFit: { default: 'cover' },
      align: { default: 'center' },
      rounded: { default: false },
      shadow: { default: false },
      border: { default: false },
      linkUrl: { default: '' }
    },
    draggable: true,
    parseDOM: [
      {
        tag: 'img[src]',
        getAttrs(dom) {
          const el = dom as HTMLElement;
          const style = el.style;
          let align = el.getAttribute('data-align');
          if (!align) {
            if (style.marginLeft === 'auto' && style.marginRight === '0px') align = 'right';
            else if (style.marginLeft === 'auto') align = 'center';
            else if (style.marginLeft === '0px') align = 'left';
            else align = 'center';
          }
          const rawWidth = el.getAttribute('data-width') || style.width || el.getAttribute('width') || null;
          const rawHeight = el.getAttribute('data-height') || style.height || el.getAttribute('height') || null;
          const rawAspectRatio = el.getAttribute('data-aspect-ratio') || style.aspectRatio || null;
          const rawMode = el.getAttribute('data-sizing-mode') || (rawWidth && String(rawWidth).endsWith('px') ? 'fixed' : 'responsive');
          const rawLock = el.getAttribute('data-lock-ratio') !== 'false';
          const rawObjectFit = el.getAttribute('data-object-fit') || style.objectFit || 'cover';

          return {
            src: el.getAttribute('src'),
            alt: el.getAttribute('alt') || '',
            title: el.getAttribute('title') || '',
            width: rawWidth,
            height: rawHeight,
            aspectRatio: rawAspectRatio,
            sizingMode: rawMode,
            lockAspectRatio: rawLock,
            objectFit: rawObjectFit,
            align: align || 'center',
            rounded: el.getAttribute('data-rounded') === 'true' || Boolean(style.borderRadius),
            shadow: el.getAttribute('data-shadow') === 'true' || Boolean(style.boxShadow),
            border: el.getAttribute('data-border') === 'true' || Boolean(style.border),
            linkUrl: el.getAttribute('data-link-url') || ''
          };
        }
      }
    ],
    toDOM(node) {
      const { src, alt, title, width, height, aspectRatio, sizingMode, lockAspectRatio, objectFit, align, rounded, shadow, border, linkUrl } = node.attrs;
      const styles: string[] = ['max-width: 100%', 'transition: all 0.2s ease', 'box-sizing: border-box'];
      if (width) {
        styles.push(`width: ${typeof width === 'number' ? `${width}px` : width}`);
      }
      if (height && height !== 'auto') {
        styles.push(`height: ${typeof height === 'number' ? `${height}px` : height}`);
      } else if (!aspectRatio) {
        styles.push('height: auto');
      }
      if (aspectRatio && aspectRatio !== 'auto') {
        styles.push(`aspect-ratio: ${aspectRatio}`);
      }
      if (objectFit && (height || aspectRatio)) {
        styles.push(`object-fit: ${objectFit}`);
      }
      if (align === 'center') {
        styles.push('display: block', 'margin-left: auto', 'margin-right: auto');
      } else if (align === 'right') {
        styles.push('display: block', 'margin-left: auto', 'margin-right: 0');
      } else if (align === 'left') {
        styles.push('display: block', 'margin-left: 0', 'margin-right: auto');
      }
      if (rounded) {
        styles.push('border-radius: 12px');
      }
      if (shadow) {
        styles.push('box-shadow: 0 10px 25px rgba(0,0,0,0.25)');
      }
      if (border) {
        styles.push('border: 2px solid var(--aurora-border, #1a3366)');
      }
      const domAttrs: Record<string, string> = {
        src,
        alt: alt || '',
        title: title || '',
        style: styles.join('; '),
        'data-align': align || 'center',
        'data-width': width ? String(width) : '',
        'data-height': height ? String(height) : '',
        'data-aspect-ratio': aspectRatio ? String(aspectRatio) : '',
        'data-sizing-mode': sizingMode || 'responsive',
        'data-lock-ratio': lockAspectRatio === false ? 'false' : 'true',
        'data-object-fit': objectFit || 'cover',
        'data-rounded': rounded ? 'true' : 'false',
        'data-shadow': shadow ? 'true' : 'false',
        'data-border': border ? 'true' : 'false'
      };
      if (linkUrl) {
        domAttrs['data-link-url'] = linkUrl;
      }
      return ['img', domAttrs];
    }
  },
  embed: {
    group: 'block',
    attrs: {
      url: { default: '' },
      provider: { default: '' },
      title: { default: '' }
    },
    parseDOM: [
      {
        tag: 'div[data-aurora-embed]',
        getAttrs(dom) {
          const el = dom as HTMLElement;
          return {
            url: el.getAttribute('data-url') || '',
            provider: el.getAttribute('data-provider') || '',
            title: el.getAttribute('data-title') || ''
          };
        }
      }
    ],
    toDOM(node) {
      return [
        'div',
        {
          'data-aurora-embed': 'true',
          'data-url': node.attrs.url,
          'data-provider': node.attrs.provider,
          'data-title': node.attrs.title
        }
      ];
    }
  },
  custom_block: {
    group: 'block',
    attrs: {
      extensionId: { default: '' },
      data: { default: {} }
    },
    defining: true,
    parseDOM: [
      {
        tag: 'div[data-aurora-custom-block]',
        getAttrs(dom) {
          const el = dom as HTMLElement;
          let parsedData = {};
          try {
            parsedData = JSON.parse(el.getAttribute('data-custom-data') || '{}');
          } catch {}
          return {
            extensionId: el.getAttribute('data-extension-id') || '',
            data: parsedData
          };
        }
      }
    ],
    toDOM(node) {
      return [
        'div',
        {
          'data-aurora-custom-block': 'true',
          'data-extension-id': node.attrs.extensionId,
          'data-custom-data': JSON.stringify(node.attrs.data)
        }
      ];
    }
  },
  mention: {
    group: 'inline',
    inline: true,
    atom: true,
    attrs: {
      id: { default: '' },
      label: { default: '' }
    },
    parseDOM: [
      {
        tag: 'span[data-mention-id]',
        getAttrs(dom) {
          const el = dom as HTMLElement;
          return {
            id: el.getAttribute('data-mention-id') || '',
            label: el.getAttribute('data-mention-label') || el.textContent || ''
          };
        }
      }
    ],
    toDOM(node) {
      return [
        'span',
        {
          'data-mention-id': node.attrs.id,
          'data-mention-label': node.attrs.label,
          class: 'aurora-mention'
        },
        '@' + node.attrs.label
      ];
    }
  },
  text: {
    group: 'inline'
  },
  hard_break: {
    inline: true,
    group: 'inline',
    selectable: false,
    parseDOM: [{ tag: 'br' }],
    toDOM() {
      return ['br'];
    }
  }
};

const marks: Record<string, MarkSpec> = {
  bold: {
    parseDOM: [{ tag: 'strong' }, { tag: 'b' }],
    toDOM() {
      return ['strong', 0];
    }
  },
  italic: {
    parseDOM: [{ tag: 'em' }, { tag: 'i' }],
    toDOM() {
      return ['em', 0];
    }
  },
  underline: {
    parseDOM: [{ tag: 'u' }],
    toDOM() {
      return ['u', 0];
    }
  },
  strike: {
    parseDOM: [{ tag: 's' }, { tag: 'del' }, { tag: 'strike' }],
    toDOM() {
      return ['s', 0];
    }
  },
  code: {
    parseDOM: [{ tag: 'code' }],
    toDOM() {
      return ['code', 0];
    }
  },
  link: {
    attrs: {
      href: {},
      title: { default: null },
      target: { default: null },
      rel: { default: 'noopener noreferrer' }
    },
    inclusive: false,
    parseDOM: [
      {
        tag: 'a[href]',
        getAttrs(dom) {
          const el = dom as HTMLElement;
          return {
            href: el.getAttribute('href'),
            title: el.getAttribute('title'),
            target: el.getAttribute('target'),
            rel: el.getAttribute('rel') || 'noopener noreferrer'
          };
        }
      }
    ],
    toDOM(node) {
      const { href, title, target, rel } = node.attrs;
      return ['a', { href, title, target, rel }, 0];
    }
  },
  subscript: {
    parseDOM: [{ tag: 'sub' }],
    toDOM() {
      return ['sub', 0];
    }
  },
  superscript: {
    parseDOM: [{ tag: 'sup' }],
    toDOM() {
      return ['sup', 0];
    }
  },
  textColor: {
    attrs: { color: { default: null } },
    parseDOM: [
      {
        style: 'color',
        getAttrs: (value) => ({ color: value })
      }
    ],
    toDOM(mark) {
      return ['span', { style: `color: ${mark.attrs.color}` }, 0];
    }
  },
  textHighlight: {
    attrs: { color: { default: null } },
    parseDOM: [
      { tag: 'mark', getAttrs: (dom) => ({ color: (dom as HTMLElement).style.backgroundColor || null }) },
      {
        style: 'background-color',
        getAttrs: (value) => ({ color: value })
      }
    ],
    toDOM(mark) {
      const color = mark.attrs.color || '#ffeb3b';
      return ['mark', { style: `background-color: ${color}` }, 0];
    }
  },
  fontFamily: {
    attrs: { family: { default: null } },
    parseDOM: [
      {
        style: 'font-family',
        getAttrs: (value) => ({ family: value })
      }
    ],
    toDOM(mark) {
      return ['span', { style: `font-family: ${mark.attrs.family}` }, 0];
    }
  },
  fontSize: {
    attrs: { size: { default: null } },
    parseDOM: [
      {
        style: 'font-size',
        getAttrs: (value) => ({ size: value })
      }
    ],
    toDOM(mark) {
      return ['span', { style: `font-size: ${mark.attrs.size}` }, 0];
    }
  },
  comment: {
    attrs: {
      threadId: { default: '' }
    },
    inclusive: false,
    parseDOM: [
      {
        tag: 'span[data-comment-thread-id]',
        getAttrs(dom) {
          const el = dom as HTMLElement;
          return {
            threadId: el.getAttribute('data-comment-thread-id') || ''
          };
        }
      }
    ],
    toDOM(node) {
      return ['span', { 'data-comment-thread-id': node.attrs.threadId, class: 'aurora-comment-mark' }, 0];
    }
  }
};

export const auroraSchema = new Schema({ nodes, marks });
