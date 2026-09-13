import { Schema, NodeSpec, MarkSpec } from 'prosemirror-model';

const nodes: Record<string, NodeSpec> = {
  doc: {
    content: 'block+'
  },
  paragraph: {
    group: 'block',
    content: 'inline*',
    parseDOM: [{ tag: 'p' }],
    toDOM() {
      return ['p', 0];
    }
  },
  heading: {
    attrs: { level: { default: 1 } },
    content: 'inline*',
    group: 'block',
    defining: true,
    parseDOM: [
      { tag: 'h1', attrs: { level: 1 } },
      { tag: 'h2', attrs: { level: 2 } },
      { tag: 'h3', attrs: { level: 3 } },
      { tag: 'h4', attrs: { level: 4 } },
      { tag: 'h5', attrs: { level: 5 } },
      { tag: 'h6', attrs: { level: 6 } }
    ],
    toDOM(node) {
      return ['h' + node.attrs.level, 0];
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
    attrs: { rows: { default: 1 }, cols: { default: 1 } },
    parseDOM: [{ tag: 'table' }],
    toDOM() {
      return ['table', ['tbody', 0]];
    }
  },
  table_row: {
    content: '(table_cell | table_header)+',
    parseDOM: [{ tag: 'tr' }],
    toDOM() {
      return ['tr', 0];
    }
  },
  table_cell: {
    content: 'block+',
    isolating: true,
    attrs: {
      colspan: { default: 1 },
      rowspan: { default: 1 },
      colwidth: { default: null }
    },
    parseDOM: [{ tag: 'td' }],
    toDOM() {
      return ['td', 0];
    }
  },
  table_header: {
    content: 'block+',
    isolating: true,
    attrs: {
      colspan: { default: 1 },
      rowspan: { default: 1 },
      colwidth: { default: null }
    },
    parseDOM: [{ tag: 'th' }],
    toDOM() {
      return ['th', 0];
    }
  },
  image: {
    inline: false,
    group: 'block',
    attrs: {
      src: { default: '' },
      alt: { default: '' },
      title: { default: '' }
    },
    draggable: true,
    parseDOM: [
      {
        tag: 'img[src]',
        getAttrs(dom) {
          const el = dom as HTMLElement;
          return {
            src: el.getAttribute('src'),
            alt: el.getAttribute('alt') || '',
            title: el.getAttribute('title') || ''
          };
        }
      }
    ],
    toDOM(node) {
      return ['img', node.attrs];
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
