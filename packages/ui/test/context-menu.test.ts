// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { createEditor } from '@aurora/editor';
import { createInplaceContextMenu } from '../src/context-menu.js';
import type { AuroraDocument } from '@aurora/model';

describe('In-place Context Menu Component', () => {
  it('mounts context menu wrapper and responds to table, image, and link contexts', () => {
    const doc: AuroraDocument = {
      format: 'aurora',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Link to site',
              marks: [{ type: 'link', attrs: { href: 'https://example.com' } }]
            }
          ]
        },
        {
          type: 'image',
          attrs: { src: 'https://example.com/pic.png', alt: 'Alt text', title: 'Title text' }
        },
        {
          type: 'table',
          attrs: { rows: 1, cols: 1 },
          content: [
            {
              type: 'table_row',
              content: [
                {
                  type: 'table_cell',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Cell' }] }]
                }
              ]
            }
          ]
        }
      ]
    };

    const container = document.createElement('div');
    document.body.appendChild(container);

    const editorMount = document.createElement('div');
    container.appendChild(editorMount);

    const editor = createEditor({
      element: editorMount,
      document: doc
    });

    const menu = createInplaceContextMenu({ editor, container });
    expect(menu.element).toBeDefined();

    const floatingBar = menu.element.querySelector('.aurora-floating-inplace-menu') as HTMLElement;
    const rightClickMenu = menu.element.querySelector('.aurora-right-click-menu') as HTMLElement;

    expect(floatingBar).not.toBeNull();
    expect(rightClickMenu).not.toBeNull();
    expect(floatingBar.style.display).toBe('none');
    expect(rightClickMenu.style.display).toBe('none');

    // 1. Test clicking table cell activates table floating toolbar
    const tableCell = editorMount.querySelector('td');
    expect(tableCell).not.toBeNull();
    if (tableCell) {
      tableCell.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(floatingBar.style.display).toBe('flex');
      expect(floatingBar.textContent).toContain('Table');
      expect(floatingBar.textContent).toContain('Row Above');
      expect(floatingBar.textContent).toContain('Striped');
      expect(floatingBar.textContent).toContain('Properties');
      expect(floatingBar.textContent).toContain('Del Table');

      // Click "Row Above" button
      const rowAboveBtn = floatingBar.querySelector('button[title="Insert row above"]') as HTMLButtonElement;
      expect(rowAboveBtn).not.toBeNull();
      rowAboveBtn.click();
    }

    // 2. Test clicking image activates image floating toolbar with sizing & alignment
    const img = editorMount.querySelector('img');
    expect(img).not.toBeNull();
    if (img) {
      img.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(floatingBar.style.display).toBe('flex');
      expect(floatingBar.textContent).toContain('Image');
      expect(floatingBar.textContent).toContain('25%');
      expect(floatingBar.textContent).toContain('50%');
      expect(floatingBar.textContent).toContain('75%');
      expect(floatingBar.textContent).toContain('100%');
      expect(floatingBar.textContent).toContain('Round');
      expect(floatingBar.textContent).toContain('Shadow');
      expect(floatingBar.textContent).toContain('Settings');
      expect(floatingBar.textContent).toContain('Delete');

      // Click 50% resize pill
      const resize50Btn = floatingBar.querySelector('button[title="Resize to 50%"]') as HTMLButtonElement;
      expect(resize50Btn).not.toBeNull();
      resize50Btn.click();
      expect(img.style.width).toBe('50%');

      // Click Round toggle
      const roundBtn = floatingBar.querySelector('button[title*="rounded"]') as HTMLButtonElement;
      expect(roundBtn).not.toBeNull();
      roundBtn.click();
      expect(img.style.borderRadius).toBe('12px');
    }

    // 3. Test clicking link activates link floating toolbar
    const link = editorMount.querySelector('a');
    expect(link).not.toBeNull();
    if (link) {
      link.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(floatingBar.style.display).toBe('flex');
      expect(floatingBar.textContent).toContain('Link');
      expect(floatingBar.textContent).toContain('Open');
      expect(floatingBar.textContent).toContain('Unlink');
    }

    // 4. Test right click context menu on table cell
    if (tableCell) {
      tableCell.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 100, clientY: 100 }));
      expect(rightClickMenu.style.display).toBe('block');
      expect(rightClickMenu.textContent).toContain('Table Structure');
      expect(rightClickMenu.textContent).toContain('Table Design');
      expect(rightClickMenu.textContent).toContain('Insert Row Above');
      expect(rightClickMenu.textContent).toContain('Delete Entire Table');
    }

    // 5. Test right click context menu on image with sizing options
    const targetImg = editorMount.querySelector('img');
    expect(targetImg).not.toBeNull();
    if (targetImg) {
      targetImg.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 150, clientY: 150 }));
      expect(rightClickMenu.style.display).toBe('block');
      expect(rightClickMenu.textContent).toContain('Image Sizing');
      expect(rightClickMenu.textContent).toContain('Resize to 25%');
      expect(rightClickMenu.textContent).toContain('Resize to 50%');
      expect(rightClickMenu.textContent).toContain('Resize to 75%');
      expect(rightClickMenu.textContent).toContain('Resize to 100%');
      expect(rightClickMenu.textContent).toContain('Image Alignment');
      expect(rightClickMenu.textContent).toContain('Align Left');
      expect(rightClickMenu.textContent).toContain('Align Center');
      expect(rightClickMenu.textContent).toContain('Align Right');
      expect(rightClickMenu.textContent).toContain('Delete Image');
    }

    // 6. Test right click context menu on link
    const targetLink = editorMount.querySelector('a');
    expect(targetLink).not.toBeNull();
    if (targetLink) {
      targetLink.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 200, clientY: 200 }));
      expect(rightClickMenu.style.display).toBe('block');
      expect(rightClickMenu.textContent).toContain('Link Actions');
      expect(rightClickMenu.textContent).toContain('Open Link');
    }

    // 7. Escape key dismisses menus
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(floatingBar.style.display).toBe('none');
    expect(rightClickMenu.style.display).toBe('none');

    // Clean teardown
    menu.destroy();
    editor.destroy();
    container.remove();
  });
});
