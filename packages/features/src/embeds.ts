import type { AuroraEditor } from '@aurora/editor';

export interface EmbedProviderRule {
  name: string;
  pattern: RegExp;
  normalizeUrl: (url: string) => string;
}

export const DEFAULT_EMBED_PROVIDERS: EmbedProviderRule[] = [
  {
    name: 'youtube',
    pattern: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
    normalizeUrl: (url: string) => {
      const videoId = url.includes('youtu.be/')
        ? url.split('youtu.be/')[1]?.split(/[?#]/)[0]
        : new URL(url).searchParams.get('v');
      return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : url;
    }
  },
  {
    name: 'vimeo',
    pattern: /^(https?:\/\/)?(www\.)?vimeo\.com\/\d+/,
    normalizeUrl: (url: string) => {
      const match = /\/(\d+)/.exec(url);
      return match ? `https://player.vimeo.com/video/${match[1]}` : url;
    }
  },
  {
    name: 'codepen',
    pattern: /^(https?:\/\/)?(www\.)?codepen\.io\/[^/]+\/pen\/[^/]+/,
    normalizeUrl: (url: string) => url.replace('/pen/', '/embed/')
  }
];

export interface EmbedOptions {
  providers?: EmbedProviderRule[];
  onEmbedRequest?: (url: string, provider: string) => boolean | Promise<boolean>;
}

export function embeds(options: EmbedOptions = {}) {
  const providers = options.providers ?? DEFAULT_EMBED_PROVIDERS;

  return {
    name: 'embeds',
    init(editor: AuroraEditor) {
      return {
        insertEmbed: async (url: string, title = '') => {
          const matched = providers.find((p) => p.pattern.test(url));
          if (!matched) {
            return {
              success: false,
              message: 'URL does not match any approved embed provider'
            };
          }

          if (options.onEmbedRequest) {
            const allowed = await options.onEmbedRequest(url, matched.name);
            if (!allowed) {
              return { success: false, message: 'Embed rejected by host policy' };
            }
          }

          const normalized = matched.normalizeUrl(url);
          return editor.execute('insertEmbed', {
            url: normalized,
            provider: matched.name,
            title
          });
        }
      };
    }
  };
}
