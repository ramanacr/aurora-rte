import { t } from './i18n.js';
import type { AuroraEditor } from '@aurora/editor';

export interface DialogOptions {
  title: string;
  content: HTMLElement | string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export interface DialogInstance {
  close(): void;
  element: HTMLElement;
}

export function openDialog(options: DialogOptions): DialogInstance {
  const overlay = document.createElement('div');
  overlay.className = 'aurora-dialog-overlay';
  overlay.style.cssText = 'position: fixed; inset: 0; background: rgba(4, 8, 18, 0.75); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999;';

  const dialog = document.createElement('div');
  dialog.className = 'aurora-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  const titleId = `dialog-title-${Date.now()}`;
  dialog.setAttribute('aria-labelledby', titleId);
  dialog.style.cssText = 'background: var(--aurora-bg, #171a1c); color: var(--aurora-fg, #f1f4ef); padding: 24px; border-radius: 12px; max-width: 480px; width: 92%; box-shadow: 0 20px 60px rgba(0,0,0,0.7); border: 1px solid var(--aurora-border, #485054); box-sizing: border-box; font-family: var(--aurora-font-family, system-ui, sans-serif);';

  const header = document.createElement('div');
  header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;';
  const titleEl = document.createElement('h3');
  titleEl.id = titleId;
  titleEl.textContent = options.title;
  titleEl.style.cssText = 'margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--aurora-fg, #f1f4ef);';
  header.appendChild(titleEl);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', t('dialog.close', 'Close'));
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = 'background: transparent; border: none; font-size: 1.2rem; cursor: pointer; color: var(--aurora-muted-fg, #aab2b0); line-height: 1; padding: 4px;';
  closeBtn.addEventListener('click', close);
  header.appendChild(closeBtn);

  dialog.appendChild(header);

  const body = document.createElement('div');
  body.className = 'aurora-dialog-body';
  body.style.cssText = 'margin-bottom: 22px; color: var(--aurora-fg, #f1f4ef); font-size: 14px;';
  if (typeof options.content === 'string') {
    body.textContent = options.content;
  } else {
    body.appendChild(options.content);
  }
  dialog.appendChild(body);

  const footer = document.createElement('div');
  footer.style.cssText = 'display: flex; justify-content: flex-end; gap: 10px;';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.textContent = options.cancelText || t('dialog.cancel', 'Cancel');
  cancelBtn.style.cssText = 'padding: 8px 16px; border-radius: 6px; border: 1px solid var(--aurora-border, #485054); background: rgba(255,255,255,0.06); cursor: pointer; color: var(--aurora-fg, #f1f4ef); font-size: 14px; font-weight: 500; transition: background 0.15s;';
  cancelBtn.addEventListener('click', () => {
    options.onCancel?.();
    close();
  });
  footer.appendChild(cancelBtn);

  if (options.onConfirm) {
    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.textContent = options.confirmText || t('dialog.confirm', 'Confirm');
    confirmBtn.style.cssText = 'padding: 8px 18px; border-radius: 6px; border: none; background: var(--aurora-primary, #b7ff3c); color: var(--aurora-primary-fg, #172000); cursor: pointer; font-size: 14px; font-weight: 700; box-shadow: 0 2px 10px rgba(183,255,60,0.35); transition: opacity 0.15s;';
    confirmBtn.addEventListener('click', async () => {
      await options.onConfirm?.();
      close();
    });
    footer.appendChild(confirmBtn);
  }

  dialog.appendChild(footer);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  // Focus trap
  const focusable = dialog.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusable.length > 0) {
    focusable[0].focus();
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'Tab') {
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  }

  window.addEventListener('keydown', handleKey);

  function close() {
    window.removeEventListener('keydown', handleKey);
    overlay.remove();
  }

  return { close, element: dialog };
}

export interface PromptLinkOptions {
  href?: string;
  text?: string;
  target?: string | null;
}

export function promptLinkDialog(editor: AuroraEditor, initial?: PromptLinkOptions): void {
  const isEditing = Boolean(initial?.href);
  const content = document.createElement('div');
  content.style.display = 'flex';
  content.style.flexDirection = 'column';
  content.style.gap = '14px';

  const textGroup = document.createElement('div');
  const textLabel = document.createElement('label');
  textLabel.textContent = 'Text to display';
  textLabel.style.cssText = 'display:block;font-size:12px;margin-bottom:6px;font-weight:600;opacity:0.85;';
  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.placeholder = 'Link display text (optional)';
  textInput.value = initial?.text || '';
  textInput.style.cssText = 'width: 100%; padding: 9px 12px; border-radius: 6px; border: 1px solid var(--aurora-border, #485054); background: var(--aurora-surface, #24292c); color: var(--aurora-fg, #f1f4ef); box-sizing: border-box; font-size: 14px; outline: none; transition: border-color 0.15s;';
  textInput.addEventListener('focus', () => { textInput.style.borderColor = 'var(--aurora-primary, #b7ff3c)'; });
  textInput.addEventListener('blur', () => { textInput.style.borderColor = 'var(--aurora-border, #485054)'; });
  textGroup.appendChild(textLabel);
  textGroup.appendChild(textInput);
  content.appendChild(textGroup);

  const urlGroup = document.createElement('div');
  const urlLabel = document.createElement('label');
  urlLabel.textContent = 'URL *';
  urlLabel.style.cssText = 'display:block;font-size:12px;margin-bottom:6px;font-weight:600;opacity:0.85;';
  const urlInput = document.createElement('input');
  urlInput.type = 'url';
  urlInput.placeholder = 'https://example.com';
  urlInput.required = true;
  urlInput.value = initial?.href || '';
  urlInput.style.cssText = 'width: 100%; padding: 9px 12px; border-radius: 6px; border: 1px solid var(--aurora-border, #485054); background: var(--aurora-surface, #24292c); color: var(--aurora-fg, #f1f4ef); box-sizing: border-box; font-size: 14px; outline: none; transition: border-color 0.15s;';
  urlInput.addEventListener('focus', () => { urlInput.style.borderColor = 'var(--aurora-primary, #b7ff3c)'; });
  urlInput.addEventListener('blur', () => { urlInput.style.borderColor = 'var(--aurora-border, #485054)'; });
  urlGroup.appendChild(urlLabel);
  urlGroup.appendChild(urlInput);
  content.appendChild(urlGroup);

  const targetGroup = document.createElement('label');
  targetGroup.style.cssText = 'display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; user-select: none; color: var(--aurora-fg, #f1f4ef);';
  const targetCheckbox = document.createElement('input');
  targetCheckbox.type = 'checkbox';
  targetCheckbox.checked = initial ? initial.target === '_blank' : true;
  targetCheckbox.style.cssText = 'accent-color: var(--aurora-primary, #b7ff3c); cursor: pointer; width: 15px; height: 15px;';
  const targetText = document.createElement('span');
  targetText.textContent = 'Open link in new tab';
  targetGroup.appendChild(targetCheckbox);
  targetGroup.appendChild(targetText);
  content.appendChild(targetGroup);

  const submit = () => {
    const href = urlInput.value.trim();
    if (!href) return;
    editor.execute('setLink', {
      href,
      text: textInput.value.trim() || undefined,
      target: targetCheckbox.checked ? '_blank' : null
    });
    editor.focus();
  };

  const dlg = openDialog({
    title: isEditing ? 'Edit Link' : 'Insert Link',
    content,
    confirmText: isEditing ? 'Save Link' : 'Insert Link',
    onConfirm: submit
  });

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
      dlg.close();
    }
  };
  textInput.addEventListener('keydown', onKeyDown);
  urlInput.addEventListener('keydown', onKeyDown);

  setTimeout(() => {
    urlInput.focus();
    if (isEditing) {
      urlInput.select();
    }
  }, 50);
}

export interface PromptImageOptions {
  src?: string;
  alt?: string;
  title?: string;
  width?: string | number | null;
  height?: string | number | null;
  aspectRatio?: string | null;
  sizingMode?: 'responsive' | 'fixed';
  lockAspectRatio?: boolean;
  objectFit?: string;
  align?: 'left' | 'center' | 'right' | string;
  rounded?: boolean;
  shadow?: boolean;
  border?: boolean;
  linkUrl?: string;
}

export function promptImageDialog(
  editor: AuroraEditor,
  initial?: PromptImageOptions,
  onConfirmCustom?: (data: {
    src: string;
    alt: string;
    title: string;
    width?: string | null;
    height?: string | null;
    aspectRatio?: string | null;
    sizingMode?: 'responsive' | 'fixed';
    lockAspectRatio?: boolean;
    objectFit?: string;
    align?: string;
    rounded?: boolean;
    shadow?: boolean;
    border?: boolean;
    linkUrl?: string;
  }) => void
): void {
  const isEditing = Boolean(initial?.src);
  const content = document.createElement('div');
  content.style.display = 'flex';
  content.style.flexDirection = 'column';
  content.style.gap = '14px';

  // 1. URL Group with Live Preview Thumbnail
  const urlGroup = document.createElement('div');
  const urlLabel = document.createElement('label');
  urlLabel.textContent = 'Image URL *';
  urlLabel.style.cssText = 'display:block;font-size:12px;margin-bottom:6px;font-weight:600;opacity:0.85;color:var(--aurora-fg, #f1f4ef);';
  const urlRow = document.createElement('div');
  urlRow.style.cssText = 'display: flex; gap: 10px; align-items: center;';
  const urlInput = document.createElement('input');
  urlInput.type = 'url';
  urlInput.placeholder = 'https://images.unsplash.com/...';
  urlInput.required = true;
  urlInput.value = initial?.src || '';
  urlInput.style.cssText = 'flex: 1; padding: 9px 12px; border-radius: 6px; border: 1px solid var(--aurora-border, #485054); background: var(--aurora-surface, #24292c); color: var(--aurora-fg, #f1f4ef); box-sizing: border-box; font-size: 14px; outline: none;';
  
  const thumbPreview = document.createElement('img');
  thumbPreview.style.cssText = 'width: 42px; height: 42px; object-fit: cover; border-radius: 6px; border: 1px solid var(--aurora-border, #485054); background: rgba(0,0,0,0.2); display: none;';
  if (initial?.src) {
    thumbPreview.src = initial.src;
    thumbPreview.style.display = 'block';
  }
  urlInput.addEventListener('input', () => {
    if (urlInput.value.trim().startsWith('http') || urlInput.value.trim().startsWith('data:')) {
      thumbPreview.src = urlInput.value.trim();
      thumbPreview.style.display = 'block';
    } else {
      thumbPreview.style.display = 'none';
    }
  });

  urlRow.appendChild(urlInput);
  urlRow.appendChild(thumbPreview);
  urlGroup.appendChild(urlLabel);
  urlGroup.appendChild(urlRow);
  content.appendChild(urlGroup);

  // 2. Sizing Mode & Dimensions (Responsive/Fluid vs Fixed, Width, Height, Aspect Ratio, Lock)
  let currentSizingMode: 'responsive' | 'fixed' = initial?.sizingMode || (initial?.width && String(initial.width).endsWith('px') ? 'fixed' : 'responsive');
  let isLockedRatio = initial?.lockAspectRatio !== false;
  let selectedRatio = initial?.aspectRatio || 'auto';
  let selectedObjectFit = initial?.objectFit || 'cover';

  const sizeGroup = document.createElement('div');
  sizeGroup.style.cssText = 'background: var(--aurora-surface, #24292c); border: 1px solid var(--aurora-border, #485054); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 10px;';

  // Sizing Mode Tabs (Free-style/Fluid vs Fixed)
  const modeHeader = document.createElement('div');
  modeHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';
  const modeTitle = document.createElement('span');
  modeTitle.style.cssText = 'font-size: 12px; font-weight: 700; color: var(--aurora-primary, #b7ff3c); text-transform: uppercase; letter-spacing: 0.5px;';
  modeTitle.textContent = '📐 Sizing & Geometry';
  modeHeader.appendChild(modeTitle);

  const modeSwitch = document.createElement('div');
  modeSwitch.style.cssText = 'display: flex; gap: 4px; background: rgba(0,0,0,0.25); padding: 3px; border-radius: 6px; border: 1px solid var(--aurora-border, #485054);';
  
  const fluidBtn = document.createElement('button');
  fluidBtn.type = 'button';
  fluidBtn.textContent = '〰️ Fluid (%)';
  fluidBtn.title = 'Free-style responsive sizing scaling with page layout';

  const fixedBtn = document.createElement('button');
  fixedBtn.type = 'button';
  fixedBtn.textContent = '📏 Fixed (px)';
  fixedBtn.title = 'Fixed pixel-perfect dimensions with object-fit';

  const updateModeStyles = () => {
    const isFluid = currentSizingMode === 'responsive';
    fluidBtn.style.cssText = `padding: 4px 10px; font-size: 11px; font-weight: 600; border-radius: 4px; border: none; cursor: pointer; background: ${isFluid ? 'var(--aurora-primary, #b7ff3c)' : 'transparent'}; color: ${isFluid ? 'var(--aurora-primary-fg, #172000)' : 'var(--aurora-fg, #f1f4ef)'};`;
    fixedBtn.style.cssText = `padding: 4px 10px; font-size: 11px; font-weight: 600; border-radius: 4px; border: none; cursor: pointer; background: ${!isFluid ? 'var(--aurora-primary, #b7ff3c)' : 'transparent'}; color: ${!isFluid ? 'var(--aurora-primary-fg, #172000)' : 'var(--aurora-fg, #f1f4ef)'};`;
  };
  updateModeStyles();

  fluidBtn.addEventListener('click', () => {
    currentSizingMode = 'responsive';
    updateModeStyles();
    if (customWidthInput.value.endsWith('px')) {
      customWidthInput.value = '100%';
    }
  });

  fixedBtn.addEventListener('click', () => {
    currentSizingMode = 'fixed';
    updateModeStyles();
    if (customWidthInput.value.endsWith('%') || !customWidthInput.value) {
      customWidthInput.value = '500px';
    }
    if (!customHeightInput.value || customHeightInput.value === 'auto') {
      customHeightInput.value = '320px';
    }
  });

  modeSwitch.appendChild(fluidBtn);
  modeSwitch.appendChild(fixedBtn);
  modeHeader.appendChild(modeSwitch);
  sizeGroup.appendChild(modeHeader);

  // Width Presets
  const presetsRow = document.createElement('div');
  presetsRow.style.cssText = 'display: flex; gap: 6px; align-items: center; flex-wrap: wrap; font-size: 12px;';
  const presetsLabel = document.createElement('span');
  presetsLabel.textContent = 'Width Presets:';
  presetsLabel.style.cssText = 'font-size: 11px; opacity: 0.8; font-weight: 600; margin-right: 2px; color: var(--aurora-fg, #f1f4ef);';
  presetsRow.appendChild(presetsLabel);

  const presets = ['25%', '50%', '75%', '100%', 'Auto'];
  presets.forEach((pct) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = pct;
    btn.style.cssText = 'padding: 4px 10px; font-size: 11px; font-weight: 600; border-radius: 4px; border: 1px solid var(--aurora-border, #485054); background: transparent; color: var(--aurora-fg, #f1f4ef); cursor: pointer; transition: all 0.15s;';
    btn.addEventListener('click', () => {
      customWidthInput.value = pct === 'Auto' ? 'auto' : pct;
      currentSizingMode = pct === 'Auto' ? 'responsive' : 'responsive';
      updateModeStyles();
      presetsRow.querySelectorAll('button').forEach((b) => {
        b.style.background = 'transparent';
        b.style.color = 'var(--aurora-fg, #f1f4ef)';
      });
      btn.style.background = 'var(--aurora-primary, #b7ff3c)';
      btn.style.color = 'var(--aurora-primary-fg, #172000)';
    });
    presetsRow.appendChild(btn);
  });
  sizeGroup.appendChild(presetsRow);

  // Width, Height, and Aspect Ratio Lock Inputs
  const dimsRow = document.createElement('div');
  dimsRow.style.cssText = 'display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; align-items: end;';

  const widthCol = document.createElement('div');
  const widthLabel = document.createElement('label');
  widthLabel.textContent = 'Width';
  widthLabel.style.cssText = 'display: block; font-size: 11px; font-weight: 600; margin-bottom: 4px; opacity: 0.85; color: var(--aurora-fg, #f1f4ef);';
  const customWidthInput = document.createElement('input');
  customWidthInput.type = 'text';
  customWidthInput.placeholder = 'e.g. 100% or 600px';
  customWidthInput.value = initial?.width ? String(initial.width) : '100%';
  customWidthInput.style.cssText = 'width: 100%; padding: 7px 10px; border-radius: 6px; border: 1px solid var(--aurora-border, #485054); background: var(--aurora-bg, #171a1c); color: var(--aurora-fg, #f1f4ef); font-size: 13px; outline: none; box-sizing: border-box;';
  widthCol.appendChild(widthLabel);
  widthCol.appendChild(customWidthInput);

  // Lock Ratio Button
  const lockBtn = document.createElement('button');
  lockBtn.type = 'button';
  lockBtn.title = 'Toggle Aspect Ratio Lock (Fixed ratio vs Free-style)';
  const updateLockBtn = () => {
    lockBtn.innerHTML = isLockedRatio ? '🔒' : '🔓';
    lockBtn.style.cssText = `padding: 7px 10px; font-size: 14px; border-radius: 6px; border: 1px solid var(--aurora-border, #485054); background: ${isLockedRatio ? 'var(--aurora-primary-muted, rgba(183, 255, 60, 0.14))' : 'transparent'}; color: ${isLockedRatio ? 'var(--aurora-primary, #b7ff3c)' : 'var(--aurora-muted-fg, #aab2b0)'}; cursor: pointer; height: 36px;`;
  };
  updateLockBtn();
  lockBtn.addEventListener('click', () => {
    isLockedRatio = !isLockedRatio;
    updateLockBtn();
  });

  const heightCol = document.createElement('div');
  const heightLabel = document.createElement('label');
  heightLabel.textContent = 'Height';
  heightLabel.style.cssText = 'display: block; font-size: 11px; font-weight: 600; margin-bottom: 4px; opacity: 0.85; color: var(--aurora-fg, #f1f4ef);';
  const customHeightInput = document.createElement('input');
  customHeightInput.type = 'text';
  customHeightInput.placeholder = 'auto or 400px';
  customHeightInput.value = initial?.height ? String(initial.height) : 'auto';
  customHeightInput.style.cssText = 'width: 100%; padding: 7px 10px; border-radius: 6px; border: 1px solid var(--aurora-border, #485054); background: var(--aurora-bg, #171a1c); color: var(--aurora-fg, #f1f4ef); font-size: 13px; outline: none; box-sizing: border-box;';
  heightCol.appendChild(heightLabel);
  heightCol.appendChild(customHeightInput);

  dimsRow.appendChild(widthCol);
  dimsRow.appendChild(lockBtn);
  dimsRow.appendChild(heightCol);
  sizeGroup.appendChild(dimsRow);

  // Aspect Ratio Preset Selector
  const ratioGroup = document.createElement('div');
  ratioGroup.style.cssText = 'display: flex; gap: 6px; align-items: center; flex-wrap: wrap; font-size: 12px;';
  const ratioLabel = document.createElement('span');
  ratioLabel.textContent = 'Aspect Ratio:';
  ratioLabel.style.cssText = 'font-size: 11px; opacity: 0.8; font-weight: 600; margin-right: 2px; color: var(--aurora-fg, #f1f4ef);';
  ratioGroup.appendChild(ratioLabel);

  const ratioPresets = [
    { label: 'Auto (Original)', val: 'auto', ratio: null },
    { label: '1:1', val: '1/1', ratio: 1 },
    { label: '16:9', val: '16/9', ratio: 16 / 9 },
    { label: '4:3', val: '4/3', ratio: 4 / 3 },
    { label: '3:2', val: '3/2', ratio: 3 / 2 },
    { label: '21:9', val: '21/9', ratio: 21 / 9 },
    { label: 'Free', val: 'none', ratio: null }
  ];

  ratioPresets.forEach((rp) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = rp.label;
    const isCur = selectedRatio === rp.val || (rp.val === 'auto' && !selectedRatio);
    btn.style.cssText = `padding: 4px 8px; font-size: 11px; font-weight: 600; border-radius: 4px; border: 1px solid var(--aurora-border, #485054); background: ${isCur ? 'var(--aurora-primary, #b7ff3c)' : 'transparent'}; color: ${isCur ? 'var(--aurora-primary-fg, #172000)' : 'var(--aurora-fg, #f1f4ef)'}; cursor: pointer; transition: all 0.15s;`;
    btn.addEventListener('click', () => {
      selectedRatio = rp.val;
      ratioGroup.querySelectorAll('button').forEach((b) => {
        b.style.background = 'transparent';
        b.style.color = 'var(--aurora-fg, #f1f4ef)';
      });
      btn.style.background = 'var(--aurora-primary, #b7ff3c)';
      btn.style.color = 'var(--aurora-primary-fg, #172000)';

      if (rp.ratio && customWidthInput.value.endsWith('px')) {
        const numW = parseInt(customWidthInput.value, 10);
        if (numW > 0) {
          customHeightInput.value = `${Math.round(numW / rp.ratio)}px`;
        }
      }
    });
    ratioGroup.appendChild(btn);
  });
  sizeGroup.appendChild(ratioGroup);

  // Object Fit Selector
  const fitRow = document.createElement('div');
  fitRow.style.cssText = 'display: flex; gap: 8px; align-items: center; font-size: 11px; opacity: 0.9; color: var(--aurora-fg, #f1f4ef);';
  const fitLabel = document.createElement('label');
  fitLabel.textContent = 'Object Fit Scaling:';
  fitLabel.style.fontWeight = '600';
  fitRow.appendChild(fitLabel);

  const fitSelect = document.createElement('select');
  fitSelect.style.cssText = 'padding: 4px 8px; border-radius: 4px; border: 1px solid var(--aurora-border, #485054); background: var(--aurora-bg, #171a1c); color: var(--aurora-fg, #f1f4ef); font-size: 11px; outline: none; cursor: pointer;';
  ['cover', 'contain', 'fill', 'none'].forEach((f) => {
    const opt = document.createElement('option');
    opt.value = f;
    opt.textContent = f.charAt(0).toUpperCase() + f.slice(1);
    if (selectedObjectFit === f) opt.selected = true;
    fitSelect.appendChild(opt);
  });
  fitSelect.addEventListener('change', () => {
    selectedObjectFit = fitSelect.value;
  });
  fitRow.appendChild(fitSelect);
  sizeGroup.appendChild(fitRow);

  content.appendChild(sizeGroup);

  // 3. Alignment Selector
  const alignGroup = document.createElement('div');
  const alignLabel = document.createElement('label');
  alignLabel.textContent = 'Alignment';
  alignLabel.style.cssText = 'display:block;font-size:12px;margin-bottom:6px;font-weight:600;opacity:0.85;color:var(--aurora-fg, #f1f4ef);';
  alignGroup.appendChild(alignLabel);

  let selectedAlign = initial?.align || 'center';
  const alignRow = document.createElement('div');
  alignRow.style.cssText = 'display: flex; gap: 8px;';
  const alignOptions = [
    { id: 'left', label: '⫷ Left' },
    { id: 'center', label: '☰ Center' },
    { id: 'right', label: '⫸ Right' }
  ];
  alignOptions.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = opt.label;
    btn.style.cssText = `flex: 1; padding: 6px 12px; font-size: 12px; font-weight: 600; border-radius: 5px; border: 1px solid var(--aurora-border, #485054); background: ${selectedAlign === opt.id ? 'var(--aurora-primary, #b7ff3c)' : 'transparent'}; color: ${selectedAlign === opt.id ? 'var(--aurora-primary-fg, #172000)' : 'var(--aurora-fg, #f1f4ef)'}; cursor: pointer; transition: all 0.15s;`;
    btn.addEventListener('click', () => {
      selectedAlign = opt.id;
      alignRow.querySelectorAll('button').forEach((b) => {
        b.style.background = 'transparent';
        b.style.color = 'var(--aurora-fg, #f1f4ef)';
      });
      btn.style.background = 'var(--aurora-primary, #b7ff3c)';
      btn.style.color = 'var(--aurora-primary-fg, #172000)';
    });
    alignRow.appendChild(btn);
  });
  alignGroup.appendChild(alignRow);
  content.appendChild(alignGroup);

  // 4. Visual Styles (Rounded, Shadow, Border)
  const styleGroup = document.createElement('div');
  const styleLabel = document.createElement('label');
  styleLabel.textContent = 'Visual Effects & Framing';
  styleLabel.style.cssText = 'display:block;font-size:12px;margin-bottom:6px;font-weight:600;opacity:0.85;color:var(--aurora-fg, #f1f4ef);';
  styleGroup.appendChild(styleLabel);

  const stylesRow = document.createElement('div');
  stylesRow.style.cssText = 'display: flex; gap: 14px; flex-wrap: wrap; font-size: 13px; color: var(--aurora-fg, #f1f4ef);';

  const checkRounded = document.createElement('input');
  checkRounded.type = 'checkbox';
  checkRounded.checked = Boolean(initial?.rounded);
  checkRounded.style.cssText = 'accent-color: var(--aurora-primary, #b7ff3c); cursor: pointer; width: 15px; height: 15px;';
  const labelRounded = document.createElement('label');
  labelRounded.style.cssText = 'display: flex; align-items: center; gap: 5px; cursor: pointer; user-select: none;';
  labelRounded.appendChild(checkRounded);
  labelRounded.appendChild(document.createTextNode('Rounded Corners'));

  const checkShadow = document.createElement('input');
  checkShadow.type = 'checkbox';
  checkShadow.checked = Boolean(initial?.shadow);
  checkShadow.style.cssText = 'accent-color: var(--aurora-primary, #b7ff3c); cursor: pointer; width: 15px; height: 15px;';
  const labelShadow = document.createElement('label');
  labelShadow.style.cssText = 'display: flex; align-items: center; gap: 5px; cursor: pointer; user-select: none;';
  labelShadow.appendChild(checkShadow);
  labelShadow.appendChild(document.createTextNode('Elevation Shadow'));

  const checkBorder = document.createElement('input');
  checkBorder.type = 'checkbox';
  checkBorder.checked = Boolean(initial?.border);
  checkBorder.style.cssText = 'accent-color: var(--aurora-primary, #b7ff3c); cursor: pointer; width: 15px; height: 15px;';
  const labelBorder = document.createElement('label');
  labelBorder.style.cssText = 'display: flex; align-items: center; gap: 5px; cursor: pointer; user-select: none;';
  labelBorder.appendChild(checkBorder);
  labelBorder.appendChild(document.createTextNode('Accent Border'));

  stylesRow.appendChild(labelRounded);
  stylesRow.appendChild(labelShadow);
  stylesRow.appendChild(labelBorder);
  styleGroup.appendChild(stylesRow);
  content.appendChild(styleGroup);

  // 5. Alt Description (Accessibility)
  const altGroup = document.createElement('div');
  const altLabel = document.createElement('label');
  altLabel.textContent = 'Alt Description (Screen readers & SEO)';
  altLabel.style.cssText = 'display:block;font-size:12px;margin-bottom:6px;font-weight:600;opacity:0.85;color:var(--aurora-fg, #f1f4ef);';
  const altInput = document.createElement('input');
  altInput.type = 'text';
  altInput.placeholder = 'Accessible description of the image';
  altInput.value = initial?.alt || '';
  altInput.style.cssText = 'width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--aurora-border, #485054); background: var(--aurora-surface, #24292c); color: var(--aurora-fg, #f1f4ef); box-sizing: border-box; font-size: 13px; outline: none;';
  altGroup.appendChild(altLabel);
  altGroup.appendChild(altInput);
  content.appendChild(altGroup);

  // 6. Hyperlink (Click image to open link)
  const linkGroup = document.createElement('div');
  const linkLabel = document.createElement('label');
  linkLabel.textContent = 'Link URL (optional, opens when image is clicked)';
  linkLabel.style.cssText = 'display:block;font-size:12px;margin-bottom:6px;font-weight:600;opacity:0.85;color:var(--aurora-fg, #f1f4ef);';
  const linkInput = document.createElement('input');
  linkInput.type = 'url';
  linkInput.placeholder = 'https://...';
  linkInput.value = initial?.linkUrl || '';
  linkInput.style.cssText = 'width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--aurora-border, #485054); background: var(--aurora-surface, #24292c); color: var(--aurora-fg, #f1f4ef); box-sizing: border-box; font-size: 13px; outline: none;';
  linkGroup.appendChild(linkLabel);
  linkGroup.appendChild(linkInput);
  content.appendChild(linkGroup);

  const submit = () => {
    const src = urlInput.value.trim();
    if (!src) return;
    const data = {
      src,
      alt: altInput.value.trim(),
      title: (initial?.title || '').trim(),
      width: customWidthInput.value.trim() || null,
      height: customHeightInput.value.trim() || null,
      aspectRatio: selectedRatio === 'none' ? null : selectedRatio,
      sizingMode: currentSizingMode,
      lockAspectRatio: isLockedRatio,
      objectFit: selectedObjectFit,
      align: selectedAlign,
      rounded: checkRounded.checked,
      shadow: checkShadow.checked,
      border: checkBorder.checked,
      linkUrl: linkInput.value.trim() || undefined
    };
    if (onConfirmCustom) {
      onConfirmCustom(data as any);
    } else if (isEditing) {
      editor.execute('updateImage', data);
    } else {
      editor.execute('insertImage', data);
    }
    editor.focus();
  };

  const dlg = openDialog({
    title: isEditing ? 'Edit Image Properties & Sizing' : 'Insert Image',
    content,
    confirmText: isEditing ? 'Save Changes' : 'Insert Image',
    onConfirm: submit
  });

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
      dlg.close();
    }
  };
  altInput.addEventListener('keydown', onKeyDown);
  urlInput.addEventListener('keydown', onKeyDown);
  customWidthInput.addEventListener('keydown', onKeyDown);
  customHeightInput.addEventListener('keydown', onKeyDown);

  setTimeout(() => {
    urlInput.focus();
    if (isEditing) {
      urlInput.select();
    }
  }, 50);
}

export interface PromptTablePropertiesOptions {
  tableEl?: HTMLElement | null;
  tableWidth?: string;
  bordered?: boolean;
  striped?: boolean;
  headerRow?: boolean;
  onConfirm?: (data: { tableWidth: string; bordered: boolean; striped: boolean; headerRow: boolean }) => void;
}

export function promptTablePropertiesDialog(editor: AuroraEditor, options: PromptTablePropertiesOptions = {}): void {
  const { tableEl, onConfirm: onConfirmCustom } = options;

  let currentWidth = options.tableWidth || tableEl?.getAttribute('data-table-width') || tableEl?.style.width || '100%';
  let isBordered = options.bordered !== undefined
    ? options.bordered
    : tableEl ? tableEl.getAttribute('data-bordered') !== 'false' : true;
  let isStriped = options.striped !== undefined
    ? options.striped
    : tableEl ? tableEl.getAttribute('data-striped') === 'true' : false;
  let isHeaderRow = options.headerRow !== undefined
    ? options.headerRow
    : tableEl ? tableEl.getAttribute('data-header-row') !== 'false' : true;

  const content = document.createElement('div');
  content.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';

  // Section 1: Dimensions & Layout
  const dimSection = document.createElement('div');
  dimSection.innerHTML = `
    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--aurora-primary, #b7ff3c); margin-bottom: 8px;">
      📐 Table Geometry &amp; Width
    </div>
  `;

  const widthPresetContainer = document.createElement('div');
  widthPresetContainer.style.cssText = 'display: flex; gap: 8px; margin-bottom: 8px;';
  const widthPresets = [
    { label: '100% Full Width', val: '100%' },
    { label: '75% Center', val: '75%' },
    { label: '50% Compact', val: '50%' },
    { label: 'Auto / Fit Content', val: 'auto' }
  ];

  const presetBtns: HTMLButtonElement[] = [];
  const customWidthInput = document.createElement('input');
  customWidthInput.type = 'text';
  customWidthInput.value = currentWidth;
  customWidthInput.placeholder = 'e.g. 100%, 650px, auto';
  customWidthInput.style.cssText = 'width: 100%; padding: 7px 10px; font-size: 13px; border-radius: 6px; border: 1px solid var(--aurora-border, #485054); background: var(--aurora-surface, #24292c); color: var(--aurora-fg, #f1f4ef); outline: none; box-sizing: border-box;';

  function updatePresetSelection(val: string) {
    currentWidth = val;
    customWidthInput.value = val;
    presetBtns.forEach((btn) => {
      const isSelected = btn.getAttribute('data-val') === val;
      btn.style.background = isSelected ? 'var(--aurora-primary, #b7ff3c)' : 'rgba(255,255,255,0.06)';
      btn.style.color = isSelected ? 'var(--aurora-primary-fg, #172000)' : 'var(--aurora-fg, #f1f4ef)';
      btn.style.fontWeight = isSelected ? '700' : '500';
    });
  }

  widthPresets.forEach((p) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = p.label;
    btn.setAttribute('data-val', p.val);
    btn.style.cssText = 'flex: 1; padding: 6px 4px; font-size: 11px; border-radius: 5px; border: 1px solid var(--aurora-border, #485054); cursor: pointer; transition: all 0.15s;';
    btn.addEventListener('click', () => updatePresetSelection(p.val));
    presetBtns.push(btn);
    widthPresetContainer.appendChild(btn);
  });
  updatePresetSelection(currentWidth);

  customWidthInput.addEventListener('input', () => {
    currentWidth = customWidthInput.value.trim() || '100%';
  });

  dimSection.appendChild(widthPresetContainer);
  dimSection.appendChild(customWidthInput);
  content.appendChild(dimSection);

  // Section 2: Table Structure & Styling
  const styleSection = document.createElement('div');
  styleSection.innerHTML = `
    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--aurora-primary, #b7ff3c); margin-bottom: 8px;">
      🎨 Design &amp; Structure Presets
    </div>
  `;

  const togglesContainer = document.createElement('div');
  togglesContainer.style.cssText = 'display: flex; flex-direction: column; gap: 8px; background: var(--aurora-surface, #24292c); padding: 10px 12px; border-radius: 6px; border: 1px solid var(--aurora-border, #485054);';

  function createCheckbox(label: string, checked: boolean, desc: string, onChange: (val: boolean) => void) {
    const row = document.createElement('label');
    row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; cursor: pointer; font-size: 13px; color: var(--aurora-fg, #f1f4ef);';
    row.innerHTML = `
      <div>
        <div style="font-weight: 600;">${label}</div>
        <div style="font-size: 11px; color: var(--aurora-muted-fg, #aab2b0);">${desc}</div>
      </div>
    `;
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = checked;
    cb.style.cssText = 'width: 16px; height: 16px; cursor: pointer; accent-color: var(--aurora-primary, #b7ff3c);';
    cb.addEventListener('change', () => onChange(cb.checked));
    row.appendChild(cb);
    return row;
  }

  togglesContainer.appendChild(createCheckbox('Clean Borders', isBordered, 'Render crisp table and cell gridlines', (v) => { isBordered = v; }));
  togglesContainer.appendChild(createCheckbox('Zebra Striped Rows', isStriped, 'Alternating row background for enhanced readability', (v) => { isStriped = v; }));
  togglesContainer.appendChild(createCheckbox('Header Highlight Row', isHeaderRow, 'Differentiate top header row with prominent styling', (v) => { isHeaderRow = v; }));

  styleSection.appendChild(togglesContainer);
  content.appendChild(styleSection);

  // Section 3: Column Widths & Row Heights
  const sizingSection = document.createElement('div');
  sizingSection.innerHTML = `
    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--aurora-primary, #b7ff3c); margin-bottom: 8px;">
      📏 Column Width &amp; Row Height Sizing
    </div>
  `;

  const sizingGrid = document.createElement('div');
  sizingGrid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: var(--aurora-surface, #24292c); padding: 10px 12px; border-radius: 6px; border: 1px solid var(--aurora-border, #485054);';

  // Column width input
  const colBox = document.createElement('div');
  colBox.innerHTML = '<label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px; color:var(--aurora-fg, #f1f4ef);">Column Width</label>';
  const colInput = document.createElement('input');
  colInput.type = 'text';
  colInput.placeholder = 'e.g. 150px, auto';
  colInput.style.cssText = 'width: 100%; padding: 6px 8px; font-size: 12px; border-radius: 4px; border: 1px solid var(--aurora-border, #485054); background: rgba(255,255,255,0.04); color: var(--aurora-fg, #f1f4ef); outline: none; box-sizing: border-box;';
  
  const colPresets = document.createElement('div');
  colPresets.style.cssText = 'display: flex; gap: 4px; margin-top: 6px;';
  ['Auto', '120px', '180px', '240px'].forEach((w) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = w;
    btn.style.cssText = 'flex: 1; padding: 3px 2px; font-size: 10px; border-radius: 3px; border: 1px solid var(--aurora-border, #485054); background: transparent; color: var(--aurora-fg, #f1f4ef); cursor: pointer;';
    btn.addEventListener('click', () => { colInput.value = w === 'Auto' ? 'auto' : w; });
    colPresets.appendChild(btn);
  });
  colBox.appendChild(colInput);
  colBox.appendChild(colPresets);

  // Row height input
  const rowBox = document.createElement('div');
  rowBox.innerHTML = '<label style="display:block; font-size:12px; font-weight:600; margin-bottom:4px; color:var(--aurora-fg, #f1f4ef);">Row Height</label>';
  const rowInput = document.createElement('input');
  rowInput.type = 'text';
  rowInput.placeholder = 'e.g. 50px, auto';
  rowInput.style.cssText = 'width: 100%; padding: 6px 8px; font-size: 12px; border-radius: 4px; border: 1px solid var(--aurora-border, #485054); background: rgba(255,255,255,0.04); color: var(--aurora-fg, #f1f4ef); outline: none; box-sizing: border-box;';

  const rowPresets = document.createElement('div');
  rowPresets.style.cssText = 'display: flex; gap: 4px; margin-top: 6px;';
  ['Auto', '40px', '60px', '80px'].forEach((h) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = h;
    btn.style.cssText = 'flex: 1; padding: 3px 2px; font-size: 10px; border-radius: 3px; border: 1px solid var(--aurora-border, #485054); background: transparent; color: var(--aurora-fg, #f1f4ef); cursor: pointer;';
    btn.addEventListener('click', () => { rowInput.value = h === 'Auto' ? 'auto' : h; });
    rowPresets.appendChild(btn);
  });
  rowBox.appendChild(rowInput);
  rowBox.appendChild(rowPresets);

  sizingGrid.appendChild(colBox);
  sizingGrid.appendChild(rowBox);
  sizingSection.appendChild(sizingGrid);

  // Distribute Evenly quick button
  const distributeBtn = document.createElement('button');
  distributeBtn.type = 'button';
  distributeBtn.textContent = '↔ Distribute Columns Evenly (Equal Widths)';
  distributeBtn.style.cssText = 'margin-top: 8px; width: 100%; padding: 6px 10px; font-size: 12px; font-weight: 500; border-radius: 5px; border: 1px solid var(--aurora-border, #485054); background: var(--aurora-primary-muted, rgba(183, 255, 60, 0.1)); color: var(--aurora-primary, #b7ff3c); cursor: pointer; transition: all 0.15s;';
  distributeBtn.addEventListener('click', () => {
    editor.execute('distributeTableCols');
    colInput.value = 'distributed';
  });
  sizingSection.appendChild(distributeBtn);

  content.appendChild(sizingSection);

  const submit = () => {
    const data = {
      tableWidth: currentWidth || '100%',
      bordered: isBordered,
      striped: isStriped,
      headerRow: isHeaderRow
    };
    if (onConfirmCustom) {
      onConfirmCustom(data);
    } else {
      editor.execute('updateTable', data);
      if (tableEl) {
        tableEl.style.width = data.tableWidth;
        tableEl.style.tableLayout = data.tableWidth === 'auto' ? 'auto' : 'fixed';
        tableEl.setAttribute('data-table-width', data.tableWidth);
        tableEl.setAttribute('data-bordered', String(data.bordered));
        tableEl.setAttribute('data-striped', String(data.striped));
        tableEl.setAttribute('data-header-row', String(data.headerRow));
        tableEl.classList.toggle('aurora-table-bordered', data.bordered);
        tableEl.classList.toggle('aurora-table-striped', data.striped);
        tableEl.classList.toggle('aurora-table-header-row', data.headerRow);
      }
      const colVal = colInput.value.trim();
      if (colVal && colVal !== 'distributed') {
        editor.execute('setTableColWidth', { width: colVal === 'auto' ? null : colVal });
      }
      const rowVal = rowInput.value.trim();
      if (rowVal) {
        editor.execute('setTableRowHeight', { height: rowVal === 'auto' ? null : rowVal });
      }
    }
    editor.focus();
  };

  openDialog({
    title: '⚙️ Table Properties & Formatting',
    content,
    confirmText: 'Apply Properties',
    onConfirm: submit
  });
}
