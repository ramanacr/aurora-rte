import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  Optional,
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
import { createToolbar, type ToolbarInstance, type EditorMode, type ThemeTokens } from '@aurora/ui';
import { HtmlAuthoringService } from './html-authoring/authoring.service.js';
import { AuroraRteToolbarComponent } from './html-authoring/toolbar.component.js';
import { AuroraHtmlElementPickerComponent } from './html-authoring/element-picker.component.js';
import { AuroraCommandPaletteComponent } from './html-authoring/command-palette.component.js';
import { AuroraElementInspectorComponent } from './html-authoring/element-inspector.component.js';
import { AuroraMobileActionsComponent } from './html-authoring/mobile-actions.component.js';
import { AuroraThemeService } from './theme/theme.service.js';

@Component({
  selector: 'aurora-editor',
  standalone: true,
  imports: [
    AuroraRteToolbarComponent,
    AuroraHtmlElementPickerComponent,
    AuroraCommandPaletteComponent,
    AuroraElementInspectorComponent,
    AuroraMobileActionsComponent
  ],
  template: `
    <div class="aurora-angular-container">
      @if (toolbar && !legacyToolbar) {
        <aurora-rte-toolbar [editor]="editor || undefined"></aurora-rte-toolbar>
      }
      @if (toolbar && legacyToolbar) {
        <div #toolbarContainer class="aurora-angular-toolbar"></div>
      }

      <div #editorMount class="aurora-angular-editor-mount" role="textbox" aria-multiline="true"></div>

      @if (enableMobileActions) {
        <aurora-mobile-actions></aurora-mobile-actions>
      }

      <aurora-html-element-picker></aurora-html-element-picker>
      <aurora-command-palette></aurora-command-palette>
      <aurora-element-inspector></aurora-element-inspector>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AuroraEditorComponent),
      multi: true
    },
    HtmlAuthoringService,
    AuroraThemeService
  ]
})
export class AuroraEditorComponent implements OnInit, OnChanges, OnDestroy, ControlValueAccessor {
  @Input() document?: AuroraDocument;
  @Input() toolbar: boolean = true;
  @Input() legacyToolbar: boolean = false;
  @Input() mode: EditorMode = 'standard';
  @Input() enableMobileActions: boolean = false;
  @Input() upload?: HostUploadAdapter;
  @Input() features?: unknown[];
  @Input() theme: string = 'auto';
  @Input() tokens?: Partial<ThemeTokens>;
  @Input() autoInherit: boolean = true;

  @Output() docChange = new EventEmitter<EditorChange>();
  @Output() selectionChange = new EventEmitter<SelectionState>();
  @Output() editorReady = new EventEmitter<AuroraEditor>();

  @ViewChild('editorMount', { static: true }) editorMountRef!: ElementRef<HTMLDivElement>;
  @ViewChild('toolbarContainer', { static: false }) toolbarMountRef?: ElementRef<HTMLDivElement>;

  public editor: AuroraEditor | null = null;
  private toolbarInstance: ToolbarInstance | null = null;
  private onModelChange: (value: AuroraDocument) => void = () => {};
  private onModelTouched: () => void = () => {};

  constructor(
    @Optional() public authoringService: HtmlAuthoringService = new HtmlAuthoringService(),
    @Optional() public themeService: AuroraThemeService = new AuroraThemeService(),
    @Optional() private hostEl?: ElementRef<HTMLElement>
  ) {}

  ngOnInit() {
    const targetEl = this.hostEl?.nativeElement || this.editorMountRef?.nativeElement || (typeof document !== 'undefined' ? document.createElement('div') : null);
    if (targetEl) {
      this.themeService.attach(targetEl, {
        theme: this.theme,
        tokens: this.tokens,
        autoInherit: this.autoInherit
      });
    }

    this.editor = createEditor({
      document: this.document,
      element: this.editorMountRef.nativeElement,
      upload: this.upload,
      features: this.features
    });

    this.authoringService.setEditor(this.editor, this.mode);

    if (this.toolbar && this.legacyToolbar && this.toolbarMountRef) {
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['theme'] && !changes['theme'].firstChange) {
      this.themeService.setTheme(this.theme);
    }
    if (changes['tokens'] && !changes['tokens'].firstChange && this.tokens) {
      this.themeService.setTokens(this.tokens);
    }
    if (changes['autoInherit'] && !changes['autoInherit'].firstChange) {
      this.themeService.setAutoInherit(this.autoInherit);
    }
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

  setDisabledState?(_isDisabled: boolean): void {
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

  openElementPicker(): void {
    this.authoringService.isElementPickerOpen = true;
  }

  openCommandPalette(): void {
    this.authoringService.isCommandPaletteOpen = true;
  }

  inspectElement(element: HTMLElement): void {
    this.authoringService.inspect(element);
  }
}
