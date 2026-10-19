import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { colors, radius, typography } from '../../tokens.js';
export const DateTimePicker = ({ label, value = '', onChange, disabled = false, isRequired = false, minDate, maxDate, error, helperText, showPresets = true, style, }) => {
    // Parse date and time portions
    const [datePart, timePart] = value.includes('T') ? value.split('T') : [value, '09:00'];
    const handleDateChange = (newDate) => {
        onChange(`${newDate}T${timePart || '09:00'}`);
    };
    const handleTimeChange = (newTime) => {
        const today = new Date().toISOString().split('T')[0];
        onChange(`${datePart || today}T${newTime}`);
    };
    const setPreset = (hoursOffset) => {
        const now = new Date();
        now.setHours(now.getHours() + hoursOffset);
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        onChange(`${dateStr}T${timeStr}`);
    };
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', ...style }, className: "vms-datetime-picker", children: [label && (_jsxs("label", { style: { fontSize: typography.fontSize.xs.size, fontWeight: 600, color: colors.slate[700] }, children: [label, " ", isRequired && _jsx("span", { style: { color: colors.status.danger.solid }, children: "*" })] })), _jsxs("div", { style: { display: 'flex', gap: '8px', alignItems: 'center' }, children: [_jsx("div", { style: { position: 'relative', flex: 2 }, children: _jsx("input", { type: "date", value: datePart || '', min: minDate, max: maxDate, disabled: disabled, onChange: (e) => handleDateChange(e.target.value), style: {
                                width: '100%',
                                height: '36px',
                                padding: '0 8px',
                                backgroundColor: disabled ? colors.slate[100] : '#ffffff',
                                border: `1px solid ${error ? colors.status.danger.solid : colors.slate[300]}`,
                                borderRadius: radius.md,
                                fontSize: typography.fontSize.sm.size,
                                color: colors.slate[900],
                                fontFamily: typography.fontFamily.sans,
                                outline: 'none',
                                boxSizing: 'border-box',
                            } }) }), _jsx("div", { style: { position: 'relative', flex: 1.2 }, children: _jsx("input", { type: "time", value: timePart || '', disabled: disabled, onChange: (e) => handleTimeChange(e.target.value), style: {
                                width: '100%',
                                height: '36px',
                                padding: '0 8px',
                                backgroundColor: disabled ? colors.slate[100] : '#ffffff',
                                border: `1px solid ${error ? colors.status.danger.solid : colors.slate[300]}`,
                                borderRadius: radius.md,
                                fontSize: typography.fontSize.sm.size,
                                color: colors.slate[900],
                                fontFamily: typography.fontFamily.sans,
                                outline: 'none',
                                boxSizing: 'border-box',
                            } }) })] }), showPresets && !disabled && (_jsxs("div", { style: { display: 'flex', gap: '6px', marginTop: '2px' }, children: [_jsx("button", { type: "button", onClick: () => setPreset(0), style: {
                            padding: '2px 6px',
                            backgroundColor: colors.slate[100],
                            border: `1px solid ${colors.slate[200]}`,
                            borderRadius: radius.sm,
                            fontSize: '10px',
                            color: colors.slate[600],
                            cursor: 'pointer',
                        }, children: "Now" }), _jsx("button", { type: "button", onClick: () => setPreset(4), style: {
                            padding: '2px 6px',
                            backgroundColor: colors.slate[100],
                            border: `1px solid ${colors.slate[200]}`,
                            borderRadius: radius.sm,
                            fontSize: '10px',
                            color: colors.slate[600],
                            cursor: 'pointer',
                        }, children: "+4h (Shift End)" }), _jsx("button", { type: "button", onClick: () => {
                            const tmrw = new Date();
                            tmrw.setDate(tmrw.getDate() + 1);
                            const dateStr = tmrw.toISOString().split('T')[0];
                            onChange(`${dateStr}T09:00`);
                        }, style: {
                            padding: '2px 6px',
                            backgroundColor: colors.slate[100],
                            border: `1px solid ${colors.slate[200]}`,
                            borderRadius: radius.sm,
                            fontSize: '10px',
                            color: colors.slate[600],
                            cursor: 'pointer',
                        }, children: "Tomorrow 09:00" })] })), error && _jsx("span", { style: { fontSize: '11px', color: colors.status.danger.solid }, children: error }), helperText && !error && _jsx("span", { style: { fontSize: '11px', color: colors.slate[500] }, children: helperText })] }));
};
