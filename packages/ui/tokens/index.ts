/**
 * VMS Enterprise: Industrial Enterprise Design System Tokens
 * Engineered for high-density industrial control rooms, security cabins, and enterprise consoles.
 */

export const typography = {
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'JetBrains Mono, "Fira Code", monospace',
  },
  fontSize: {
    micro: { size: '10px', lineHeight: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' },
    xs: { size: '12px', lineHeight: '16px' },
    sm: { size: '13px', lineHeight: '18px' },
    base: { size: '14px', lineHeight: '20px' },
    md: { size: '15px', lineHeight: '22px' },
    lg: { size: '18px', lineHeight: '24px' },
    xl: { size: '20px', lineHeight: '28px' },
    '2xl': { size: '24px', lineHeight: '32px' },
    '3xl': { size: '30px', lineHeight: '38px' },
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
} as const;

export const spacing = {
  baseline: '4px',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '48px',
} as const;

export const radius = {
  none: '0px',
  sm: '2px',
  md: '4px',
  lg: '6px',
  xl: '8px',
  full: '9999px',
  // Deliberately no oversized radii (no 16px/24px consumer bubbles)
} as const;

export const borders = {
  subtle: '1px solid #e2e8f0',     // Light canvas border
  strong: '1px solid #cbd5e1',     // Light strong border
  darkSubtle: '1px solid #1e293b', // Dark slate border
  focus: '2px solid #0284c7',      // Accessible focus blue
  error: '1px solid #dc2626',      // Red alert border
} as const;

export const shadows = {
  flat: 'none',
  subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  card: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)',
  elevated: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  modal: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
} as const;

export const focus = {
  ringColor: '#0284c7',
  ringWidth: '2px',
  ringOffset: '2px',
  ringStyle: 'solid',
  boxShadow: '0 0 0 2px #ffffff, 0 0 0 4px #0284c7',
} as const;

export const colors = {
  // Industrial Slate Neutrals
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#0b0f19', // Control room background
  },
  // Operational Primary Blue
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    500: '#0ea5e9',
    600: '#0284c7', // Primary high-vis action
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  // ESG & Sustainability Emerald / Teal
  esg: {
    50: '#ecfdf5',
    100: '#d1fae5',
    500: '#10b981',
    600: '#059669', // ESG action & metrics
    700: '#047857',
  },
  // Complete Semantic Status System
  status: {
    success: { fg: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', solid: '#16a34a' },
    warning: { fg: '#b45309', bg: '#fffbeb', border: '#fde68a', solid: '#d97706' },
    danger: { fg: '#b91c1c', bg: '#fef2f2', border: '#fecaca', solid: '#dc2626' },
    info: { fg: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', solid: '#2563eb' },
    pending: { fg: '#c2410c', bg: '#fff7ed', border: '#fed7aa', solid: '#ea580c' },
    neutral: { fg: '#475569', bg: '#f8fafc', border: '#e2e8f0', solid: '#64748b' },
    blocked: { fg: '#991b1b', bg: '#fef2f2', border: '#f87171', solid: '#b91c1c' },
    expired: { fg: '#9a3412', bg: '#fff7ed', border: '#ffedd5', solid: '#c2410c' },
    draft: { fg: '#475569', bg: '#f1f5f9', border: '#cbd5e1', solid: '#64748b' },
    approved: { fg: '#15803d', bg: '#f0fdf4', border: '#86efac', solid: '#16a34a' },
    rejected: { fg: '#dc2626', bg: '#fef2f2', border: '#fca5a5', solid: '#ef4444' },
    active: { fg: '#0369a1', bg: '#f0f9ff', border: '#bae6fd', solid: '#0284c7' },
    inactive: { fg: '#64748b', bg: '#f8fafc', border: '#e2e8f0', solid: '#94a3b8' },
    overdue: { fg: '#c026d3', bg: '#fdf4ff', border: '#f5d0fe', solid: '#d946ef' },
  },
} as const;

export const surfaces = {
  light: {
    canvas: '#f8fafc',
    surface: '#ffffff',
    surfaceRaised: '#ffffff',
    surfaceSunken: '#f1f5f9',
    border: '#e2e8f0',
    borderStrong: '#cbd5e1',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
  },
  dark: {
    canvas: '#0b0f19',
    surface: '#0f172a',
    surfaceRaised: '#1e293b',
    surfaceSunken: '#080c14',
    border: '#1e293b',
    borderStrong: '#334155',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
  },
} as const;

export const overlay = {
  backdrop: 'rgba(15, 23, 42, 0.6)',
  dimmer: 'rgba(15, 23, 42, 0.4)',
  modalBackdrop: 'rgba(11, 15, 25, 0.75)',
} as const;

export const charts = {
  primary: '#0284c7',
  secondary: '#0ea5e9',
  esg: '#059669',
  warning: '#d97706',
  danger: '#dc2626',
  neutral: '#64748b',
  series: ['#0284c7', '#059669', '#d97706', '#dc2626', '#8b5cf6', '#06b6d4', '#64748b'],
} as const;

export const tableTokens = {
  headerHeight: '36px',
  rowHeightDense: '34px',
  rowHeightNormal: '42px',
  headerBg: '#f8fafc',
  headerText: '#475569',
  rowHoverBg: '#f1f5f9',
  stripeBg: '#fbfcfd',
  borderColor: '#e2e8f0',
} as const;

export const formTokens = {
  inputHeight: '36px',
  inputHeightDense: '32px',
  inputBg: '#ffffff',
  inputBorder: '#cbd5e1',
  inputText: '#0f172a',
  placeholderColor: '#94a3b8',
  focusRing: '0 0 0 2px #0284c7',
  errorBorder: '#dc2626',
} as const;

export const buttonTokens = {
  heightDense: '32px',
  heightNormal: '38px',
  radius: radius.md,
  paddingX: '14px',
  fontWeight: typography.fontWeight.semibold,
} as const;

export const badgeTokens = {
  height: '22px',
  paddingX: '8px',
  radius: radius.sm,
  font: typography.fontSize.micro,
} as const;

export const alertTokens = {
  radius: radius.md,
  padding: '12px 16px',
  borderWidth: '1px',
} as const;

export const navigationTokens = {
  sidebarWidth: '240px',
  collapsedWidth: '60px',
  headerHeight: '48px',
  itemHeight: '38px',
  activeItemBg: '#f1f5f9',
  activeItemColor: '#0284c7',
} as const;

export const interactive = {
  hoverTransition: 'all 120ms cubic-bezier(0, 0, 0.2, 1)',
  disabledOpacity: 0.5,
  cursorDisabled: 'not-allowed',
} as const;

export const breakpoints = {
  mobile: '640px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
  ultrawide: '1536px',
} as const;

export const designTokens = {
  typography,
  spacing,
  radius,
  borders,
  shadows,
  focus,
  colors,
  surfaces,
  overlay,
  charts,
  tableTokens,
  formTokens,
  buttonTokens,
  badgeTokens,
  alertTokens,
  navigationTokens,
  interactive,
  breakpoints,
};

export default designTokens;
