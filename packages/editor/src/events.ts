import type { AuroraDocument, JsonPatch } from '@aurora/model';

export type ChangeOrigin = 'user' | 'command' | 'import' | 'api';

export interface EditorChange {
  document: AuroraDocument;
  patches: readonly JsonPatch[];
  origin: ChangeOrigin;
  transactionId: string;
}

export interface SelectionState {
  empty: boolean;
  from: number;
  to: number;
  selectedText?: string;
  activeMarks: string[];
  activeBlockType: string;
}

export interface EditorErrorEvent {
  message: string;
  code?: string;
  error?: unknown;
}

export type EditorEventMap = {
  change: EditorChange;
  selectionChange: SelectionState;
  error: EditorErrorEvent;
  focus: void;
  blur: void;
  destroy: void;
};

export type EditorEventName = keyof EditorEventMap;

export type EditorListener<K extends EditorEventName> = (payload: EditorEventMap[K]) => void;

export type Unsubscribe = () => void;
