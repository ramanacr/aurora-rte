import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  createEditor,
  type AuroraEditor,
  type EditorChange,
  type SelectionState,
  type ExportRequest,
  type CommandName,
  type HostUploadAdapter
} from '@aurora/editor';
import type { AuroraDocument } from '@aurora/model';
import { createToolbar, type ToolbarInstance } from '@aurora/ui';

@Component({
  selector: 'aurora-editor',
  template: `
    <div class="aurora-angular-container">
      <div *ngIf="toolbar" #toolbarContainer class="aurora-angular-toolbar"></div>
      <div #editorMount class="aurora-angular-editor-mount" role="textbox" aria-multiline="true"></div>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AuroraEditorComponent),
      multi: true
    }
  ]
})
export class AuroraEditorComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() document?: AuroraDocument;
  @Input() toolbar: boolean = true;
  @Input() upload?: HostUploadAdapter;
  @Input() features?: unknown[];

  @Output() docChange = new EventEmitter<EditorChange>();
  @Output() selectionChange = new EventEmitter<SelectionState>();
  @Output() editorReady = new EventEmitter<AuroraEditor>();

  @ViewChild('editorMount', { static: true }) editorMountRef!: ElementRef<HTMLDivElement>;
  @ViewChild('toolbarContainer', { static: false }) toolbarMountRef?: ElementRef<HTMLDivElement>;

  private editor: AuroraEditor | null = null;
  private toolbarInstance: ToolbarInstance | null = null;
  private onModelChange: (value: AuroraDocument) => void = () => {};
  private onModelTouched: () => void = () => {};

  ngOnInit() {
    this.editor = createEditor({
      document: this.document,
      element: this.editorMountRef.nativeElement,
      upload: this.upload,
      features: this.features
    });

    if (this.toolbar && this.toolbarMountRef) {
      this.toolbarInstance = createToolbar({
        editor: this.editor,
        container: this.toolbarMountRef.nativeElement
      });
    }

    this.editor.on('change', (change) => {
      this.docChange.emit(change);
      this.onModelChange(change.document);
    });

    this.editor.on('selectionChange', (sel) => {
      this.selectionChange.emit(sel);
    });

    this.editor.on('blur', () => {
      this.onModelTouched();
    });

    this.editorReady.emit(this.editor);
  }

  ngOnDestroy() {
    this.toolbarInstance?.destroy();
    this.editor?.destroy();
    this.editor = null;
  }

  // ControlValueAccessor implementation
  writeValue(value: AuroraDocument | null): void {
    if (value && this.editor) {
      this.editor.setDocument(value);
    }
  }

  registerOnChange(fn: (value: AuroraDocument) => void): void {
    this.onModelChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onModelTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Optionally toggle editable
  }

  // Imperative facade delegates
  getDocument(): AuroraDocument | undefined {
    return this.editor?.getDocument();
  }

  setDocument(doc: AuroraDocument): void {
    this.editor?.setDocument(doc);
  }

  execute(name: CommandName | string, input?: unknown) {
    return this.editor?.execute(name, input);
  }

  export(request: ExportRequest): string {
    return this.editor?.export(request) || '';
  }

  focus(): void {
    this.editor?.focus();
  }
}
