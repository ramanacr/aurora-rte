import type { AuroraEditor } from '@aurora/editor';

export interface SlashCommandItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  category?: 'basic' | 'formatting' | 'media' | 'advanced';
  action: (editor: AuroraEditor) => void;
}

export function defaultSlashCommands(): SlashCommandItem[] {
  return [
    {
      id: 'paragraph',
      title: 'Text',
      description: 'Start writing plain text',
      category: 'basic',
      action: (e) => e.execute('setParagraph')
    },
    {
      id: 'h1',
      title: 'Heading 1',
      description: 'Large section heading',
      category: 'formatting',
      action: (e) => e.execute('setHeading', { level: 1 })
    },
    {
      id: 'h2',
      title: 'Heading 2',
      description: 'Medium section heading',
      category: 'formatting',
      action: (e) => e.execute('setHeading', { level: 2 })
    },
    {
      id: 'h3',
      title: 'Heading 3',
      description: 'Small section heading',
      category: 'formatting',
      action: (e) => e.execute('setHeading', { level: 3 })
    },
    {
      id: 'bullet-list',
      title: 'Bullet list',
      description: 'Create a simple bulleted list',
      category: 'basic',
      action: (e) => e.execute('toggleBulletList')
    },
    {
      id: 'ordered-list',
      title: 'Numbered list',
      description: 'Create a list with numbering',
      category: 'basic',
      action: (e) => e.execute('toggleOrderedList')
    },
    {
      id: 'quote',
      title: 'Quote',
      description: 'Capture a block quote',
      category: 'basic',
      action: (e) => e.execute('toggleBlockquote')
    },
    {
      id: 'code-block',
      title: 'Code block',
      description: 'Display a code snippet',
      category: 'advanced',
      action: (e) => e.execute('toggleCodeBlock')
    },
    {
      id: 'table',
      title: 'Table',
      description: 'Insert a 3x3 table',
      category: 'advanced',
      action: (e) => e.execute('insertTable', { rows: 3, columns: 3 })
    },
    {
      id: 'divider',
      title: 'Divider',
      description: 'Visually separate sections',
      category: 'basic',
      action: (e) => e.execute('insertHorizontalRule')
    }
  ];
}

export function slashCommands(customCommands: SlashCommandItem[] = []) {
  const allCommands = [...defaultSlashCommands(), ...customCommands];

  return {
    name: 'slashCommands',
    getCommands: (query = '') => {
      const q = query.toLowerCase().trim();
      if (!q) return allCommands;
      return allCommands.filter(
        (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      );
    }
  };
}
