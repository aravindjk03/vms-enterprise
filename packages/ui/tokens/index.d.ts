/**
 * VMS Enterprise: Industrial Enterprise Design System Tokens
 * Engineered for high-density industrial control rooms, security cabins, and enterprise consoles.
 */
export declare const typography: {
    readonly fontFamily: {
        readonly sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        readonly mono: 'JetBrains Mono, "Fira Code", monospace';
    };
    readonly fontSize: {
        readonly micro: {
            readonly size: '10px';
            readonly lineHeight: '14px';
            readonly letterSpacing: '0.05em';
            readonly textTransform: 'uppercase';
        };
        readonly xs: {
            readonly size: '12px';
            readonly lineHeight: '16px';
        };
        readonly sm: {
            readonly size: '13px';
            readonly lineHeight: '18px';
        };
        readonly base: {
            readonly size: '14px';
            readonly lineHeight: '20px';
        };
        readonly md: {
            readonly size: '15px';
            readonly lineHeight: '22px';
        };
        readonly lg: {
            readonly size: '18px';
            readonly lineHeight: '24px';
        };
        readonly xl: {
            readonly size: '20px';
            readonly lineHeight: '28px';
        };
        readonly '2xl': {
            readonly size: '24px';
            readonly lineHeight: '32px';
        };
        readonly '3xl': {
            readonly size: '30px';
            readonly lineHeight: '38px';
        };
    };
    readonly fontWeight: {
        readonly regular: 400;
        readonly medium: 500;
        readonly semibold: 600;
        readonly bold: 700;
        readonly extrabold: 800;
    };
};
export declare const spacing: {
    readonly baseline: '4px';
    readonly xs: '4px';
    readonly sm: '8px';
    readonly md: '12px';
    readonly lg: '16px';
    readonly xl: '20px';
    readonly '2xl': '24px';
    readonly '3xl': '32px';
    readonly '4xl': '48px';
};
export declare const radius: {
    readonly none: '0px';
    readonly sm: '2px';
    readonly md: '4px';
    readonly lg: '6px';
    readonly xl: '8px';
    readonly full: '9999px';
};
export declare const borders: {
    readonly subtle: '1px solid #e2e8f0';
    readonly strong: '1px solid #cbd5e1';
    readonly darkSubtle: '1px solid #1e293b';
    readonly focus: '2px solid #0284c7';
    readonly error: '1px solid #dc2626';
};
export declare const shadows: {
    readonly flat: 'none';
    readonly subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
    readonly card: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)';
    readonly elevated: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    readonly modal: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.1)';
};
export declare const focus: {
    readonly ringColor: '#0284c7';
    readonly ringWidth: '2px';
    readonly ringOffset: '2px';
    readonly ringStyle: 'solid';
    readonly boxShadow: '0 0 0 2px #ffffff, 0 0 0 4px #0284c7';
};
export declare const colors: {
    readonly slate: {
        readonly 50: '#f8fafc';
        readonly 100: '#f1f5f9';
        readonly 200: '#e2e8f0';
        readonly 300: '#cbd5e1';
        readonly 400: '#94a3b8';
        readonly 500: '#64748b';
        readonly 600: '#475569';
        readonly 700: '#334155';
        readonly 800: '#1e293b';
        readonly 900: '#0f172a';
        readonly 950: '#0b0f19';
    };
    readonly primary: {
        readonly 50: '#f0f9ff';
        readonly 100: '#e0f2fe';
        readonly 200: '#bae6fd';
        readonly 500: '#0ea5e9';
        readonly 600: '#0284c7';
        readonly 700: '#0369a1';
        readonly 800: '#075985';
        readonly 900: '#0c4a6e';
    };
    readonly esg: {
        readonly 50: '#ecfdf5';
        readonly 100: '#d1fae5';
        readonly 500: '#10b981';
        readonly 600: '#059669';
        readonly 700: '#047857';
    };
    readonly status: {
        readonly success: {
            readonly fg: '#15803d';
            readonly bg: '#f0fdf4';
            readonly border: '#bbf7d0';
            readonly solid: '#16a34a';
        };
        readonly warning: {
            readonly fg: '#b45309';
            readonly bg: '#fffbeb';
            readonly border: '#fde68a';
            readonly solid: '#d97706';
        };
        readonly danger: {
            readonly fg: '#b91c1c';
            readonly bg: '#fef2f2';
            readonly border: '#fecaca';
            readonly solid: '#dc2626';
        };
        readonly info: {
            readonly fg: '#1d4ed8';
            readonly bg: '#eff6ff';
            readonly border: '#bfdbfe';
            readonly solid: '#2563eb';
        };
        readonly pending: {
            readonly fg: '#c2410c';
            readonly bg: '#fff7ed';
            readonly border: '#fed7aa';
            readonly solid: '#ea580c';
        };
        readonly neutral: {
            readonly fg: '#475569';
            readonly bg: '#f8fafc';
            readonly border: '#e2e8f0';
            readonly solid: '#64748b';
        };
        readonly blocked: {
            readonly fg: '#991b1b';
            readonly bg: '#fef2f2';
            readonly border: '#f87171';
            readonly solid: '#b91c1c';
        };
        readonly expired: {
            readonly fg: '#9a3412';
            readonly bg: '#fff7ed';
            readonly border: '#ffedd5';
            readonly solid: '#c2410c';
        };
        readonly draft: {
            readonly fg: '#475569';
            readonly bg: '#f1f5f9';
            readonly border: '#cbd5e1';
            readonly solid: '#64748b';
        };
        readonly approved: {
            readonly fg: '#15803d';
            readonly bg: '#f0fdf4';
            readonly border: '#86efac';
            readonly solid: '#16a34a';
        };
        readonly rejected: {
            readonly fg: '#dc2626';
            readonly bg: '#fef2f2';
            readonly border: '#fca5a5';
            readonly solid: '#ef4444';
        };
        readonly active: {
            readonly fg: '#0369a1';
            readonly bg: '#f0f9ff';
            readonly border: '#bae6fd';
            readonly solid: '#0284c7';
        };
        readonly inactive: {
            readonly fg: '#64748b';
            readonly bg: '#f8fafc';
            readonly border: '#e2e8f0';
            readonly solid: '#94a3b8';
        };
        readonly overdue: {
            readonly fg: '#c026d3';
            readonly bg: '#fdf4ff';
            readonly border: '#f5d0fe';
            readonly solid: '#d946ef';
        };
    };
};
export declare const surfaces: {
    readonly light: {
        readonly canvas: '#f8fafc';
        readonly surface: '#ffffff';
        readonly surfaceRaised: '#ffffff';
        readonly surfaceSunken: '#f1f5f9';
        readonly border: '#e2e8f0';
        readonly borderStrong: '#cbd5e1';
        readonly textPrimary: '#0f172a';
        readonly textSecondary: '#475569';
        readonly textMuted: '#94a3b8';
    };
    readonly dark: {
        readonly canvas: '#0b0f19';
        readonly surface: '#0f172a';
        readonly surfaceRaised: '#1e293b';
        readonly surfaceSunken: '#080c14';
        readonly border: '#1e293b';
        readonly borderStrong: '#334155';
        readonly textPrimary: '#f8fafc';
        readonly textSecondary: '#94a3b8';
        readonly textMuted: '#64748b';
    };
};
export declare const overlay: {
    readonly backdrop: 'rgba(15, 23, 42, 0.6)';
    readonly dimmer: 'rgba(15, 23, 42, 0.4)';
    readonly modalBackdrop: 'rgba(11, 15, 25, 0.75)';
};
export declare const charts: {
    readonly primary: '#0284c7';
    readonly secondary: '#0ea5e9';
    readonly esg: '#059669';
    readonly warning: '#d97706';
    readonly danger: '#dc2626';
    readonly neutral: '#64748b';
    readonly series: readonly ['#0284c7', '#059669', '#d97706', '#dc2626', '#8b5cf6', '#06b6d4', '#64748b'];
};
export declare const tableTokens: {
    readonly headerHeight: '36px';
    readonly rowHeightDense: '34px';
    readonly rowHeightNormal: '42px';
    readonly headerBg: '#f8fafc';
    readonly headerText: '#475569';
    readonly rowHoverBg: '#f1f5f9';
    readonly stripeBg: '#fbfcfd';
    readonly borderColor: '#e2e8f0';
};
export declare const formTokens: {
    readonly inputHeight: '36px';
    readonly inputHeightDense: '32px';
    readonly inputBg: '#ffffff';
    readonly inputBorder: '#cbd5e1';
    readonly inputText: '#0f172a';
    readonly placeholderColor: '#94a3b8';
    readonly focusRing: '0 0 0 2px #0284c7';
    readonly errorBorder: '#dc2626';
};
export declare const buttonTokens: {
    readonly heightDense: '32px';
    readonly heightNormal: '38px';
    readonly radius: "4px";
    readonly paddingX: '14px';
    readonly fontWeight: 600;
};
export declare const badgeTokens: {
    readonly height: '22px';
    readonly paddingX: '8px';
    readonly radius: "2px";
    readonly font: {
        readonly size: '10px';
        readonly lineHeight: '14px';
        readonly letterSpacing: '0.05em';
        readonly textTransform: 'uppercase';
    };
};
export declare const alertTokens: {
    readonly radius: "4px";
    readonly padding: '12px 16px';
    readonly borderWidth: '1px';
};
export declare const navigationTokens: {
    readonly sidebarWidth: '240px';
    readonly collapsedWidth: '60px';
    readonly headerHeight: '48px';
    readonly itemHeight: '38px';
    readonly activeItemBg: '#f1f5f9';
    readonly activeItemColor: '#0284c7';
};
export declare const interactive: {
    readonly hoverTransition: 'all 120ms cubic-bezier(0, 0, 0.2, 1)';
    readonly disabledOpacity: 0.5;
    readonly cursorDisabled: 'not-allowed';
};
export declare const breakpoints: {
    readonly mobile: '640px';
    readonly tablet: '768px';
    readonly desktop: '1024px';
    readonly wide: '1280px';
    readonly ultrawide: '1536px';
};
export declare const designTokens: {
    typography: {
        readonly fontFamily: {
            readonly sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            readonly mono: 'JetBrains Mono, "Fira Code", monospace';
        };
        readonly fontSize: {
            readonly micro: {
                readonly size: '10px';
                readonly lineHeight: '14px';
                readonly letterSpacing: '0.05em';
                readonly textTransform: 'uppercase';
            };
            readonly xs: {
                readonly size: '12px';
                readonly lineHeight: '16px';
            };
            readonly sm: {
                readonly size: '13px';
                readonly lineHeight: '18px';
            };
            readonly base: {
                readonly size: '14px';
                readonly lineHeight: '20px';
            };
            readonly md: {
                readonly size: '15px';
                readonly lineHeight: '22px';
            };
            readonly lg: {
                readonly size: '18px';
                readonly lineHeight: '24px';
            };
            readonly xl: {
                readonly size: '20px';
                readonly lineHeight: '28px';
            };
            readonly '2xl': {
                readonly size: '24px';
                readonly lineHeight: '32px';
            };
            readonly '3xl': {
                readonly size: '30px';
                readonly lineHeight: '38px';
            };
        };
        readonly fontWeight: {
            readonly regular: 400;
            readonly medium: 500;
            readonly semibold: 600;
            readonly bold: 700;
            readonly extrabold: 800;
        };
    };
    spacing: {
        readonly baseline: '4px';
        readonly xs: '4px';
        readonly sm: '8px';
        readonly md: '12px';
        readonly lg: '16px';
        readonly xl: '20px';
        readonly '2xl': '24px';
        readonly '3xl': '32px';
        readonly '4xl': '48px';
    };
    radius: {
        readonly none: '0px';
        readonly sm: '2px';
        readonly md: '4px';
        readonly lg: '6px';
        readonly xl: '8px';
        readonly full: '9999px';
    };
    borders: {
        readonly subtle: '1px solid #e2e8f0';
        readonly strong: '1px solid #cbd5e1';
        readonly darkSubtle: '1px solid #1e293b';
        readonly focus: '2px solid #0284c7';
        readonly error: '1px solid #dc2626';
    };
    shadows: {
        readonly flat: 'none';
        readonly subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
        readonly card: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)';
        readonly elevated: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        readonly modal: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.1)';
    };
    focus: {
        readonly ringColor: '#0284c7';
        readonly ringWidth: '2px';
        readonly ringOffset: '2px';
        readonly ringStyle: 'solid';
        readonly boxShadow: '0 0 0 2px #ffffff, 0 0 0 4px #0284c7';
    };
    colors: {
        readonly slate: {
            readonly 50: '#f8fafc';
            readonly 100: '#f1f5f9';
            readonly 200: '#e2e8f0';
            readonly 300: '#cbd5e1';
            readonly 400: '#94a3b8';
            readonly 500: '#64748b';
            readonly 600: '#475569';
            readonly 700: '#334155';
            readonly 800: '#1e293b';
            readonly 900: '#0f172a';
            readonly 950: '#0b0f19';
        };
        readonly primary: {
            readonly 50: '#f0f9ff';
            readonly 100: '#e0f2fe';
            readonly 200: '#bae6fd';
            readonly 500: '#0ea5e9';
            readonly 600: '#0284c7';
            readonly 700: '#0369a1';
            readonly 800: '#075985';
            readonly 900: '#0c4a6e';
        };
        readonly esg: {
            readonly 50: '#ecfdf5';
            readonly 100: '#d1fae5';
            readonly 500: '#10b981';
            readonly 600: '#059669';
            readonly 700: '#047857';
        };
        readonly status: {
            readonly success: {
                readonly fg: '#15803d';
                readonly bg: '#f0fdf4';
                readonly border: '#bbf7d0';
                readonly solid: '#16a34a';
            };
            readonly warning: {
                readonly fg: '#b45309';
                readonly bg: '#fffbeb';
                readonly border: '#fde68a';
                readonly solid: '#d97706';
            };
            readonly danger: {
                readonly fg: '#b91c1c';
                readonly bg: '#fef2f2';
                readonly border: '#fecaca';
                readonly solid: '#dc2626';
            };
            readonly info: {
                readonly fg: '#1d4ed8';
                readonly bg: '#eff6ff';
                readonly border: '#bfdbfe';
                readonly solid: '#2563eb';
            };
            readonly pending: {
                readonly fg: '#c2410c';
                readonly bg: '#fff7ed';
                readonly border: '#fed7aa';
                readonly solid: '#ea580c';
            };
            readonly neutral: {
                readonly fg: '#475569';
                readonly bg: '#f8fafc';
                readonly border: '#e2e8f0';
                readonly solid: '#64748b';
            };
            readonly blocked: {
                readonly fg: '#991b1b';
                readonly bg: '#fef2f2';
                readonly border: '#f87171';
                readonly solid: '#b91c1c';
            };
            readonly expired: {
                readonly fg: '#9a3412';
                readonly bg: '#fff7ed';
                readonly border: '#ffedd5';
                readonly solid: '#c2410c';
            };
            readonly draft: {
                readonly fg: '#475569';
                readonly bg: '#f1f5f9';
                readonly border: '#cbd5e1';
                readonly solid: '#64748b';
            };
            readonly approved: {
                readonly fg: '#15803d';
                readonly bg: '#f0fdf4';
                readonly border: '#86efac';
                readonly solid: '#16a34a';
            };
            readonly rejected: {
                readonly fg: '#dc2626';
                readonly bg: '#fef2f2';
                readonly border: '#fca5a5';
                readonly solid: '#ef4444';
            };
            readonly active: {
                readonly fg: '#0369a1';
                readonly bg: '#f0f9ff';
                readonly border: '#bae6fd';
                readonly solid: '#0284c7';
            };
            readonly inactive: {
                readonly fg: '#64748b';
                readonly bg: '#f8fafc';
                readonly border: '#e2e8f0';
                readonly solid: '#94a3b8';
            };
            readonly overdue: {
                readonly fg: '#c026d3';
                readonly bg: '#fdf4ff';
                readonly border: '#f5d0fe';
                readonly solid: '#d946ef';
            };
        };
    };
    surfaces: {
        readonly light: {
            readonly canvas: '#f8fafc';
            readonly surface: '#ffffff';
            readonly surfaceRaised: '#ffffff';
            readonly surfaceSunken: '#f1f5f9';
            readonly border: '#e2e8f0';
            readonly borderStrong: '#cbd5e1';
            readonly textPrimary: '#0f172a';
            readonly textSecondary: '#475569';
            readonly textMuted: '#94a3b8';
        };
        readonly dark: {
            readonly canvas: '#0b0f19';
            readonly surface: '#0f172a';
            readonly surfaceRaised: '#1e293b';
            readonly surfaceSunken: '#080c14';
            readonly border: '#1e293b';
            readonly borderStrong: '#334155';
            readonly textPrimary: '#f8fafc';
            readonly textSecondary: '#94a3b8';
            readonly textMuted: '#64748b';
        };
    };
    overlay: {
        readonly backdrop: 'rgba(15, 23, 42, 0.6)';
        readonly dimmer: 'rgba(15, 23, 42, 0.4)';
        readonly modalBackdrop: 'rgba(11, 15, 25, 0.75)';
    };
    charts: {
        readonly primary: '#0284c7';
        readonly secondary: '#0ea5e9';
        readonly esg: '#059669';
        readonly warning: '#d97706';
        readonly danger: '#dc2626';
        readonly neutral: '#64748b';
        readonly series: readonly ['#0284c7', '#059669', '#d97706', '#dc2626', '#8b5cf6', '#06b6d4', '#64748b'];
    };
    tableTokens: {
        readonly headerHeight: '36px';
        readonly rowHeightDense: '34px';
        readonly rowHeightNormal: '42px';
        readonly headerBg: '#f8fafc';
        readonly headerText: '#475569';
        readonly rowHoverBg: '#f1f5f9';
        readonly stripeBg: '#fbfcfd';
        readonly borderColor: '#e2e8f0';
    };
    formTokens: {
        readonly inputHeight: '36px';
        readonly inputHeightDense: '32px';
        readonly inputBg: '#ffffff';
        readonly inputBorder: '#cbd5e1';
        readonly inputText: '#0f172a';
        readonly placeholderColor: '#94a3b8';
        readonly focusRing: '0 0 0 2px #0284c7';
        readonly errorBorder: '#dc2626';
    };
    buttonTokens: {
        readonly heightDense: '32px';
        readonly heightNormal: '38px';
        readonly radius: "4px";
        readonly paddingX: '14px';
        readonly fontWeight: 600;
    };
    badgeTokens: {
        readonly height: '22px';
        readonly paddingX: '8px';
        readonly radius: "2px";
        readonly font: {
            readonly size: '10px';
            readonly lineHeight: '14px';
            readonly letterSpacing: '0.05em';
            readonly textTransform: 'uppercase';
        };
    };
    alertTokens: {
        readonly radius: "4px";
        readonly padding: '12px 16px';
        readonly borderWidth: '1px';
    };
    navigationTokens: {
        readonly sidebarWidth: '240px';
        readonly collapsedWidth: '60px';
        readonly headerHeight: '48px';
        readonly itemHeight: '38px';
        readonly activeItemBg: '#f1f5f9';
        readonly activeItemColor: '#0284c7';
    };
    interactive: {
        readonly hoverTransition: 'all 120ms cubic-bezier(0, 0, 0.2, 1)';
        readonly disabledOpacity: 0.5;
        readonly cursorDisabled: 'not-allowed';
    };
    breakpoints: {
        readonly mobile: '640px';
        readonly tablet: '768px';
        readonly desktop: '1024px';
        readonly wide: '1280px';
        readonly ultrawide: '1536px';
    };
};
export default designTokens;
