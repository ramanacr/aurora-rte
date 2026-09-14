export interface ReviewComment {
  id: string;
  author: { id: string; name: string; avatar?: string };
  text: string;
  createdAt: string;
  resolved?: boolean;
  replies?: Array<{ author: { name: string }; text: string; createdAt: string }>;
  anchor?: { from: number; to: number; snippet?: string };
}

export interface ReviewSuggestion {
  id: string;
  mode: 'insert' | 'delete' | 'replace';
  author: { id: string; name: string };
  createdAt: string;
  originalText?: string;
  suggestedText?: string;
}

export interface ReviewGutterOptions {
  container: HTMLElement;
  currentUser: { id: string; name: string };
  onAcceptSuggestion?: (suggestionId: string) => void;
  onRejectSuggestion?: (suggestionId: string) => void;
  onResolveComment?: (commentId: string) => void;
  onAddComment?: (comment: ReviewComment) => void;
}

export interface ReviewGutterController {
  element: HTMLElement;
  addComment: (comment: ReviewComment) => void;
  setComments: (comments: ReviewComment[]) => void;
  addSuggestion: (suggestion: ReviewSuggestion) => void;
  removeSuggestion: (suggestionId: string) => void;
  setSuggestions: (suggestions: ReviewSuggestion[]) => void;
  toggleVisible: (visible?: boolean) => boolean;
  destroy: () => void;
}

/**
 * Renders an inline Review & Suggestion Gutter for enterprise collaborative reviews.
 */
export function createReviewGutter(options: ReviewGutterOptions): ReviewGutterController {
  let comments: ReviewComment[] = [];
  let suggestions: ReviewSuggestion[] = [];
  let isVisible = true;

  const gutter = document.createElement('div');
  gutter.className = 'aurora-review-gutter';
  gutter.style.cssText = `
    display: flex;
    flex-direction: column;
    width: 320px;
    background: #040d21;
    border-left: 1px solid #132a59;
    padding: 16px;
    gap: 16px;
    overflow-y: auto;
    max-height: 100%;
    box-sizing: border-box;
    font-family: system-ui, sans-serif;
  `;

  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #132a59;
    padding-bottom: 8px;
  `;
  header.innerHTML = `
    <div style="display: flex; align-items: center; gap: 6px;">
      <span style="font-size: 0.9rem; font-weight: 700; color: #28E6F5;">Review & Comments</span>
      <span id="review-count-badge" style="font-size: 0.72rem; padding: 2px 6px; border-radius: 10px; background: rgba(40,230,245,0.15); color: #28E6F5;">0</span>
    </div>
  `;
  gutter.appendChild(header);

  const listContainer = document.createElement('div');
  listContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 12px;
  `;
  gutter.appendChild(listContainer);

  function render() {
    listContainer.innerHTML = '';
    const totalCount = comments.filter((c) => !c.resolved).length + suggestions.length;
    const badge = header.querySelector('#review-count-badge');
    if (badge) badge.textContent = String(totalCount);

    if (totalCount === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = `
        text-align: center;
        padding: 24px 12px;
        color: #5d759d;
        font-size: 0.82rem;
      `;
      empty.textContent = 'No active suggestions or comments. Select text in the editor to comment or suggest changes.';
      listContainer.appendChild(empty);
      return;
    }

    // Render Suggestions (Track Changes)
    suggestions.forEach((s) => {
      const card = document.createElement('div');
      card.className = 'aurora-suggestion-card';
      card.style.cssText = `
        background: #081938;
        border: 1px solid ${s.mode === 'insert' ? '#00FF88' : '#FF2E93'};
        border-radius: 8px;
        padding: 12px;
        font-size: 0.82rem;
        display: flex;
        flex-direction: column;
        gap: 8px;
      `;
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600; color: #e2ecf9;">${s.author.name}</span>
          <span style="font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background: ${s.mode === 'insert' ? 'rgba(0,255,136,0.15)' : 'rgba(255,46,147,0.15)'}; color: ${s.mode === 'insert' ? '#00FF88' : '#FF2E93'}; font-weight: 600;">
            ${s.mode === 'insert' ? '+ Added' : '- Deleted'}
          </span>
        </div>
        <div style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 0.8rem; word-break: break-all;">
          ${s.mode === 'insert' ? `<span style="color: #00FF88; text-decoration: underline;">${s.suggestedText}</span>` : `<span style="color: #FF2E93; text-decoration: line-through;">${s.originalText}</span>`}
        </div>
        <div style="display: flex; gap: 8px; margin-top: 4px;">
          <button class="accept-btn" style="flex: 1; padding: 5px; font-size: 0.75rem; font-weight: 600; cursor: pointer; border-radius: 4px; border: none; background: #00FF88; color: #040d21;">✓ Accept</button>
          <button class="reject-btn" style="flex: 1; padding: 5px; font-size: 0.75rem; font-weight: 600; cursor: pointer; border-radius: 4px; border: 1px solid #FF2E93; background: transparent; color: #FF2E93;">✕ Reject</button>
        </div>
      `;

      card.querySelector('.accept-btn')?.addEventListener('click', () => {
        options.onAcceptSuggestion?.(s.id);
        suggestions = suggestions.filter((x) => x.id !== s.id);
        render();
      });

      card.querySelector('.reject-btn')?.addEventListener('click', () => {
        options.onRejectSuggestion?.(s.id);
        suggestions = suggestions.filter((x) => x.id !== s.id);
        render();
      });

      listContainer.appendChild(card);
    });

    // Render Comments
    comments.filter((c) => !c.resolved).forEach((c) => {
      const card = document.createElement('div');
      card.className = 'aurora-comment-card';
      card.style.cssText = `
        background: #081938;
        border: 1px solid #1f3b73;
        border-radius: 8px;
        padding: 12px;
        font-size: 0.82rem;
        display: flex;
        flex-direction: column;
        gap: 8px;
      `;
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600; color: #28E6F5;">${c.author.name}</span>
          <span style="font-size: 0.7rem; color: #5d759d;">${new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        ${c.anchor?.snippet ? `<div style="padding: 4px 8px; border-left: 2px solid #28E6F5; background: rgba(40,230,245,0.05); font-style: italic; color: #a4b8d6; font-size: 0.78rem;">"${c.anchor.snippet}"</div>` : ''}
        <div style="color: #e2ecf9; line-height: 1.4;">${c.text}</div>
        <div style="display: flex; justify-content: flex-end; margin-top: 4px;">
          <button class="resolve-btn" style="padding: 4px 10px; font-size: 0.75rem; cursor: pointer; border-radius: 4px; border: 1px solid #1f3b73; background: transparent; color: #25E0C4;">Resolve</button>
        </div>
      `;

      card.querySelector('.resolve-btn')?.addEventListener('click', () => {
        c.resolved = true;
        options.onResolveComment?.(c.id);
        render();
      });

      listContainer.appendChild(card);
    });
  }

  render();

  return {
    element: gutter,
    addComment: (comment: ReviewComment) => {
      comments.push(comment);
      render();
    },
    setComments: (newComments: ReviewComment[]) => {
      comments = [...newComments];
      render();
    },
    addSuggestion: (suggestion: ReviewSuggestion) => {
      suggestions.push(suggestion);
      render();
    },
    removeSuggestion: (suggestionId: string) => {
      suggestions = suggestions.filter((s) => s.id !== suggestionId);
      render();
    },
    setSuggestions: (newSuggestions: ReviewSuggestion[]) => {
      suggestions = [...newSuggestions];
      render();
    },
    toggleVisible: (forceVisible?: boolean) => {
      isVisible = forceVisible !== undefined ? forceVisible : !isVisible;
      gutter.style.display = isVisible ? 'flex' : 'none';
      return isVisible;
    },
    destroy: () => {
      gutter.remove();
    }
  };
}
