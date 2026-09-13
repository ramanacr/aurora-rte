import type { AuroraEditor } from '@aurora/editor';

export interface MentionItem {
  id: string;
  label: string;
  description?: string;
  avatarUrl?: string;
}

export interface MentionProvider {
  search(query: string): Promise<MentionItem[]>;
}

export interface MentionOptions {
  provider: MentionProvider;
  triggerChar?: string;
}

export function mentions(options: MentionOptions) {
  return {
    name: 'mentions',
    init(editor: AuroraEditor) {
      return {
        search: (query: string) => options.provider.search(query),
        insertMention: (item: MentionItem) =>
          editor.execute('insertMention', { id: item.id, label: item.label })
      };
    }
  };
}
