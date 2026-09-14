# Slash Commands and Command Palette

## Slash command

Trigger `/` in an empty or eligible block.

Examples:
- `/paragraph`
- `/heading`
- `/section`
- `/article`
- `/image`
- `/table`
- `/quote`
- `/code`
- `/details`
- `/dialog`
- `/form`
- `/input`
- `/button`
- `/tag section`
- `/html element`

## Command palette

Recommended shortcut: `Ctrl+K`, configurable.

Search:
- commands
- tags
- aliases
- actions
- transformations
- inspector operations

## Command model

```ts
export interface RteCommand {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  shortcut?: string;
  category: string;
  priority: number;

  canExecute(context: RteContext): boolean;
  execute(context: RteContext): Promise<void> | void;

  getState?(context: RteContext): CommandState;
}
```

## Ranking

- exact tag match
- exact command match
- context compatibility
- recent usage
- favorites
- mode permissions
