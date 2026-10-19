import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { colors } from '../../tokens.js';
export const SplitView = ({ leftPane, rightPane, leftWidth = '50%', }) => {
    return (_jsxs("div", { style: {
            display: 'flex',
            width: '100%',
            height: '100%',
            minHeight: '600px',
            border: `1px solid ${colors.slate[200]}`,
            borderRadius: '6px',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
        }, className: "vms-split-view", children: [_jsx("div", { style: {
                    width: leftWidth,
                    borderRight: `1px solid ${colors.slate[200]}`,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                }, className: "vms-split-left", children: leftPane }), _jsx("div", { style: {
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: colors.slate[50],
                }, className: "vms-split-right", children: rightPane })] }));
};
