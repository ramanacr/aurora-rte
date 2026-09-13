import type { AuroraEditor } from '@aurora/editor';
import { sanitizeUrl } from '@aurora/editor';

export interface LinkOptions {
  allowSchemes?: string[];
}

export function links(_options: LinkOptions = {}) {
  return {
    name: 'links',
    init(editor: AuroraEditor) {
      return {
        setLink: (href: string, title?: string, target?: string) => {
          const safeHref = sanitizeUrl(href);
          if (!safeHref) {
            return { success: false, message: 'Invalid or unsafe link URL' };
          }
          return editor.execute('setLink', { href: safeHref, title, target });
        },
        removeLink: () => editor.execute('removeLink')
      };
    }
  };
}
