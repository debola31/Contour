'use client';

import { themeQuartz } from 'ag-grid-community';

/**
 * Shared AG Grid theme for Jigged
 * Matches the MUI theme design system
 */
export const jiggedAgGridTheme = themeQuartz.withParams({
  // Background colors
  backgroundColor: 'transparent',
  oddRowBackgroundColor: 'rgba(255, 255, 255, 0.02)',
  headerBackgroundColor: 'rgba(255, 255, 255, 0.05)',

  // Text colors
  foregroundColor: '#ffffff',
  textColor: '#ffffff',
  headerTextColor: '#ffffff',

  // Borders
  borderColor: 'rgba(255, 255, 255, 0.12)',
  rowBorder: true,

  // Selection and interaction
  rowHoverColor: 'rgba(255, 255, 255, 0.04)',
  selectedRowBackgroundColor: 'rgba(70, 130, 180, 0.2)', // Steel Blue with opacity
  rangeSelectionBackgroundColor: 'rgba(70, 130, 180, 0.3)',

  // Accent color (Steel Blue - matches theme primary)
  accentColor: '#4682B4',

  // Typography (matches theme)
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: 16,

  // Spacing
  spacing: 8,
  cellHorizontalPadding: 16,

  // Row and header heights (48px+ for touch targets)
  rowHeight: 52,
  headerHeight: 56,

  // Icons
  iconSize: 20,
});
