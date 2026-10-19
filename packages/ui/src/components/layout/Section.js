import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { colors, typography } from '../../tokens.js';
export const Section = ({ title, description, action, children, divider = true, }) => {
    return (_jsxs("section", { style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            paddingBottom: divider ? '20px' : 0,
            marginBottom: divider ? '20px' : 0,
            borderBottom: divider ? `1px solid ${colors.slate[200]}` : 'none',
        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px' }, children: [_jsx("h2", { style: {
                                    margin: 0,
                                    fontSize: typography.fontSize.lg.size,
                                    fontWeight: typography.fontWeight.bold,
                                    color: colors.slate[900],
                                }, children: title }), description && (_jsx("p", { style: {
                                    margin: 0,
                                    fontSize: typography.fontSize.sm.size,
                                    color: colors.slate[600],
                                }, children: description }))] }), action && _jsx("div", { children: action })] }), _jsx("div", { style: { width: '100%' }, children: children })] }));
};
