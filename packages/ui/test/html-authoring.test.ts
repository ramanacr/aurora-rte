// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import {
  DefaultHtmlElementRegistry,
  getGlobalRegistry,
  evaluateElementAvailability,
  renderTemplateToHtml,
  BUILT_IN_COMPOSITE_TEMPLATES,
  isValidUrl,
  migrateLegacyHtml,
  sanitizeHtml,
  auditElementAccessibility,
  applyAccessibilityFix,
  calculateToolbarLayout,
  getBreakpointForWidth,
  STANDARD_POLICIES
} from '../src/html-authoring/index.js';

describe('HTML Authoring System Core', () => {
  describe('HTML Element Registry (Doc 02 & 04)', () => {
    it('registers and categorizes HTML elements across all 12 taxonomy categories', () => {
      const registry = new DefaultHtmlElementRegistry();
      const all = registry.getAll();
      expect(all.length).toBeGreaterThanOrEqual(40);

      const categories = new Set(all.map((e) => e.category));
      expect(categories.has('basic')).toBe(true);
      expect(categories.has('text')).toBe(true);
      expect(categories.has('heading')).toBe(true);
      expect(categories.has('structure')).toBe(true);
      expect(categories.has('lists')).toBe(true);
      expect(categories.has('media')).toBe(true);
      expect(categories.has('tables')).toBe(true);
      expect(categories.has('forms')).toBe(true);
      expect(categories.has('interactive')).toBe(true);
      expect(categories.has('legacy')).toBe(true);
    });

    it('searches elements by tag, display name, and aliases with ranking', () => {
      const registry = new DefaultHtmlElementRegistry();
      const pResults = registry.search('paragraph');
      expect(pResults.length).toBeGreaterThan(0);
      expect(pResults[0].tagName).toBe('p');

      const boldResults = registry.search('bold');
      expect(boldResults.some((e) => e.tagName === 'strong')).toBe(true);
    });

    it('supports custom element registration and unregistration', () => {
      const registry = new DefaultHtmlElementRegistry();
      registry.register({
        tagName: 'my-custom-card',
        displayName: 'Custom Card',
        description: 'A custom Web Component card',
        category: 'custom',
        isVoid: false,
        isInline: false,
        isContainer: true,
        isComposite: false,
        insertionMode: 'container',
        capabilities: {
          editable: true,
          styleable: true,
          draggable: true,
          resizable: true,
          supportsChildren: true,
          supportsAttributes: true
        },
        menu: { visibleInStandard: true, visibleInAdvanced: true, preferredSurface: 'insert-menu', priority: 1 }
      });

      expect(registry.get('my-custom-card')).toBeDefined();
      expect(registry.get('my-custom-card')?.displayName).toBe('Custom Card');

      registry.unregister('my-custom-card');
      expect(registry.get('my-custom-card')).toBeUndefined();
    });
  });

  describe('Context Validation and Scoring Engine (Doc 05)', () => {
    it('enforces contextual child parent constraints', () => {
      const registry = getGlobalRegistry();
      const liDef = registry.get('li')!;
      expect(liDef).toBeDefined();

      // Inside a p tag, li should be blocked
      const pContext = {
        parentTag: 'p',
        ancestorTags: ['p', 'body'],
        selectionType: 'block' as const,
        selectedNodeTags: [],
        editorMode: 'standard' as const
      };
      const pAvailability = evaluateElementAvailability(liDef, pContext);
      expect(pAvailability.allowed).toBe(false);

      // Inside a ul tag, li should be allowed
      const ulContext = {
        parentTag: 'ul',
        ancestorTags: ['ul', 'body'],
        selectionType: 'list-item' as const,
        selectedNodeTags: [],
        editorMode: 'standard' as const
      };
      const ulAvailability = evaluateElementAvailability(liDef, ulContext);
      expect(ulAvailability.allowed).toBe(true);
      expect(ulAvailability.score).toBeGreaterThan(0);
    });

    it('calculates relevance score using the 5-factor weighted formula', () => {
      const registry = getGlobalRegistry();
      const strongDef = registry.get('strong')!;

      const textContext = {
        parentTag: 'p',
        ancestorTags: ['p'],
        selectionType: 'text' as const,
        selectedNodeTags: [],
        editorMode: 'standard' as const
      };

      const availability = evaluateElementAvailability(strongDef, textContext, {
        favorites: ['strong'],
        recentElements: ['strong']
      });

      expect(availability.allowed).toBe(true);
      // contextMatch (1.0*50) + frequency + recentUsage + favoriteBoost + modeCompatibility
      expect(availability.score).toBeGreaterThanOrEqual(60);
    });
  });

  describe('Composite Element Templates (Doc 06)', () => {
    it('renders valid structured scaffolds for composite elements', () => {
      const sectionTpl = BUILT_IN_COMPOSITE_TEMPLATES['section-template'];
      const sectionHtml = renderTemplateToHtml(sectionTpl);
      expect(sectionHtml).toContain('<section>');
      expect(sectionHtml).toContain('<h2>Section Heading</h2>');
      expect(sectionHtml).toContain('</section>');

      const detailsTpl = BUILT_IN_COMPOSITE_TEMPLATES['details-template'];
      const detailsHtml = renderTemplateToHtml(detailsTpl);
      expect(detailsHtml).toContain('<details>');
      expect(detailsHtml).toContain('<summary>');
      expect(detailsHtml).toContain('</details>');

      const figureTpl = BUILT_IN_COMPOSITE_TEMPLATES['figure-template'];
      const figureHtml = renderTemplateToHtml(figureTpl);
      expect(figureHtml).toContain('<figure>');
      expect(figureHtml).toContain('<img');
      expect(figureHtml).toContain('<figcaption>');
      expect(figureHtml).toContain('</figure>');
    });
  });

  describe('Security and Sanitization Pipeline (Doc 10 & 11)', () => {
    it('disallows unsafe URL protocols like javascript:', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('mailto:test@example.com')).toBe(true);
      expect(isValidUrl('tel:+123456789')).toBe(true);
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
      expect(isValidUrl('vbscript:msgbox(1)')).toBe(false);
    });

    it('migrates legacy elements (font, center, strike) to semantic equivalents', () => {
      const legacy = '<font color="red">Hello</font> <center>Centered</center> <strike>Deleted</strike>';
      const migrated = migrateLegacyHtml(legacy);
      expect(migrated).toContain('<span style="color:red;">Hello</span>');
      expect(migrated).toContain('<div style="text-align: center;">Centered</div>');
      expect(migrated).toContain('<s>Deleted</s>');
    });

    it('sanitizes scripts and inline event handlers against policy', () => {
      const dirty = '<p onclick="alert(1)">Text <script>alert(2)</script><a href="javascript:steal()">Link</a></p>';
      const clean = sanitizeHtml(dirty, STANDARD_POLICIES.standard);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('onclick');
      expect(clean).not.toContain('javascript:steal()');
    });
  });

  describe('Responsive Layout Engine (Doc 07)', () => {
    it('maps pixel widths to standard breakpoints', () => {
      expect(getBreakpointForWidth(1300)).toBe('expanded');
      expect(getBreakpointForWidth(1050)).toBe('standard');
      expect(getBreakpointForWidth(750)).toBe('compact');
      expect(getBreakpointForWidth(480)).toBe('mobile');
      expect(getBreakpointForWidth(350)).toBe('minimal');
    });

    it('allocates commands between visible bar and overflow based on width', () => {
      const commands = [
        { id: 'cmd1', priority: 1, estimatedWidth: 40, preferredSurface: 'toolbar' as const },
        { id: 'cmd2', priority: 2, estimatedWidth: 40, preferredSurface: 'toolbar' as const },
        { id: 'cmd3', priority: 3, estimatedWidth: 40, preferredSurface: 'toolbar' as const },
        { id: 'cmd4', priority: 4, estimatedWidth: 40, preferredSurface: 'toolbar' as const },
        { id: 'cmd5', priority: 5, estimatedWidth: 40, preferredSurface: 'toolbar' as const }
      ];

      // Available width fits only ~2-3 commands plus overflow button
      const plan = calculateToolbarLayout(120, commands);
      expect(plan.visibleCommandIds.length).toBeGreaterThanOrEqual(1);
      expect(plan.overflowCommandIds.length).toBeGreaterThanOrEqual(1);
      expect(plan.visibleCommandIds).toContain('cmd1');
    });
  });

  describe('Accessibility Inspector and Auto-fix (Doc 09)', () => {
    it('flags missing alt attribute on img and provides auto-fix', () => {
      const img = document.createElement('img');
      img.src = 'https://example.com/pic.png';

      const issues = auditElementAccessibility(img);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].elementTag).toBe('img');
      expect(issues[0].severity).toBe('error');

      const fixed = applyAccessibilityFix(img, issues[0]);
      expect(fixed).toBe(true);
      expect(img.hasAttribute('alt')).toBe(true);
    });

    it('flags missing accessible name on buttons', () => {
      const btn = document.createElement('button');
      const issues = auditElementAccessibility(btn);
      expect(issues.some((i) => i.elementTag === 'button' && i.severity === 'error')).toBe(true);

      btn.setAttribute('aria-label', 'Submit form');
      const resolvedIssues = auditElementAccessibility(btn);
      expect(resolvedIssues.length).toBe(0);
    });
  });
});
