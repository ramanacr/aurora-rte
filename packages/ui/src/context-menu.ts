import type { AuroraEditor, SelectionState } from '@aurora/editor';
import { promptLinkDialog, promptImageDialog, promptTablePropertiesDialog } from './dialog.js';

export interface InplaceContextMenuOptions {
  editor: AuroraEditor;
  container?: HTMLElement;
}

export interface InplaceContextMenuInstance {
  element: HTMLElement;
  destroy(): void;
}

export function createInplaceContextMenu(options: InplaceContextMenuOptions): InplaceContextMenuInstance {
  const { editor } = options;
  const parent = options.container || document.body;
  const editorEl = editor.getElement() || (parent.querySelector('.ProseMirror') as HTMLElement) || parent;

  // Root wrapper for inplace menus
  const wrapper = document.createElement('div');
  wrapper.className = 'aurora-inplace-context-wrapper';

  // 1. Floating In-place Action Pill / Bar
  const floatingBar = document.createElement('div');
  floatingBar.className = 'aurora-floating-inplace-menu';
  floatingBar.setAttribute('role', 'toolbar');
  floatingBar.setAttribute('aria-label', 'In-place element actions');
  floatingBar.style.cssText = `
    position: fixed;
    display: none;
    z-index: 9998;
    background: var(--aurora-muted-bg, #24292c);
    color: var(--aurora-fg, #f1f4ef);
    border: 1px solid var(--aurora-border, #485054);
    border-radius: 8px;
    padding: 5px 8px;
    box-shadow: 0 12px 32px -4px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06);
    font-family: var(--aurora-font-family, Inter, system-ui, sans-serif);
    font-size: 13px;
    align-items: center;
    gap: 4px;
    max-width: min(640px, calc(100vw - 32px));
    flex-wrap: wrap;
    transition: opacity 0.15s ease;
    user-select: none;
    backdrop-filter: blur(10px);
  `;
  wrapper.appendChild(floatingBar);

  // 2. Right-Click Context Menu
  const rightClickMenu = document.createElement('div');
  rightClickMenu.className = 'aurora-right-click-menu';
  rightClickMenu.setAttribute('role', 'menu');
  rightClickMenu.style.cssText = `
    position: fixed;
    display: none;
    z-index: 9999;
    background: var(--aurora-muted-bg, #24292c);
    color: var(--aurora-fg, #f1f4ef);
    border: 1px solid var(--aurora-border, #485054);
    border-radius: 8px;
    padding: 6px;
    min-width: 210px;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    box-shadow: 0 16px 40px -4px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.07);
    font-family: var(--aurora-font-family, Inter, system-ui, sans-serif);
    font-size: 13px;
    user-select: none;
    backdrop-filter: blur(10px);
  `;
  wrapper.appendChild(rightClickMenu);

  // 3. Interactive Drag Resize Handle for Images (Edit Mode)
  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'aurora-image-resize-handle';
  resizeHandle.title = 'Drag to freely resize image';
  resizeHandle.style.cssText = `
    position: fixed;
    display: none;
    z-index: 9997;
    width: 14px;
    height: 14px;
    background: var(--aurora-primary, #b7ff3c);
    border: 2px solid #171a1c;
    border-radius: 50%;
    cursor: nwse-resize;
    box-shadow: 0 0 10px rgba(183, 255, 60, 0.75);
    user-select: none;
    touch-action: none;
  `;
  wrapper.appendChild(resizeHandle);

  // 3b. Interactive Drag Resize Handles for Table Columns & Rows (Edit Mode)
  const tableColResizer = document.createElement('div');
  tableColResizer.className = 'aurora-table-col-resizer';
  tableColResizer.title = 'Drag to resize column width';
  tableColResizer.style.cssText = `
    position: fixed;
    display: none;
    z-index: 9997;
    width: 6px;
    background: var(--aurora-primary, #b7ff3c);
    border-radius: 3px;
    cursor: col-resize;
    user-select: none;
    touch-action: none;
    box-shadow: 0 0 8px rgba(183, 255, 60, 0.7);
    opacity: 0.85;
    transition: opacity 0.15s ease;
  `;
  tableColResizer.addEventListener('mouseenter', () => { tableColResizer.style.opacity = '1'; });
  wrapper.appendChild(tableColResizer);

  const tableRowResizer = document.createElement('div');
  tableRowResizer.className = 'aurora-table-row-resizer';
  tableRowResizer.title = 'Drag to resize row height';
  tableRowResizer.style.cssText = `
    position: fixed;
    display: none;
    z-index: 9997;
    height: 6px;
    background: var(--aurora-secondary, #68e875);
    border-radius: 3px;
    cursor: row-resize;
    user-select: none;
    touch-action: none;
    box-shadow: 0 0 8px rgba(104, 232, 117, 0.7);
    opacity: 0.85;
    transition: opacity 0.15s ease;
  `;
  tableRowResizer.addEventListener('mouseenter', () => { tableRowResizer.style.opacity = '1'; });
  wrapper.appendChild(tableRowResizer);

  // 4. Viewer Mode Floating Action Icons (View Mode only - visible on top right corner hover)
  const viewerFloatingBar = document.createElement('div');
  viewerFloatingBar.className = 'aurora-viewer-floating-bar';
  viewerFloatingBar.setAttribute('role', 'toolbar');
  viewerFloatingBar.setAttribute('aria-label', 'Viewer controls');
  viewerFloatingBar.style.cssText = `
    position: fixed;
    display: none;
    z-index: 9996;
    background: var(--aurora-muted-bg, #24292c);
    color: var(--aurora-fg, #f1f4ef);
    border: 1px solid var(--aurora-border, #485054);
    border-radius: 20px;
    padding: 4px 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    font-family: var(--aurora-font-family, Inter, system-ui, sans-serif);
    font-size: 12px;
    align-items: center;
    gap: 6px;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-6px);
    transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    user-select: none;
  `;

  const viewerExpandBtn = document.createElement('button');
  viewerExpandBtn.type = 'button';
  viewerExpandBtn.className = 'aurora-viewer-icon-btn';
  viewerExpandBtn.title = 'Expand to lightbox view';
  viewerExpandBtn.setAttribute('aria-label', 'Expand to lightbox view');
  viewerExpandBtn.innerHTML = '🔍';
  viewerExpandBtn.style.cssText = `
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    padding: 4px 6px;
    font-size: 14px;
    cursor: pointer;
    color: var(--aurora-primary, #b7ff3c);
    transition: all 0.15s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  `;
  viewerExpandBtn.addEventListener('mouseenter', () => {
    viewerExpandBtn.style.background = 'rgba(0, 229, 255, 0.15)';
    viewerExpandBtn.style.borderColor = 'rgba(0, 229, 255, 0.35)';
  });
  viewerExpandBtn.addEventListener('mouseleave', () => {
    viewerExpandBtn.style.background = 'transparent';
    viewerExpandBtn.style.borderColor = 'transparent';
  });
  viewerExpandBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    openViewerLightbox();
  });
  viewerFloatingBar.appendChild(viewerExpandBtn);

  const viewerDivider = document.createElement('div');
  viewerDivider.style.cssText = 'width: 1px; height: 16px; background: var(--aurora-border, #1e293b);';
  viewerFloatingBar.appendChild(viewerDivider);

  const viewerFullViewBtn = document.createElement('button');
  viewerFullViewBtn.type = 'button';
  viewerFullViewBtn.className = 'aurora-viewer-icon-btn';
  viewerFullViewBtn.title = 'Enter full-view / fullscreen presentation';
  viewerFullViewBtn.setAttribute('aria-label', 'Enter full-view / fullscreen presentation');
  viewerFullViewBtn.innerHTML = '⛶';
  viewerFullViewBtn.style.cssText = `
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    padding: 4px 6px;
    font-size: 14px;
    cursor: pointer;
    color: var(--aurora-secondary, #10B981);
    transition: all 0.15s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  `;
  viewerFullViewBtn.addEventListener('mouseenter', () => {
    viewerFullViewBtn.style.background = 'rgba(16, 185, 129, 0.15)';
    viewerFullViewBtn.style.borderColor = 'rgba(16, 185, 129, 0.35)';
  });
  viewerFullViewBtn.addEventListener('mouseleave', () => {
    viewerFullViewBtn.style.background = 'transparent';
    viewerFullViewBtn.style.borderColor = 'transparent';
  });
  viewerFullViewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    toggleViewerFullView();
  });
  viewerFloatingBar.appendChild(viewerFullViewBtn);

  wrapper.appendChild(viewerFloatingBar);
  parent.appendChild(wrapper);

  // State
  let activeTargetNode: HTMLElement | null = null;
  let activeTargetType: 'table' | 'image' | 'link' | null = null;
  let isFullViewActive = false;

  function createBtn(label: string, icon: string, title: string, onClick: () => void, isDanger = false) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = title;
    btn.setAttribute('aria-label', title);
    btn.innerHTML = `<span style="font-size: 14px;">${icon}</span><span style="margin-left: 4px; font-weight: 500;">${label}</span>`;
    btn.style.cssText = `
      display: inline-flex;
      align-items: center;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      color: ${isDanger ? '#f87171' : 'var(--aurora-fg, #f8fafc)'};
      white-space: nowrap;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = isDanger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.08)';
      btn.style.borderColor = isDanger ? 'rgba(239, 68, 68, 0.35)' : 'var(--aurora-border, #1e293b)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'transparent';
      btn.style.borderColor = 'transparent';
    });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      onClick();
      editor.focus();
    });
    return btn;
  }

  function createDivider() {
    const d = document.createElement('div');
    d.style.cssText = 'width: 1px; height: 18px; background: var(--aurora-border, #1e293b); margin: 0 3px;';
    return d;
  }

  function positionFloatingBar(targetRect: DOMRect) {
    floatingBar.style.display = 'flex';
    const barRect = floatingBar.getBoundingClientRect();

    // Position above target, or below if not enough room above
    let top = targetRect.top - barRect.height - 8;
    if (top < 10) {
      top = targetRect.bottom + 8;
    }

    let left = targetRect.left;
    if (left + barRect.width > window.innerWidth - 10) {
      left = window.innerWidth - barRect.width - 10;
    }
    if (left < 10) left = 10;

    floatingBar.style.top = `${Math.round(top)}px`;
    floatingBar.style.left = `${Math.round(left)}px`;
  }

  let isColDragging = false;
  let isRowDragging = false;

  function hideFloatingBar() {
    floatingBar.style.display = 'none';
    floatingBar.innerHTML = '';
    resizeHandle.style.display = 'none';
    if (!isColDragging) tableColResizer.style.display = 'none';
    if (!isRowDragging) tableRowResizer.style.display = 'none';
    activeTargetType = null;
    activeTargetNode = null;
  }

  function hideRightClickMenu() {
    rightClickMenu.style.display = 'none';
    rightClickMenu.innerHTML = '';
  }

  // --- Renderers for Floating Toolbar ---

  function renderTableToolbar(tableOrCell: HTMLElement) {
    if (!editor.isEditable()) return;
    floatingBar.innerHTML = '';

    const tableEl = (tableOrCell.closest('table') || tableOrCell) as HTMLTableElement;
    const currentCell = tableOrCell.closest('td, th') as HTMLTableCellElement | null;

    const currentWidth = tableEl.getAttribute('data-table-width') || tableEl.style.width || '100%';
    const isBordered = tableEl.getAttribute('data-bordered') !== 'false';
    const isStriped = tableEl.getAttribute('data-striped') === 'true';

    const badge = document.createElement('span');
    badge.style.cssText = 'font-size: 11px; font-weight: 700; color: var(--aurora-primary, #00E5FF); padding: 0 4px; text-transform: uppercase; letter-spacing: 0.5px;';
    badge.textContent = 'Table';
    floatingBar.appendChild(badge);
    floatingBar.appendChild(createDivider());

    // 1. Structure Controls
    floatingBar.appendChild(createBtn('Row Above', '⬆️', 'Insert row above', () => editor.execute('addTableRowAbove')));
    floatingBar.appendChild(createBtn('Row Below', '⬇️', 'Insert row below', () => editor.execute('addTableRowBelow')));
    floatingBar.appendChild(createBtn('Del Row', '✕', 'Delete current row', () => editor.execute('deleteTableRow'), true));
    floatingBar.appendChild(createDivider());
    floatingBar.appendChild(createBtn('Col Before', '⬅️', 'Insert column before', () => editor.execute('addTableColBefore')));
    floatingBar.appendChild(createBtn('Col After', '➡️', 'Insert column after', () => editor.execute('addTableColAfter')));
    floatingBar.appendChild(createBtn('Del Col', '✕', 'Delete current column', () => editor.execute('deleteTableCol'), true));
    floatingBar.appendChild(createDivider());

    // 2. Column & Row Sizing Controls
    const rowEl = currentCell?.closest('tr');
    const cellIdx = currentCell && rowEl ? Array.from(rowEl.children).indexOf(currentCell) : 0;
    const rowIdx = rowEl && tableEl ? Array.from(tableEl.rows).indexOf(rowEl) : 0;

    const colWidthBtn = createBtn(
      'Col Width',
      '📏',
      'Set column width (Auto, 120px, 160px, 200px, custom)',
      () => {
        const cur = currentCell?.getAttribute('data-colwidth') || currentCell?.style.width || 'auto';
        const w = window.prompt('Set column width (e.g. 150px, 200px, auto):', cur);
        if (w !== null) {
          const val = w.trim() === 'auto' ? null : w.trim();
          editor.execute('setTableColWidth', { colIndex: cellIdx, width: val });
        }
      }
    );
    floatingBar.appendChild(colWidthBtn);

    const rowHeightBtn = createBtn(
      'Row Height',
      '📐',
      'Set row height (Auto, 40px, 55px, 70px, custom)',
      () => {
        const cur = rowEl?.getAttribute('data-height') || rowEl?.style.height || 'auto';
        const h = window.prompt('Set row height (e.g. 45px, 60px, auto):', cur);
        if (h !== null) {
          const val = h.trim() === 'auto' ? null : h.trim();
          editor.execute('setTableRowHeight', { rowIndex: rowIdx, height: val });
        }
      }
    );
    floatingBar.appendChild(rowHeightBtn);

    const distributeBtn = createBtn(
      'Distribute',
      '↔️',
      'Distribute columns evenly across table width',
      () => editor.execute('distributeTableCols')
    );
    floatingBar.appendChild(distributeBtn);

    floatingBar.appendChild(createDivider());

    // 3. Table Design Presets
    const fullWidthBtn = createBtn(
      currentWidth === '100%' ? '100% Width' : 'Fit Content',
      '↔️',
      `Toggle table width (currently ${currentWidth})`,
      () => {
        const nextWidth = currentWidth === '100%' ? 'auto' : '100%';
        editor.execute('updateTable', { tableWidth: nextWidth });
        tableEl.style.width = nextWidth;
        tableEl.style.tableLayout = nextWidth === 'auto' ? 'auto' : 'fixed';
        tableEl.setAttribute('data-table-width', nextWidth);
        renderTableToolbar(tableOrCell);
      }
    );
    floatingBar.appendChild(fullWidthBtn);

    const stripedBtn = createBtn(
      'Striped',
      '🦓',
      'Toggle zebra striped rows',
      () => {
        const next = !isStriped;
        editor.execute('updateTable', { striped: next });
        tableEl.setAttribute('data-striped', String(next));
        tableEl.classList.toggle('aurora-table-striped', next);
        renderTableToolbar(tableOrCell);
      }
    );
    if (isStriped) {
      stripedBtn.style.background = 'rgba(0, 229, 255, 0.2)';
      stripedBtn.style.borderColor = 'rgba(0, 229, 255, 0.4)';
    }
    floatingBar.appendChild(stripedBtn);

    const borderedBtn = createBtn(
      'Bordered',
      '▦',
      'Toggle table border gridlines',
      () => {
        const next = !isBordered;
        editor.execute('updateTable', { bordered: next });
        tableEl.setAttribute('data-bordered', String(next));
        tableEl.classList.toggle('aurora-table-bordered', next);
        renderTableToolbar(tableOrCell);
      }
    );
    if (isBordered) {
      borderedBtn.style.background = 'rgba(0, 229, 255, 0.2)';
      borderedBtn.style.borderColor = 'rgba(0, 229, 255, 0.4)';
    }
    floatingBar.appendChild(borderedBtn);

    floatingBar.appendChild(createDivider());

    // 4. Cell Shading Quick Swatches
    const cellShadeBtn = createBtn(
      'Shade',
      '🎨',
      'Quick cell background shading',
      () => {
        const nextColor = currentCell?.style.backgroundColor ? null : 'rgba(0, 229, 255, 0.15)';
        editor.execute('updateTableCell', { background: nextColor });
        if (currentCell) {
          currentCell.style.backgroundColor = nextColor || '';
          if (nextColor) currentCell.setAttribute('data-background', nextColor);
          else currentCell.removeAttribute('data-background');
        }
        renderTableToolbar(tableOrCell);
      }
    );
    floatingBar.appendChild(cellShadeBtn);

    // 5. Properties Dialog & Delete Table
    const settingsBtn = createBtn(
      'Properties',
      '⚙️',
      'Edit full table properties & layout',
      () => {
        promptTablePropertiesDialog(editor, { tableEl });
      }
    );
    floatingBar.appendChild(settingsBtn);

    floatingBar.appendChild(createDivider());
    floatingBar.appendChild(createBtn('Del Table', '🗑️', 'Delete entire table', () => {
      editor.execute('deleteTable');
      hideFloatingBar();
    }, true));

    activeTargetType = 'table';
    activeTargetNode = tableOrCell;
    resizeHandle.style.display = 'none';
    positionFloatingBar(tableOrCell.getBoundingClientRect());
  }

  function setupInteractiveColResize(cell: HTMLTableCellElement, table: HTMLTableElement) {
    if (!editor.isEditable()) {
      tableColResizer.style.display = 'none';
      return;
    }

    tableColResizer.onmousedown = (downEvent: MouseEvent) => {
      downEvent.preventDefault();
      downEvent.stopPropagation();
      isColDragging = true;

      const startX = downEvent.clientX;
      const startCellW = cell.offsetWidth;
      const rowEl = cell.closest('tr');
      const cellIdx = Array.from(rowEl?.children || []).indexOf(cell);

      table.style.tableLayout = 'fixed';

      const onMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;
        const newW = Math.max(35, startCellW + dx);

        const rows = table.rows;
        for (let i = 0; i < rows.length; i++) {
          const c = rows[i].cells[cellIdx];
          if (c) {
            c.style.width = `${newW}px`;
            c.setAttribute('data-colwidth', `${newW}px`);
          }
        }

        const updatedRect = cell.getBoundingClientRect();
        tableColResizer.style.left = `${Math.round(updatedRect.right - 3)}px`;
        if (activeTargetNode && activeTargetType === 'table') {
          positionFloatingBar(activeTargetNode.getBoundingClientRect());
        }
      };

      const onMouseUp = (upEvent: MouseEvent) => {
        isColDragging = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        const finalDx = upEvent.clientX - startX;
        const finalW = `${Math.max(35, startCellW + finalDx)}px`;
        editor.execute('setTableColWidth', { colIndex: cellIdx, width: finalW });
        tableColResizer.style.display = 'none';
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };
  }

  function setupInteractiveRowResize(row: HTMLTableRowElement, table: HTMLTableElement) {
    if (!editor.isEditable()) {
      tableRowResizer.style.display = 'none';
      return;
    }

    tableRowResizer.onmousedown = (downEvent: MouseEvent) => {
      downEvent.preventDefault();
      downEvent.stopPropagation();
      isRowDragging = true;

      const startY = downEvent.clientY;
      const startRowH = row.offsetHeight;
      const rowIdx = Array.from(table.rows).indexOf(row);

      const onMouseMove = (moveEvent: MouseEvent) => {
        const dy = moveEvent.clientY - startY;
        const newH = Math.max(26, startRowH + dy);

        row.style.height = `${newH}px`;
        row.setAttribute('data-height', `${newH}px`);

        const updatedRect = row.getBoundingClientRect();
        tableRowResizer.style.top = `${Math.round(updatedRect.bottom - 3)}px`;
        if (activeTargetNode && activeTargetType === 'table') {
          positionFloatingBar(activeTargetNode.getBoundingClientRect());
        }
      };

      const onMouseUp = (upEvent: MouseEvent) => {
        isRowDragging = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        const finalDy = upEvent.clientY - startY;
        const finalH = `${Math.max(26, startRowH + finalDy)}px`;
        editor.execute('setTableRowHeight', { rowIndex: rowIdx, height: finalH });
        tableRowResizer.style.display = 'none';
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };
  }

  function setupInteractiveResize(img: HTMLImageElement) {
    if (!editor.isEditable()) {
      resizeHandle.style.display = 'none';
      return;
    }

    const rect = img.getBoundingClientRect();
    resizeHandle.style.display = 'block';
    resizeHandle.style.top = `${Math.round(rect.bottom - 7)}px`;
    resizeHandle.style.left = `${Math.round(rect.right - 7)}px`;

    resizeHandle.onmousedown = (downEvent: MouseEvent) => {
      downEvent.preventDefault();
      downEvent.stopPropagation();

      const startX = downEvent.clientX;
      const startY = downEvent.clientY;
      const startW = img.offsetWidth;
      const startH = img.offsetHeight;
      const ratio = startW / (startH || 1);
      const isLocked = img.getAttribute('data-lock-ratio') !== 'false';
      const src = img.getAttribute('src') || '';

      const onMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        let newW = Math.max(80, startW + dx);
        let newH = startH;

        if (isLocked && !moveEvent.shiftKey) {
          newH = Math.round(newW / ratio);
        } else {
          newH = Math.max(50, startH + dy);
        }

        img.style.width = `${newW}px`;
        img.style.height = `${newH}px`;
        img.setAttribute('data-width', `${newW}px`);
        img.setAttribute('data-height', `${newH}px`);
        img.setAttribute('data-sizing-mode', 'fixed');

        const liveRect = img.getBoundingClientRect();
        resizeHandle.style.top = `${Math.round(liveRect.bottom - 7)}px`;
        resizeHandle.style.left = `${Math.round(liveRect.right - 7)}px`;
        positionFloatingBar(liveRect);
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        editor.execute('updateImage', {
          src,
          width: `${img.offsetWidth}px`,
          height: `${img.offsetHeight}px`,
          sizingMode: 'fixed'
        });
        renderImageToolbar(img);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };
  }

  function renderImageToolbar(img: HTMLImageElement) {
    if (!editor.isEditable()) return;
    floatingBar.innerHTML = '';

    const badge = document.createElement('span');
    badge.style.cssText = 'font-size: 11px; font-weight: 700; color: var(--aurora-secondary, #10B981); padding: 0 4px; text-transform: uppercase; letter-spacing: 0.5px;';
    badge.textContent = 'Image';
    floatingBar.appendChild(badge);
    floatingBar.appendChild(createDivider());

    const src = img.getAttribute('src') || '';
    const alt = img.getAttribute('alt') || '';
    const title = img.getAttribute('title') || '';
    const currentWidth = img.getAttribute('data-width') || img.style.width || '';
    const currentHeight = img.getAttribute('data-height') || img.style.height || '';
    const currentAlign = img.getAttribute('data-align') || 'center';
    const currentRatio = img.getAttribute('data-aspect-ratio') || img.style.aspectRatio || 'auto';
    const currentMode = img.getAttribute('data-sizing-mode') || (currentWidth && currentWidth.endsWith('px') ? 'fixed' : 'responsive');
    const isLockedRatio = img.getAttribute('data-lock-ratio') !== 'false';
    const currentObjectFit = img.getAttribute('data-object-fit') || img.style.objectFit || 'cover';
    const isRounded = img.getAttribute('data-rounded') === 'true' || Boolean(img.style.borderRadius);
    const isShadow = img.getAttribute('data-shadow') === 'true' || Boolean(img.style.boxShadow);
    const isBorder = img.getAttribute('data-border') === 'true' || Boolean(img.style.border);
    const linkUrl = img.getAttribute('data-link-url') || '';

    // 1. Sizing Mode Pill (Fluid % vs Fixed px)
    const modeBtn = createBtn(
      currentMode === 'fixed' ? 'Fixed (px)' : 'Fluid (%)',
      currentMode === 'fixed' ? '📏' : '〰️',
      `Toggle mode (currently ${currentMode}). Click to switch.`,
      () => {
        const nextMode = currentMode === 'fixed' ? 'responsive' : 'fixed';
        if (nextMode === 'fixed') {
          const w = `${img.offsetWidth}px`;
          const h = `${img.offsetHeight}px`;
          editor.execute('updateImage', { src, width: w, height: h, sizingMode: 'fixed' });
          img.style.width = w;
          img.style.height = h;
          img.setAttribute('data-width', w);
          img.setAttribute('data-height', h);
          img.setAttribute('data-sizing-mode', 'fixed');
        } else {
          editor.execute('updateImage', { src, width: '100%', height: 'auto', sizingMode: 'responsive' });
          img.style.width = '100%';
          img.style.height = 'auto';
          img.setAttribute('data-width', '100%');
          img.setAttribute('data-height', 'auto');
          img.setAttribute('data-sizing-mode', 'responsive');
        }
        renderImageToolbar(img);
      }
    );
    modeBtn.style.background = 'rgba(255,255,255,0.06)';
    modeBtn.style.borderColor = 'var(--aurora-border, #1e293b)';
    floatingBar.appendChild(modeBtn);

    floatingBar.appendChild(createDivider());

    // 2. Quick Size Presets: 25%, 50%, 75%, 100%
    const sizePills = ['25%', '50%', '75%', '100%'];
    sizePills.forEach((pct) => {
      const isCurrent = currentWidth === pct;
      const sizeBtn = createBtn(pct, '', `Resize to ${pct}`, () => {
        editor.execute('updateImage', { src, width: pct, sizingMode: 'responsive' });
        img.style.width = pct;
        img.setAttribute('data-width', pct);
        img.setAttribute('data-sizing-mode', 'responsive');
        renderImageToolbar(img);
      });
      if (isCurrent) {
        sizeBtn.style.background = 'var(--aurora-primary, #00E5FF)';
        sizeBtn.style.color = '#0a0f1d';
        sizeBtn.style.fontWeight = '700';
      }
      floatingBar.appendChild(sizeBtn);
    });

    floatingBar.appendChild(createDivider());

    // 3. Aspect Ratio Quick Selector
    const ratioBtn = createBtn(
      currentRatio === 'auto' || !currentRatio ? 'Ratio' : currentRatio,
      '📐',
      `Aspect ratio: ${currentRatio}. Click to cycle.`,
      () => {
        const cycle = ['auto', '16/9', '4/3', '1/1', 'none'];
        const curIdx = cycle.indexOf(currentRatio);
        const nextRatio = cycle[(curIdx + 1) % cycle.length];
        editor.execute('updateImage', { src, aspectRatio: nextRatio === 'none' ? null : nextRatio });
        img.setAttribute('data-aspect-ratio', nextRatio);
        img.style.aspectRatio = nextRatio === 'auto' || nextRatio === 'none' ? '' : nextRatio;
        renderImageToolbar(img);
      }
    );
    if (currentRatio && currentRatio !== 'auto' && currentRatio !== 'none') {
      ratioBtn.style.background = 'rgba(0, 229, 255, 0.2)';
      ratioBtn.style.borderColor = 'var(--aurora-primary, #00E5FF)';
    }
    floatingBar.appendChild(ratioBtn);

    floatingBar.appendChild(createDivider());

    // 4. Quick Alignment Buttons
    const alignBtns = [
      { id: 'left', icon: '⫷', title: 'Align Left' },
      { id: 'center', icon: '☰', title: 'Align Center' },
      { id: 'right', icon: '⫸', title: 'Align Right' }
    ];
    alignBtns.forEach((al) => {
      const isCurrent = currentAlign === al.id;
      const alBtn = createBtn('', al.icon, al.title, () => {
        editor.execute('updateImage', { src, align: al.id });
        img.setAttribute('data-align', al.id);
        if (al.id === 'center') {
          img.style.display = 'block';
          img.style.marginLeft = 'auto';
          img.style.marginRight = 'auto';
        } else if (al.id === 'right') {
          img.style.display = 'block';
          img.style.marginLeft = 'auto';
          img.style.marginRight = '0';
        } else {
          img.style.display = 'block';
          img.style.marginLeft = '0';
          img.style.marginRight = 'auto';
        }
        renderImageToolbar(img);
      });
      if (isCurrent) {
        alBtn.style.background = 'var(--aurora-secondary, #10B981)';
        alBtn.style.color = '#0a0f1d';
      }
      floatingBar.appendChild(alBtn);
    });

    floatingBar.appendChild(createDivider());

    // 5. Quick Style Toggles (Rounded, Shadow)
    const roundBtn = createBtn('Round', '▢', isRounded ? 'Remove rounded corners' : 'Add rounded corners', () => {
      const nextVal = !isRounded;
      editor.execute('updateImage', { src, rounded: nextVal });
      img.style.borderRadius = nextVal ? '12px' : '0px';
      img.setAttribute('data-rounded', nextVal ? 'true' : 'false');
      renderImageToolbar(img);
    });
    if (isRounded) {
      roundBtn.style.background = 'rgba(0, 229, 255, 0.2)';
      roundBtn.style.borderColor = 'var(--aurora-primary, #00E5FF)';
    }
    floatingBar.appendChild(roundBtn);

    const shadowBtn = createBtn('Shadow', '◰', isShadow ? 'Remove drop shadow' : 'Add drop shadow', () => {
      const nextVal = !isShadow;
      editor.execute('updateImage', { src, shadow: nextVal });
      img.style.boxShadow = nextVal ? '0 10px 25px rgba(0,0,0,0.25)' : 'none';
      img.setAttribute('data-shadow', nextVal ? 'true' : 'false');
      renderImageToolbar(img);
    });
    if (isShadow) {
      shadowBtn.style.background = 'rgba(0, 229, 255, 0.2)';
      shadowBtn.style.borderColor = 'var(--aurora-primary, #00E5FF)';
    }
    floatingBar.appendChild(shadowBtn);

    floatingBar.appendChild(createDivider());

    // 6. Edit Full Dialog Button
    floatingBar.appendChild(createBtn('Settings', '⚙️', 'Edit all image properties, custom sizing, caption & link', () => {
      promptImageDialog(editor, {
        src,
        alt,
        title,
        width: currentWidth,
        height: currentHeight,
        aspectRatio: currentRatio,
        sizingMode: currentMode as any,
        lockAspectRatio: isLockedRatio,
        objectFit: currentObjectFit,
        align: currentAlign,
        rounded: isRounded,
        shadow: isShadow,
        border: isBorder,
        linkUrl
      });
    }));

    floatingBar.appendChild(createDivider());

    // 7. Utility actions
    floatingBar.appendChild(createBtn('Open', '↗️', 'Open image in new tab', () => {
      if (src) window.open(src, '_blank');
    }));

    floatingBar.appendChild(createBtn('Copy URL', '📋', 'Copy image source address', () => {
      if (navigator.clipboard && src) {
        navigator.clipboard.writeText(src);
      }
    }));

    floatingBar.appendChild(createBtn('Delete', '🗑️', 'Remove image', () => {
      editor.execute('deleteImage');
      hideFloatingBar();
    }, true));

    activeTargetType = 'image';
    activeTargetNode = img;
    positionFloatingBar(img.getBoundingClientRect());
    setupInteractiveResize(img);
  }

  function renderLinkToolbar(linkEl: HTMLAnchorElement) {
    floatingBar.innerHTML = '';

    const badge = document.createElement('span');
    badge.style.cssText = 'font-size: 11px; font-weight: 700; color: var(--aurora-primary, #b7ff3c); padding: 0 4px; text-transform: uppercase; letter-spacing: 0.5px;';
    badge.textContent = 'Link';
    floatingBar.appendChild(badge);

    const href = linkEl.getAttribute('href') || '';
    const target = linkEl.getAttribute('target') || '';
    const text = linkEl.textContent || '';

    // Display URL preview
    const linkDisplay = document.createElement('a');
    linkDisplay.href = href;
    linkDisplay.target = '_blank';
    linkDisplay.rel = 'noopener noreferrer';
    linkDisplay.textContent = href.length > 28 ? href.slice(0, 25) + '...' : href;
    linkDisplay.title = href;
    linkDisplay.style.cssText = 'color: var(--aurora-primary, #b7ff3c); text-decoration: underline; font-size: 12px; margin: 0 4px; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
    floatingBar.appendChild(linkDisplay);
    floatingBar.appendChild(createDivider());

    floatingBar.appendChild(createBtn('Open', '↗️', 'Open link in new tab', () => {
      window.open(href, '_blank', 'noopener,noreferrer');
    }));

    floatingBar.appendChild(createBtn('Copy', '📋', 'Copy link URL', () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(href);
      }
    }));

    floatingBar.appendChild(createBtn('Edit', '✏️', 'Edit link URL or text', () => {
      promptLinkDialog(editor, { href, text, target });
    }));

    floatingBar.appendChild(createDivider());
    floatingBar.appendChild(createBtn('Unlink', '✕', 'Remove link', () => {
      editor.execute('removeLink');
      hideFloatingBar();
    }, true));

    activeTargetType = 'link';
    activeTargetNode = linkEl;
    positionFloatingBar(linkEl.getBoundingClientRect());
  }

  // --- Right-Click Context Menu Builder ---

  function createMenuItem(label: string, icon: string, onClick: () => void, isDanger = false) {
    const item = document.createElement('div');
    item.setAttribute('role', 'menuitem');
    item.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 5px;
      cursor: pointer;
      color: ${isDanger ? '#ff6577' : 'var(--aurora-fg, #f1f4ef)'};
      font-size: 13px;
      transition: background 0.12s;
    `;
    item.innerHTML = `<span style="width: 16px; text-align: center;">${icon}</span><span>${label}</span>`;
    item.addEventListener('mouseenter', () => {
      item.style.background = isDanger ? 'rgba(255, 101, 119, 0.15)' : 'var(--aurora-muted-bg, rgba(255,255,255,0.08))';
    });
    item.addEventListener('mouseleave', () => {
      item.style.background = 'transparent';
    });
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      hideRightClickMenu();
      editor.focus();
      onClick();
    });
    return item;
  }

  function createMenuHeader(title: string) {
    const h = document.createElement('div');
    h.style.cssText = 'padding: 4px 10px 2px; font-size: 11px; font-weight: 700; color: var(--aurora-muted-fg, #aab2b0); text-transform: uppercase; letter-spacing: 0.5px;';
    h.textContent = title;
    return h;
  }

  function createMenuDivider() {
    const d = document.createElement('div');
    d.style.cssText = 'height: 1px; background: var(--aurora-border, #1e293b); margin: 4px 0;';
    return d;
  }

  function openRightClickMenu(e: MouseEvent, targetEl: HTMLElement) {
    e.preventDefault();
    hideFloatingBar();
    rightClickMenu.innerHTML = '';

    const tableCell = targetEl.closest('td, th, table') as HTMLElement | null;
    const img = targetEl.closest('img') as HTMLImageElement | null;
    const link = targetEl.closest('a') as HTMLAnchorElement | null;

    let hasCustomSection = false;

    // Table Section
    if (tableCell) {
      hasCustomSection = true;
      const tableEl = (tableCell.closest('table') || tableCell) as HTMLTableElement;
      const currentCell = tableCell.closest('td, th') as HTMLTableCellElement | null;
      const curRow = currentCell?.closest('tr') as HTMLTableRowElement | null;
      const isStriped = tableEl.getAttribute('data-striped') === 'true' || tableEl.classList.contains('aurora-table-striped');
      const isBordered = tableEl.getAttribute('data-bordered') !== 'false' && !tableEl.classList.contains('aurora-table-borderless');
      const currentWidth = tableEl.getAttribute('data-table-width') || tableEl.style.width || '100%';

      rightClickMenu.appendChild(createMenuHeader('Table Structure & Sizing'));
      rightClickMenu.appendChild(createMenuItem('Insert Row Above', '⬆️', () => editor.execute('addTableRowAbove')));
      rightClickMenu.appendChild(createMenuItem('Insert Row Below', '⬇️', () => editor.execute('addTableRowBelow')));
      rightClickMenu.appendChild(createMenuItem('Delete Row', '✕', () => editor.execute('deleteTableRow'), true));
      rightClickMenu.appendChild(createMenuItem('Set Row Height...', '📐', () => {
        const cur = curRow?.getAttribute('data-height') || curRow?.style.height || 'auto';
        const h = window.prompt('Enter row height (e.g. 45px, 60px, auto):', cur);
        if (h !== null) {
          const rowIdx = curRow ? Array.from(curRow.parentElement?.children || []).indexOf(curRow) : undefined;
          const parsedH = h.trim() === 'auto' ? null : h.trim();
          editor.execute('setTableRowHeight', { rowIndex: rowIdx !== undefined && rowIdx >= 0 ? rowIdx : undefined, height: parsedH });
          if (curRow) curRow.style.height = parsedH || '';
        }
      }));
      rightClickMenu.appendChild(createMenuDivider());
      rightClickMenu.appendChild(createMenuItem('Insert Column Before', '⬅️', () => editor.execute('addTableColBefore')));
      rightClickMenu.appendChild(createMenuItem('Insert Column After', '➡️', () => editor.execute('addTableColAfter')));
      rightClickMenu.appendChild(createMenuItem('Delete Column', '✕', () => editor.execute('deleteTableCol'), true));
      rightClickMenu.appendChild(createMenuItem('Set Column Width...', '📏', () => {
        const cur = currentCell?.getAttribute('data-colwidth') || currentCell?.style.width || 'auto';
        const w = window.prompt('Enter column width (e.g. 150px, 200px, auto):', cur);
        if (w !== null) {
          const colIdx = currentCell ? Array.from(currentCell.parentElement?.children || []).indexOf(currentCell) : undefined;
          const parsedW = w.trim() === 'auto' ? null : w.trim();
          editor.execute('setTableColWidth', { colIndex: colIdx !== undefined && colIdx >= 0 ? colIdx : undefined, width: parsedW });
          if (currentCell) currentCell.style.width = parsedW || '';
        }
      }));
      rightClickMenu.appendChild(createMenuItem('Distribute Columns Evenly', '↔️', () => editor.execute('distributeTableCols')));

      rightClickMenu.appendChild(createMenuDivider());
      rightClickMenu.appendChild(createMenuHeader('Table Design & Layout'));
      rightClickMenu.appendChild(createMenuItem(
        currentWidth === '100%' ? 'Fit Content Width' : '100% Full Width',
        '↔️',
        () => {
          const nw = currentWidth === '100%' ? 'auto' : '100%';
          editor.execute('updateTable', { tableWidth: nw });
          tableEl.style.width = nw;
          tableEl.style.tableLayout = nw === 'auto' ? 'auto' : 'fixed';
          tableEl.setAttribute('data-table-width', nw);
        }
      ));
      rightClickMenu.appendChild(createMenuItem(
        isStriped ? 'Disable Zebra Striping' : 'Enable Zebra Striping',
        '🦓',
        () => {
          const next = !isStriped;
          editor.execute('updateTable', { striped: next });
          tableEl.setAttribute('data-striped', String(next));
          tableEl.classList.toggle('aurora-table-striped', next);
        }
      ));
      rightClickMenu.appendChild(createMenuItem(
        isBordered ? 'Hide Table Borders' : 'Show Table Borders',
        '▦',
        () => {
          const next = !isBordered;
          editor.execute('updateTable', { bordered: next });
          tableEl.setAttribute('data-bordered', String(next));
          tableEl.classList.toggle('aurora-table-bordered', next);
        }
      ));

      rightClickMenu.appendChild(createMenuDivider());
      rightClickMenu.appendChild(createMenuHeader('Cell Shading'));
      const shades = [
        { label: 'Cyan Highlight', color: 'rgba(0, 229, 255, 0.15)' },
        { label: 'Emerald Highlight', color: 'rgba(16, 185, 129, 0.15)' },
        { label: 'Purple Highlight', color: 'rgba(117, 73, 255, 0.18)' },
        { label: 'Clear Shading', color: null }
      ];
      shades.forEach((s) => {
        rightClickMenu.appendChild(createMenuItem(s.label, '🎨', () => {
          editor.execute('updateTableCell', { background: s.color });
          if (currentCell) {
            currentCell.style.backgroundColor = s.color || '';
            if (s.color) currentCell.setAttribute('data-background', s.color);
            else currentCell.removeAttribute('data-background');
          }
        }));
      });

      rightClickMenu.appendChild(createMenuDivider());
      rightClickMenu.appendChild(createMenuItem('Clear Table & Cell Formatting', '🧹', () => {
        editor.execute('clearFormatting');
        if (currentCell) {
          currentCell.style.backgroundColor = '';
          currentCell.removeAttribute('data-background');
          currentCell.removeAttribute('data-shading');
        }
      }));
      rightClickMenu.appendChild(createMenuItem('Table Properties...', '⚙️', () => {
        promptTablePropertiesDialog(editor, { tableEl });
      }));
      rightClickMenu.appendChild(createMenuDivider());
      rightClickMenu.appendChild(createMenuItem('Delete Entire Table', '🗑️', () => editor.execute('deleteTable'), true));
    }

    // Image Section
    if (img) {
      if (hasCustomSection) rightClickMenu.appendChild(createMenuDivider());
      hasCustomSection = true;

      const src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || '';
      const title = img.getAttribute('title') || '';
      const currentWidth = img.getAttribute('data-width') || img.style.width || '';
      const currentHeight = img.getAttribute('data-height') || img.style.height || '';
      const currentAlign = img.getAttribute('data-align') || 'center';
      const currentRatio = img.getAttribute('data-aspect-ratio') || img.style.aspectRatio || 'auto';
      const currentMode = img.getAttribute('data-sizing-mode') || (currentWidth.endsWith('px') ? 'fixed' : 'responsive');
      const isLockedRatio = img.getAttribute('data-lock-ratio') !== 'false';
      const currentFit = img.getAttribute('data-object-fit') || img.style.objectFit || 'cover';
      const isRounded = img.getAttribute('data-rounded') === 'true' || Boolean(img.style.borderRadius);
      const isShadow = img.getAttribute('data-shadow') === 'true' || Boolean(img.style.boxShadow);
      const isBorder = img.getAttribute('data-border') === 'true' || Boolean(img.style.border);
      const linkUrl = img.getAttribute('data-link-url') || '';

      rightClickMenu.appendChild(createMenuHeader('Image Sizing & Mode'));
      ['25%', '50%', '75%', '100%'].forEach((pct) => {
        rightClickMenu.appendChild(createMenuItem(`Resize to ${pct}`, '📐', () => {
          editor.execute('updateImage', { src, width: pct, sizingMode: 'responsive' });
          img.style.width = pct;
          img.setAttribute('data-width', pct);
          img.setAttribute('data-sizing-mode', 'responsive');
        }));
      });

      rightClickMenu.appendChild(createMenuItem(
        currentMode === 'fixed' ? 'Switch to Fluid Sizing (%)' : 'Switch to Fixed Sizing (px)',
        '📏',
        () => {
          const next = currentMode === 'fixed' ? 'responsive' : 'fixed';
          if (next === 'fixed') {
            editor.execute('updateImage', { src, width: `${img.offsetWidth}px`, height: `${img.offsetHeight}px`, sizingMode: 'fixed' });
          } else {
            editor.execute('updateImage', { src, width: '100%', height: 'auto', sizingMode: 'responsive' });
          }
        }
      ));

      rightClickMenu.appendChild(createMenuDivider());
      rightClickMenu.appendChild(createMenuHeader('Aspect Ratio'));
      [{ label: 'Original (Auto)', val: 'auto' }, { label: '16:9 Widescreen', val: '16/9' }, { label: '4:3 Standard', val: '4/3' }, { label: '1:1 Square', val: '1/1' }, { label: 'Free-style', val: 'none' }].forEach((rp) => {
        rightClickMenu.appendChild(createMenuItem(rp.label, '⤡', () => {
          editor.execute('updateImage', { src, aspectRatio: rp.val === 'none' ? null : rp.val });
          img.setAttribute('data-aspect-ratio', rp.val);
          img.style.aspectRatio = rp.val === 'auto' || rp.val === 'none' ? '' : rp.val;
        }));
      });

      rightClickMenu.appendChild(createMenuDivider());
      rightClickMenu.appendChild(createMenuHeader('Image Alignment'));
      rightClickMenu.appendChild(createMenuItem('Align Left', '⫷', () => {
        editor.execute('updateImage', { src, align: 'left' });
        img.setAttribute('data-align', 'left');
        img.style.display = 'block';
        img.style.marginLeft = '0';
        img.style.marginRight = 'auto';
      }));
      rightClickMenu.appendChild(createMenuItem('Align Center', '☰', () => {
        editor.execute('updateImage', { src, align: 'center' });
        img.setAttribute('data-align', 'center');
        img.style.display = 'block';
        img.style.marginLeft = 'auto';
        img.style.marginRight = 'auto';
      }));
      rightClickMenu.appendChild(createMenuItem('Align Right', '⫸', () => {
        editor.execute('updateImage', { src, align: 'right' });
        img.setAttribute('data-align', 'right');
        img.style.display = 'block';
        img.style.marginLeft = 'auto';
        img.style.marginRight = '0';
      }));

      rightClickMenu.appendChild(createMenuDivider());
      rightClickMenu.appendChild(createMenuHeader('Image Styling & Actions'));
      rightClickMenu.appendChild(createMenuItem('Edit Sizing & Properties...', '⚙️', () => {
        promptImageDialog(editor, {
          src,
          alt,
          title,
          width: currentWidth,
          height: currentHeight,
          aspectRatio: currentRatio,
          sizingMode: currentMode as any,
          lockAspectRatio: isLockedRatio,
          objectFit: currentFit,
          align: currentAlign,
          rounded: isRounded,
          shadow: isShadow,
          border: isBorder,
          linkUrl
        });
      }));
      rightClickMenu.appendChild(createMenuItem(isRounded ? 'Remove Rounded Corners' : 'Add Rounded Corners (12px)', '▢', () => {
        const next = !isRounded;
        editor.execute('updateImage', { src, rounded: next });
        img.style.borderRadius = next ? '12px' : '0px';
        img.setAttribute('data-rounded', next ? 'true' : 'false');
      }));
      rightClickMenu.appendChild(createMenuItem(isShadow ? 'Remove Drop Shadow' : 'Add Elevation Drop Shadow', '◰', () => {
        const next = !isShadow;
        editor.execute('updateImage', { src, shadow: next });
        img.style.boxShadow = next ? '0 10px 25px rgba(0,0,0,0.25)' : 'none';
        img.setAttribute('data-shadow', next ? 'true' : 'false');
      }));
      rightClickMenu.appendChild(createMenuItem('Reset Image Formatting (Clear)', '🧹', () => {
        editor.execute('clearFormatting');
        img.style.width = '';
        img.style.height = 'auto';
        img.style.aspectRatio = '';
        img.style.borderRadius = '0px';
        img.style.boxShadow = 'none';
        img.style.border = 'none';
        img.style.display = 'block';
        img.style.marginLeft = 'auto';
        img.style.marginRight = 'auto';
        img.removeAttribute('data-width');
        img.removeAttribute('data-height');
        img.removeAttribute('data-aspect-ratio');
        img.removeAttribute('data-rounded');
        img.removeAttribute('data-shadow');
        img.removeAttribute('data-border');
        img.removeAttribute('data-link-url');
        img.setAttribute('data-align', 'center');
      }));
      rightClickMenu.appendChild(createMenuItem('Open Image in New Tab', '↗️', () => {
        if (src) window.open(src, '_blank');
      }));
      rightClickMenu.appendChild(createMenuItem('Copy Image Address', '📋', () => {
        if (navigator.clipboard && src) navigator.clipboard.writeText(src);
      }));
      rightClickMenu.appendChild(createMenuItem('Delete Image', '🗑️', () => {
        editor.execute('deleteImage');
      }, true));
    }

    // Link Section
    if (link) {
      if (hasCustomSection) rightClickMenu.appendChild(createMenuDivider());
      hasCustomSection = true;
      rightClickMenu.appendChild(createMenuHeader('Link Actions'));
      const href = link.getAttribute('href') || '';
      const text = link.textContent || '';
      const target = link.getAttribute('target') || '';
      rightClickMenu.appendChild(createMenuItem('Open Link', '↗️', () => {
        window.open(href, '_blank', 'noopener,noreferrer');
      }));
      rightClickMenu.appendChild(createMenuItem('Copy Link Address', '📋', () => {
        if (navigator.clipboard && href) navigator.clipboard.writeText(href);
      }));
      rightClickMenu.appendChild(createMenuItem('Edit Link...', '✏️', () => {
        promptLinkDialog(editor, { href, text, target });
      }));
      rightClickMenu.appendChild(createMenuItem('Remove Link', '✕', () => {
        editor.execute('removeLink');
      }, true));
    }

    // General Document Operations
    if (hasCustomSection) rightClickMenu.appendChild(createMenuDivider());
    rightClickMenu.appendChild(createMenuHeader('Quick Actions'));
    rightClickMenu.appendChild(createMenuItem('Undo', '↶', () => editor.execute('undo')));
    rightClickMenu.appendChild(createMenuItem('Redo', '↷', () => editor.execute('redo')));
    rightClickMenu.appendChild(createMenuItem('Clear Formatting', '🧹', () => editor.execute('clearFormatting')));

    rightClickMenu.style.display = 'block';

    const menuRect = rightClickMenu.getBoundingClientRect();
    let left = e.clientX;
    let top = e.clientY;

    if (left + menuRect.width > window.innerWidth - 10) {
      left = window.innerWidth - menuRect.width - 10;
    }
    if (top + menuRect.height > window.innerHeight - 10) {
      top = window.innerHeight - menuRect.height - 10;
    }

    rightClickMenu.style.left = `${left}px`;
    rightClickMenu.style.top = `${top}px`;
  }

  // --- Viewer Mode Lightbox & Full-View Features ---

  function openViewerLightbox(imageSrc?: string | null, titleText?: string) {
    const overlay = document.createElement('div');
    overlay.className = 'aurora-viewer-lightbox-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 100000;
      background: rgba(10, 15, 29, 0.94);
      backdrop-filter: blur(12px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      box-sizing: border-box;
      user-select: none;
    `;

    // Header bar
    const bar = document.createElement('div');
    bar.style.cssText = `
      position: absolute;
      top: 18px;
      left: 24px;
      right: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--aurora-fg, #f8fafc);
      font-family: var(--aurora-font-family, system-ui, sans-serif);
      font-size: 14px;
    `;
    const titleEl = document.createElement('span');
    titleEl.style.cssText = 'font-weight: 600; color: var(--aurora-primary, #00E5FF); letter-spacing: 0.3px;';
    titleEl.textContent = titleText || (imageSrc ? '🔍 Image Lightbox View' : '📖 Document Lightbox View');
    bar.appendChild(titleEl);

    const controls = document.createElement('div');
    controls.style.cssText = 'display: flex; gap: 8px; align-items: center;';

    let zoomLevel = 1.0;
    const zoomText = document.createElement('span');
    zoomText.style.cssText = 'font-size: 12px; font-weight: 600; color: var(--aurora-muted-fg, #94a3b8); min-width: 45px; text-align: center;';
    zoomText.textContent = '100%';

    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.type = 'button';
    zoomOutBtn.textContent = '−';
    zoomOutBtn.title = 'Zoom out';
    zoomOutBtn.style.cssText = 'padding: 4px 10px; border-radius: 4px; border: 1px solid var(--aurora-border, #1e293b); background: rgba(255,255,255,0.06); color: inherit; font-size: 14px; cursor: pointer;';

    const zoomInBtn = document.createElement('button');
    zoomInBtn.type = 'button';
    zoomInBtn.textContent = '+';
    zoomInBtn.title = 'Zoom in';
    zoomInBtn.style.cssText = 'padding: 4px 10px; border-radius: 4px; border: 1px solid var(--aurora-border, #1e293b); background: rgba(255,255,255,0.06); color: inherit; font-size: 14px; cursor: pointer;';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = '✕';
    closeBtn.title = 'Close Lightbox (Esc)';
    closeBtn.style.cssText = 'padding: 4px 12px; border-radius: 4px; border: 1px solid rgba(255,107,107,0.4); background: rgba(255,107,107,0.15); color: #ff6b6b; font-size: 14px; font-weight: 700; cursor: pointer; margin-left: 8px;';

    controls.appendChild(zoomOutBtn);
    controls.appendChild(zoomText);
    controls.appendChild(zoomInBtn);
    controls.appendChild(closeBtn);
    bar.appendChild(controls);
    overlay.appendChild(bar);

    // Lightbox Body
    const bodyContainer = document.createElement('div');
    bodyContainer.style.cssText = 'max-width: 90vw; max-height: 80vh; overflow: auto; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;';

    let contentEl: HTMLElement;
    if (imageSrc) {
      const img = document.createElement('img');
      img.src = imageSrc;
      img.style.cssText = 'max-width: 100%; max-height: 75vh; object-fit: contain; border-radius: 8px; box-shadow: 0 16px 40px rgba(0,0,0,0.6); transition: transform 0.15s ease;';
      contentEl = img;
    } else {
      const docCard = document.createElement('div');
      docCard.style.cssText = 'background: var(--aurora-bg, #0a0f1d); border: 1px solid var(--aurora-border, #1e293b); border-radius: 12px; padding: 36px; width: 850px; max-width: 100%; color: var(--aurora-fg, #f8fafc); box-shadow: 0 20px 50px rgba(0,0,0,0.6); font-family: var(--aurora-font-family, system-ui, sans-serif); line-height: 1.6; transition: transform 0.15s ease;';
      docCard.innerHTML = editor.export({ format: 'html' });
      contentEl = docCard;
    }
    bodyContainer.appendChild(contentEl);
    overlay.appendChild(bodyContainer);

    const updateZoom = () => {
      contentEl.style.transform = `scale(${zoomLevel})`;
      zoomText.textContent = `${Math.round(zoomLevel * 100)}%`;
    };

    zoomInBtn.addEventListener('click', () => {
      if (zoomLevel < 3.0) {
        zoomLevel += 0.2;
        updateZoom();
      }
    });

    zoomOutBtn.addEventListener('click', () => {
      if (zoomLevel > 0.4) {
        zoomLevel -= 0.2;
        updateZoom();
      }
    });

    const closeLightbox = () => {
      window.removeEventListener('keydown', onEsc);
      overlay.remove();
    };

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', onEsc);
    closeBtn.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target === bodyContainer) closeLightbox();
    });

    document.body.appendChild(overlay);
  }

  function toggleViewerFullView() {
    const target = (editorEl.closest('.aurora-editor-mount, .aurora-editor-container') || editorEl) as HTMLElement;
    if (!target) return;

    if (!isFullViewActive) {
      isFullViewActive = true;
      target.classList.add('aurora-fullview-active');
      target.setAttribute('data-original-style', target.getAttribute('style') || '');
      target.style.cssText = `
        position: fixed !important;
        inset: 0 !important;
        z-index: 99990 !important;
        background: var(--aurora-bg, #0a0f1d) !important;
        color: var(--aurora-fg, #f8fafc) !important;
        padding: 40px 60px !important;
        overflow-y: auto !important;
        box-sizing: border-box !important;
        border: none !important;
        border-radius: 0 !important;
      `;

      const exitBadge = document.createElement('button');
      exitBadge.className = 'aurora-exit-fullview-badge';
      exitBadge.type = 'button';
      exitBadge.textContent = '✕ Exit Full-View (Esc)';
      exitBadge.style.cssText = `
        position: fixed;
        top: 16px;
        right: 24px;
        z-index: 99995;
        background: rgba(10, 15, 29, 0.85);
        color: #00E5FF;
        border: 1px solid rgba(0, 229, 255, 0.4);
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        backdrop-filter: blur(8px);
      `;
      exitBadge.addEventListener('click', () => toggleViewerFullView());
      document.body.appendChild(exitBadge);
    } else {
      isFullViewActive = false;
      target.classList.remove('aurora-fullview-active');
      const orig = target.getAttribute('data-original-style');
      if (orig !== null) {
        target.setAttribute('style', orig);
        target.removeAttribute('data-original-style');
      }
      document.querySelector('.aurora-exit-fullview-badge')?.remove();
    }
  }

  // --- Event Listeners ---

  // Contextmenu (Right click)
  const handleContextMenu = (e: MouseEvent) => {
    if (!editor.isEditable()) return;
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (editorEl.contains(target)) {
      openRightClickMenu(e, target);
    }
  };

  // Click & Selection Listener for floating bar
  const handleClick = (e: MouseEvent) => {
    hideRightClickMenu();

    const target = e.target as HTMLElement | null;
    if (!target) return;

    if (!editor.isEditable()) {
      hideFloatingBar();
      if (editorEl.contains(target)) {
        const img = target.closest('img') as HTMLImageElement | null;
        if (img) {
          openViewerLightbox(img.src, img.alt || 'Document Image');
        }
      }
      return;
    }

    // Don't close if clicking inside our floating bar, resize handle, or dialog
    if (floatingBar.contains(target) || resizeHandle.contains(target) || target.closest('.aurora-dialog-overlay')) {
      return;
    }

    // If target is inside editor
    if (editorEl.contains(target)) {
      const img = target.closest('img') as HTMLImageElement | null;
      if (img) {
        renderImageToolbar(img);
        return;
      }

      const link = target.closest('a') as HTMLAnchorElement | null;
      if (link) {
        renderLinkToolbar(link);
        return;
      }

      const table = target.closest('td, th, table') as HTMLElement | null;
      if (table) {
        renderTableToolbar(table);
        return;
      }
    }

    hideFloatingBar();
  };

  const handleSelectionChange = (sel: SelectionState) => {
    if (!editor.isEditable()) {
      hideFloatingBar();
      return;
    }

    // If user has focused inside a table
    if (sel.isInTable) {
      const currentCell = (document.activeElement?.closest('td, th') ||
        window.getSelection()?.anchorNode?.parentElement?.closest('td, th') ||
        editorEl.querySelector('td:focus, th:focus, table')) as HTMLElement | null;

      if (currentCell && activeTargetType !== 'table') {
        renderTableToolbar(currentCell);
        return;
      }
    } else if (activeTargetType === 'table') {
      hideFloatingBar();
    }

    // If an image is selected via NodeSelection
    if (sel.selectedNodeType === 'image') {
      const img = editorEl.querySelector('img.ProseMirror-selectednode, img') as HTMLImageElement | null;
      if (img && activeTargetType !== 'image') {
        renderImageToolbar(img);
        return;
      }
    } else if (activeTargetType === 'image') {
      hideFloatingBar();
    }

    // If link mark is active and text is clicked
    if (sel.activeMarks.includes('link') && !activeTargetType) {
      const linkEl = window.getSelection()?.anchorNode?.parentElement?.closest('a') as HTMLAnchorElement | null;
      if (linkEl) {
        renderLinkToolbar(linkEl);
        return;
      }
    }
  };

  const handleScrollOrResize = () => {
    if (activeTargetNode && activeTargetType) {
      positionFloatingBar(activeTargetNode.getBoundingClientRect());
      if (activeTargetType === 'image') {
        const liveRect = activeTargetNode.getBoundingClientRect();
        resizeHandle.style.top = `${Math.round(liveRect.bottom - 7)}px`;
        resizeHandle.style.left = `${Math.round(liveRect.right - 7)}px`;
      }
    }
    hideRightClickMenu();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isFullViewActive) {
        toggleViewerFullView();
      }
      hideFloatingBar();
      hideRightClickMenu();
    }
  };

  // Mouse movement on editor / viewer to control Viewer Mode top-right floating icons & Edit Mode table resize handles
  const handleMouseMove = (e: MouseEvent) => {
    if (!editor.isEditable()) {
      tableColResizer.style.display = 'none';
      tableRowResizer.style.display = 'none';
      viewerFloatingBar.style.display = 'flex';
      const rect = editorEl.getBoundingClientRect();

      viewerFloatingBar.style.top = `${Math.round(rect.top + 10)}px`;
      viewerFloatingBar.style.left = `${Math.round(rect.right - 80)}px`;

      // Only visible when mouse is moved to top right corner of the viewer (within 130px from right, 80px from top)
      const inTopRightCorner =
        e.clientX >= rect.right - 140 &&
        e.clientX <= rect.right + 20 &&
        e.clientY >= rect.top - 10 &&
        e.clientY <= rect.top + 80;

      if (inTopRightCorner || viewerFloatingBar.contains(e.target as Node)) {
        viewerFloatingBar.style.opacity = '1';
        viewerFloatingBar.style.pointerEvents = 'auto';
        viewerFloatingBar.style.transform = 'translateY(0)';
      } else {
        viewerFloatingBar.style.opacity = '0';
        viewerFloatingBar.style.pointerEvents = 'none';
        viewerFloatingBar.style.transform = 'translateY(-6px)';
      }
      return;
    }

    viewerFloatingBar.style.display = 'none';

    if (isColDragging || isRowDragging) {
      return;
    }

    const target = e.target as HTMLElement | null;
    if (target && (target === tableColResizer || target === tableRowResizer)) {
      return;
    }

    const cell = target?.closest('td, th') as HTMLTableCellElement | null;
    const table = cell?.closest('table') as HTMLTableElement | null;

    if (cell && table) {
      const cellRect = cell.getBoundingClientRect();
      const tableRect = table.getBoundingClientRect();

      const nearRight = Math.abs(e.clientX - cellRect.right) <= 7;
      const nearBottom = Math.abs(e.clientY - cellRect.bottom) <= 7;

      if (nearRight) {
        tableColResizer.style.display = 'block';
        tableColResizer.style.top = `${Math.round(tableRect.top)}px`;
        tableColResizer.style.height = `${Math.round(tableRect.height)}px`;
        tableColResizer.style.left = `${Math.round(cellRect.right - 3)}px`;
        setupInteractiveColResize(cell, table);
      } else if (!isColDragging) {
        tableColResizer.style.display = 'none';
      }

      if (nearBottom) {
        const row = cell.closest('tr') as HTMLTableRowElement | null;
        if (row) {
          tableRowResizer.style.display = 'block';
          tableRowResizer.style.left = `${Math.round(tableRect.left)}px`;
          tableRowResizer.style.width = `${Math.round(tableRect.width)}px`;
          tableRowResizer.style.top = `${Math.round(cellRect.bottom - 3)}px`;
          setupInteractiveRowResize(row, table);
        }
      } else if (!isRowDragging) {
        tableRowResizer.style.display = 'none';
      }
    } else {
      if (!isColDragging) tableColResizer.style.display = 'none';
      if (!isRowDragging) tableRowResizer.style.display = 'none';
    }
  };

  const handleMouseLeave = () => {
    if (!editor.isEditable()) {
      viewerFloatingBar.style.opacity = '0';
      viewerFloatingBar.style.pointerEvents = 'none';
      viewerFloatingBar.style.transform = 'translateY(-6px)';
    } else {
      if (!isColDragging) tableColResizer.style.display = 'none';
      if (!isRowDragging) tableRowResizer.style.display = 'none';
    }
  };

  // Wire up
  editorEl.addEventListener('contextmenu', handleContextMenu);
  editorEl.addEventListener('mousemove', handleMouseMove);
  editorEl.addEventListener('mouseleave', handleMouseLeave);
  viewerFloatingBar.addEventListener('mouseenter', () => {
    viewerFloatingBar.style.opacity = '1';
    viewerFloatingBar.style.pointerEvents = 'auto';
    viewerFloatingBar.style.transform = 'translateY(0)';
  });
  document.addEventListener('click', handleClick);
  window.addEventListener('scroll', handleScrollOrResize, true);
  window.addEventListener('resize', handleScrollOrResize);
  window.addEventListener('keydown', handleKeyDown);

  const unsubSel = editor.on('selectionChange', handleSelectionChange);
  const unsubChange = editor.on('change', () => {
    if (!editor.isEditable()) {
      hideFloatingBar();
      hideRightClickMenu();
      tableColResizer.style.display = 'none';
      tableRowResizer.style.display = 'none';
    }
  });

  return {
    element: wrapper,
    destroy() {
      unsubSel();
      unsubChange();
      editorEl.removeEventListener('contextmenu', handleContextMenu);
      editorEl.removeEventListener('mousemove', handleMouseMove);
      editorEl.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('keydown', handleKeyDown);
      document.querySelector('.aurora-exit-fullview-badge')?.remove();
      tableColResizer.remove();
      tableRowResizer.remove();
      wrapper.remove();
    }
  };
}
