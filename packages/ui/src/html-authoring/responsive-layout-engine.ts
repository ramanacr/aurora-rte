import type { ResponsiveBreakpoint, ResponsiveCommandMetadata } from './types.js';

export interface LayoutPlan {
  breakpoint: ResponsiveBreakpoint;
  availableWidth: number;
  visibleCommandIds: string[];
  overflowCommandIds: string[];
  isMobileMode: boolean;
}

/**
 * Resolves the responsive breakpoint from an available pixel width
 */
export function getBreakpointForWidth(width: number): ResponsiveBreakpoint {
  if (width >= 1200) return 'expanded';
  if (width >= 900) return 'standard';
  if (width >= 600) return 'compact';
  if (width >= 400) return 'mobile';
  return 'minimal';
}

/**
 * Computes the optimal toolbar layout allocating items between the main bar and overflow dropdown
 * based on measured available width and command priorities (Document 07)
 */
export function calculateToolbarLayout(
  availableWidth: number,
  commands: ResponsiveCommandMetadata[],
  overflowButtonWidth = 44,
  padding = 16
): LayoutPlan {
  const breakpoint = getBreakpointForWidth(availableWidth);
  const isMobileMode = breakpoint === 'mobile' || breakpoint === 'minimal';

  const effectiveWidth = Math.max(0, availableWidth - padding);

  // In minimal mobile mode, top toolbar only has essential quick actions; rest in mobile sheet
  if (isMobileMode) {
    const topActions = commands
      .filter((c) => c.priority <= 3)
      .slice(0, 4)
      .map((c) => c.id);

    const overflow = commands
      .filter((c) => !topActions.includes(c.id))
      .map((c) => c.id);

    return {
      breakpoint,
      availableWidth,
      visibleCommandIds: topActions,
      overflowCommandIds: overflow,
      isMobileMode: true
    };
  }

  // Sort commands by priority (lower priority number = more important)
  const sorted = [...commands].sort((a, b) => a.priority - b.priority);

  let currentWidth = 0;
  const visible: string[] = [];
  const overflow: string[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const cmd = sorted[i];
    const willNeedOverflow = i < sorted.length - 1;
    const reservedWidth = willNeedOverflow ? overflowButtonWidth : 0;

    if (currentWidth + cmd.estimatedWidth + reservedWidth <= effectiveWidth) {
      visible.push(cmd.id);
      currentWidth += cmd.estimatedWidth;
    } else {
      // Command does not fit; move this and all remaining commands to overflow
      for (let j = i; j < sorted.length; j++) {
        overflow.push(sorted[j].id);
      }
      break;
    }
  }

  return {
    breakpoint,
    availableWidth,
    visibleCommandIds: visible,
    overflowCommandIds: overflow,
    isMobileMode: false
  };
}
