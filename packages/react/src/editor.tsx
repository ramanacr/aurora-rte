import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import {
  createEditor,
  type AuroraEditor,
  type EditorOptions,
  type EditorChange,
  type SelectionState,
  type ExportRequest,
  type CommandName
} from '@aurora/editor';
import type { AuroraDocument } from '@aurora/model';
import { createToolbar, type ToolbarInstance, type EditorMode, type RtePolicy } from '@aurora/ui';
import {
  AuroraProvider,
  AuroraToolbar,
  AuroraHtmlElementPicker,
  AuroraCommandPalette,
  AuroraElementInspector,
  AuroraMobileActions
} from './html-authoring/index.js';

export interface AuroraEditorProps {
  document?: AuroraDocument;
  onChange?: (change: EditorChange) => void;
  onSelectionChange?: (selection: SelectionState) => void;
  toolbar?: boolean;
  legacyToolbar?: boolean;
  mode?: EditorMode;
  policy?: RtePolicy;
  enableAuthoringFeatures?: boolean;
  enableMobileActions?: boolean;
  className?: string;
  style?: React.CSSProperties;
  editorOptions?: Omit<EditorOptions, 'document' | 'element'>;
}

export interface AuroraEditorRef {
  getDocument: () => AuroraDocument | undefined;
  setDocument: (doc: AuroraDocument) => void;
  execute: (name: CommandName | string, input?: unknown) => void;
  export: (request: ExportRequest) => string;
  focus: () => void;
  editor: AuroraEditor | null;
}

export function useAuroraEditor(options: EditorOptions = {}): AuroraEditor | null {
  const editorRef = useRef<AuroraEditor | null>(null);

  useEffect(() => {
    const editor = createEditor(options);
    editorRef.current = editor;

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
  }, []);

  return editorRef.current;
}

export const AuroraEditorComponent = forwardRef<AuroraEditorRef, AuroraEditorProps>(
  function AuroraEditorComponent(props, ref) {
    const {
      document: initialDoc,
      onChange,
      onSelectionChange,
      toolbar = true,
      legacyToolbar = false,
      mode = 'standard',
      policy,
      enableAuthoringFeatures = true,
      enableMobileActions = false,
      className = '',
      style,
      editorOptions
    } = props;

    const editorMountRef = useRef<HTMLDivElement>(null);
    const toolbarMountRef = useRef<HTMLDivElement>(null);
    const [editorInstance, setEditorInstance] = useState<AuroraEditor | null>(null);
    const editorRef = useRef<AuroraEditor | null>(null);
    const toolbarRef = useRef<ToolbarInstance | null>(null);

    useImperativeHandle(ref, () => ({
      getDocument: () => editorRef.current?.getDocument(),
      setDocument: (doc) => editorRef.current?.setDocument(doc),
      execute: (name, input) => editorRef.current?.execute(name, input),
      export: (req) => editorRef.current?.export(req) || '',
      focus: () => editorRef.current?.focus(),
      editor: editorRef.current
    }));

    useEffect(() => {
      if (!editorMountRef.current) return;

      const editor = createEditor({
        ...editorOptions,
        document: initialDoc,
        element: editorMountRef.current
      });
      editorRef.current = editor;
      setEditorInstance(editor);

      if (toolbar && legacyToolbar && toolbarMountRef.current) {
        toolbarRef.current = createToolbar({
          editor,
          container: toolbarMountRef.current
        });
      }

      const unsubChange = editor.on('change', (change) => {
        onChange?.(change);
      });

      const unsubSelection = editor.on('selectionChange', (sel) => {
        onSelectionChange?.(sel);
      });

      return () => {
        unsubChange();
        unsubSelection();
        toolbarRef.current?.destroy();
        toolbarRef.current = null;
        editor.destroy();
        editorRef.current = null;
        setEditorInstance(null);
      };
    }, []);

    const content = (
      <div className={`aurora-react-editor-container ${className}`.trim()} style={style}>
        {toolbar && legacyToolbar && <div ref={toolbarMountRef} className="aurora-react-toolbar-mount" />}
        {toolbar && !legacyToolbar && <AuroraToolbar />}
        <div ref={editorMountRef} className="aurora-react-editor-mount" role="textbox" aria-multiline="true" />
        {enableMobileActions && <AuroraMobileActions />}
        <AuroraHtmlElementPicker />
        <AuroraCommandPalette />
        <AuroraElementInspector />
      </div>
    );

    if (enableAuthoringFeatures) {
      return (
        <AuroraProvider editor={editorInstance} mode={mode} policy={policy}>
          {content}
        </AuroraProvider>
      );
    }

    return content;
  }
);
