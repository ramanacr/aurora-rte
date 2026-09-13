import type { AuroraEditor, HostUploadAdapter } from '@aurora/editor';
import { sanitizeUrl } from '@aurora/editor';

export function media(uploadAdapter?: HostUploadAdapter) {
  return {
    name: 'media',
    init(editor: AuroraEditor) {
      return {
        insertImage: (src: string, alt = '', title = '') => {
          const safeSrc = sanitizeUrl(src, true);
          if (!safeSrc) {
            return { success: false, message: 'Invalid or unsafe image URL' };
          }
          return editor.execute('insertImage', { src: safeSrc, alt, title });
        },
        uploadAndInsert: async (file: File) => {
          if (!uploadAdapter) {
            return { success: false, message: 'No host upload adapter provided' };
          }
          try {
            const uploaded = await uploadAdapter.uploadFile(file);
            const safeSrc = sanitizeUrl(uploaded.url, true);
            if (!safeSrc) {
              return { success: false, message: 'Upload returned unsafe URL' };
            }
            return editor.execute('insertImage', {
              src: safeSrc,
              alt: uploaded.alt || file.name,
              title: uploaded.title || ''
            });
          } catch (err) {
            return {
              success: false,
              message: err instanceof Error ? err.message : 'Upload failed'
            };
          }
        }
      };
    }
  };
}
