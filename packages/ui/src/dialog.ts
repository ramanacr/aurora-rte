import { t } from './i18n.js';

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
  overlay.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;';

  const dialog = document.createElement('div');
  dialog.className = 'aurora-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  const titleId = `dialog-title-${Date.now()}`;
  dialog.setAttribute('aria-labelledby', titleId);
  dialog.style.cssText = 'background: var(--aurora-bg, #fff); color: var(--aurora-fg, #000); padding: 20px; border-radius: var(--aurora-radius, 6px); max-width: 450px; width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.2);';

  const header = document.createElement('div');
  header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;';
  const titleEl = document.createElement('h3');
  titleEl.id = titleId;
  titleEl.textContent = options.title;
  titleEl.style.cssText = 'margin: 0; font-size: 1.2rem;';
  header.appendChild(titleEl);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', t('dialog.close', 'Close'));
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = 'background: transparent; border: none; font-size: 1.2rem; cursor: pointer; color: inherit;';
  closeBtn.addEventListener('click', close);
  header.appendChild(closeBtn);

  dialog.appendChild(header);

  const body = document.createElement('div');
  body.className = 'aurora-dialog-body';
  body.style.cssText = 'margin-bottom: 20px;';
  if (typeof options.content === 'string') {
    body.textContent = options.content;
  } else {
    body.appendChild(options.content);
  }
  dialog.appendChild(body);

  const footer = document.createElement('div');
  footer.style.cssText = 'display: flex; justify-content: flex-end; gap: 8px;';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.textContent = options.cancelText || t('dialog.cancel', 'Cancel');
  cancelBtn.style.cssText = 'padding: 6px 14px; border-radius: 4px; border: 1px solid var(--aurora-border, #ccc); background: transparent; cursor: pointer; color: inherit;';
  cancelBtn.addEventListener('click', () => {
    options.onCancel?.();
    close();
  });
  footer.appendChild(cancelBtn);

  if (options.onConfirm) {
    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.textContent = options.confirmText || t('dialog.confirm', 'Confirm');
    confirmBtn.style.cssText = 'padding: 6px 14px; border-radius: 4px; border: none; background: var(--aurora-primary, #0284c7); color: #fff; cursor: pointer; font-weight: 500;';
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
