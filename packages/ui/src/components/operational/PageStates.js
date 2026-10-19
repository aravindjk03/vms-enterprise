import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Loader2, Inbox, ShieldAlert, AlertTriangle, ArrowLeft, SearchX, WifiOff, Clock, Lock, ServerCrash, RefreshCw } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
import { Button } from '../foundation/Button.js';
// 1. Loading State
export const LoadingStateView = ({ message = 'Loading operational telemetry and records...', }) => (_jsxs("div", { style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 20px',
        gap: '12px',
        color: colors.slate[600],
    }, className: "vms-loading-state", children: [_jsx(Loader2, { size: 32, color: colors.primary[600], style: { animation: 'spin 1s linear infinite' } }), _jsx("span", { style: { fontSize: typography.fontSize.sm.size, fontWeight: 500 }, children: message })] }));
// 2. Empty State
export const EmptyStateView = ({ title = 'No Records Found', description = 'There are no active transactions or records for this site view.', actionLabel, onAction, }) => (_jsxs("div", { style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 20px',
        gap: '12px',
        textAlign: 'center',
        backgroundColor: '#ffffff',
        border: `1px solid ${colors.slate[200]}`,
        borderRadius: radius.md,
    }, className: "vms-empty-state", children: [_jsx("div", { style: {
                padding: '12px',
                borderRadius: radius.full,
                backgroundColor: colors.slate[100],
                color: colors.slate[400],
            }, children: _jsx(Inbox, { size: 32 }) }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '420px' }, children: [_jsx("h3", { style: { margin: 0, fontSize: typography.fontSize.lg.size, fontWeight: 700, color: colors.slate[900] }, children: title }), _jsx("p", { style: { margin: 0, fontSize: typography.fontSize.sm.size, color: colors.slate[600] }, children: description })] }), actionLabel && onAction && (_jsx("div", { style: { marginTop: '8px' }, children: _jsx(Button, { variant: "primary", size: "normal", onClick: onAction, children: actionLabel }) }))] }));
// 3. No Permission State
export const NoPermissionStateView = ({ requiredRoleOrCapability = 'Higher administrative or domain privileges', onGoBack, }) => (_jsxs("div", { style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 20px',
        gap: '16px',
        textAlign: 'center',
        backgroundColor: '#ffffff',
        border: `1px solid ${colors.slate[200]}`,
        borderRadius: radius.md,
    }, className: "vms-no-permission-state", children: [_jsx("div", { style: {
                padding: '12px',
                borderRadius: radius.full,
                backgroundColor: colors.status.danger.bg,
                color: colors.status.danger.solid,
            }, children: _jsx(ShieldAlert, { size: 36 }) }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '460px' }, children: [_jsx("h3", { style: { margin: 0, fontSize: typography.fontSize.lg.size, fontWeight: 700, color: colors.slate[900] }, children: "Access Restricted by Policy" }), _jsx("p", { style: { margin: 0, fontSize: typography.fontSize.sm.size, color: colors.slate[600] }, children: "You do not possess the required RBAC or ABAC capability to inspect or execute operations on this domain." }), _jsxs("div", { style: {
                        marginTop: '6px',
                        padding: '6px 12px',
                        backgroundColor: colors.slate[100],
                        borderRadius: radius.sm,
                        fontSize: '11px',
                        fontFamily: typography.fontFamily.mono,
                        color: colors.slate[700],
                    }, children: ["Required Capability: ", requiredRoleOrCapability] })] }), onGoBack && (_jsx(Button, { variant: "secondary", size: "dense", leftIcon: _jsx(ArrowLeft, { size: 14 }), onClick: onGoBack, children: "Return to Dashboard" }))] }));
// 4. Generic Error State
export const ErrorStateView = ({ errorTitle = 'System Communication Failure', errorMessage = 'An unexpected error occurred while communicating with the facility gateway.', onRetry, }) => (_jsxs("div", { style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 20px',
        gap: '14px',
        textAlign: 'center',
        backgroundColor: '#ffffff',
        border: `1px solid ${colors.status.danger.solid}`,
        borderRadius: radius.md,
    }, className: "vms-error-state", children: [_jsx("div", { style: {
                padding: '12px',
                borderRadius: radius.full,
                backgroundColor: colors.status.danger.bg,
                color: colors.status.danger.solid,
            }, children: _jsx(AlertTriangle, { size: 36 }) }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '460px' }, children: [_jsx("h3", { style: { margin: 0, fontSize: typography.fontSize.lg.size, fontWeight: 700, color: colors.slate[900] }, children: errorTitle }), _jsx("p", { style: { margin: 0, fontSize: typography.fontSize.sm.size, color: colors.slate[600] }, children: errorMessage })] }), onRetry && (_jsx(Button, { variant: "primary", size: "dense", onClick: onRetry, children: "Retry Operation" }))] }));
// 5. Not Found State
export const NotFoundStateView = ({ entityName = 'Record', searchId, onGoBack, }) => (_jsxs("div", { style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 20px',
        gap: '12px',
        textAlign: 'center',
        backgroundColor: '#ffffff',
        border: `1px solid ${colors.slate[200]}`,
        borderRadius: radius.md,
    }, className: "vms-not-found-state", children: [_jsx("div", { style: { padding: '12px', borderRadius: radius.full, backgroundColor: colors.slate[100], color: colors.slate[400] }, children: _jsx(SearchX, { size: 36 }) }), _jsxs("h3", { style: { margin: 0, fontSize: typography.fontSize.lg.size, fontWeight: 700, color: colors.slate[900] }, children: [entityName, " Not Found"] }), _jsxs("p", { style: { margin: 0, fontSize: typography.fontSize.sm.size, color: colors.slate[600], maxWidth: '420px' }, children: ["The requested identifier ", searchId ? `"${searchId}"` : '', " does not exist in the active site ledger or has expired."] }), onGoBack && (_jsx(Button, { variant: "secondary", size: "dense", leftIcon: _jsx(ArrowLeft, { size: 14 }), onClick: onGoBack, children: "Return to List" }))] }));
// 6. Validation Error State
export const ValidationErrorStateView = ({ errors, onCorrect, }) => (_jsxs("div", { style: {
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 20px',
        backgroundColor: colors.status.danger.bg,
        border: `1px solid ${colors.status.danger.border}`,
        borderRadius: radius.md,
        gap: '8px',
    }, className: "vms-validation-error-state", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', color: colors.status.danger.fg }, children: [_jsx(AlertTriangle, { size: 16 }), _jsxs("strong", { style: { fontSize: typography.fontSize.sm.size }, children: ["Please correct the following ", errors.length, " validation errors before proceeding:"] })] }), _jsx("ul", { style: { margin: '4px 0 0 20px', padding: 0, fontSize: typography.fontSize.xs.size, color: colors.status.danger.fg }, children: errors.map((err, idx) => (_jsx("li", { style: { marginBottom: '2px' }, children: err }, idx))) }), onCorrect && (_jsx("div", { style: { marginTop: '6px' }, children: _jsx(Button, { variant: "outline", size: "dense", onClick: onCorrect, children: "Review Fields" }) }))] }));
// 7. Network Error State
export const NetworkErrorStateView = ({ onRetry }) => (_jsxs("div", { style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 20px',
        gap: '12px',
        textAlign: 'center',
        backgroundColor: '#ffffff',
        border: `1px solid ${colors.slate[200]}`,
        borderRadius: radius.md,
    }, className: "vms-network-error-state", children: [_jsx("div", { style: { padding: '12px', borderRadius: radius.full, backgroundColor: colors.status.warning.bg, color: colors.status.warning.solid }, children: _jsx(WifiOff, { size: 36 }) }), _jsx("h3", { style: { margin: 0, fontSize: typography.fontSize.lg.size, fontWeight: 700, color: colors.slate[900] }, children: "Network Connection Interrupted" }), _jsx("p", { style: { margin: 0, fontSize: typography.fontSize.sm.size, color: colors.slate[600], maxWidth: '420px' }, children: "Unable to reach the central facility gateway. Check local LAN cabling or security cabin Wi-Fi." }), onRetry && (_jsx(Button, { variant: "primary", size: "dense", leftIcon: _jsx(RefreshCw, { size: 14 }), onClick: onRetry, children: "Retry Connection" }))] }));
// 8. Server Error State
export const ServerErrorStateView = ({ incidentId = 'SRV-ERR-9842', onRetry, }) => (_jsxs("div", { style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 20px',
        gap: '12px',
        textAlign: 'center',
        backgroundColor: '#ffffff',
        border: `1px solid ${colors.status.danger.border}`,
        borderRadius: radius.md,
    }, className: "vms-server-error-state", children: [_jsx("div", { style: { padding: '12px', borderRadius: radius.full, backgroundColor: colors.status.danger.bg, color: colors.status.danger.solid }, children: _jsx(ServerCrash, { size: 36 }) }), _jsx("h3", { style: { margin: 0, fontSize: typography.fontSize.lg.size, fontWeight: 700, color: colors.slate[900] }, children: "Facility Gateway Internal Error (500)" }), _jsxs("p", { style: { margin: 0, fontSize: typography.fontSize.sm.size, color: colors.slate[600], maxWidth: '420px' }, children: ["The server encountered an unexpected error. Incident tracking reference: ", _jsx("code", { style: { fontFamily: typography.fontFamily.mono }, children: incidentId }), "."] }), onRetry && (_jsx(Button, { variant: "primary", size: "dense", onClick: onRetry, children: "Retry Request" }))] }));
// 9. Offline State
export const OfflineStateView = ({ pendingTransactions = 0, onSync, }) => (_jsxs("div", { style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 20px',
        gap: '12px',
        textAlign: 'center',
        backgroundColor: colors.slate[50],
        border: `1px solid ${colors.slate[300]}`,
        borderRadius: radius.md,
    }, className: "vms-offline-state", children: [_jsx("div", { style: { padding: '10px', borderRadius: radius.full, backgroundColor: colors.slate[200], color: colors.slate[600] }, children: _jsx(WifiOff, { size: 32 }) }), _jsx("h3", { style: { margin: 0, fontSize: typography.fontSize.md.size, fontWeight: 700, color: colors.slate[900] }, children: "Operating in Offline Gate Mode" }), _jsxs("p", { style: { margin: 0, fontSize: typography.fontSize.xs.size, color: colors.slate[600], maxWidth: '380px' }, children: ["All pass scans and entry validations are caching securely to local IndexedDB. ", pendingTransactions, " transactions awaiting synchronization."] }), onSync && (_jsx(Button, { variant: "outline", size: "dense", onClick: onSync, children: "Attempt Sync Now" }))] }));
// 10. Synchronization Pending State
export const SyncPendingStateView = ({ count, onSyncAll, }) => (_jsxs("div", { style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: colors.status.warning.bg,
        border: `1px solid ${colors.status.warning.border}`,
        borderRadius: radius.md,
        gap: '12px',
    }, className: "vms-sync-pending-state", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx(Clock, { size: 18, color: colors.status.warning.solid }), _jsxs("div", { children: [_jsxs("strong", { style: { fontSize: typography.fontSize.xs.size, color: colors.status.warning.fg }, children: ["Synchronization Pending (", count, " records)"] }), _jsx("div", { style: { fontSize: '11px', color: colors.slate[600] }, children: "Local lane scans will automatically flush to the central cloud once high-speed link restores." })] })] }), onSyncAll && (_jsx(Button, { variant: "secondary", size: "dense", onClick: onSyncAll, children: "Flush Queue" }))] }));
// 11. Session Expired State
export const SessionExpiredStateView = ({ onRelogin }) => (_jsxs("div", { style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 20px',
        gap: '14px',
        textAlign: 'center',
        backgroundColor: '#ffffff',
        border: `1px solid ${colors.slate[200]}`,
        borderRadius: radius.md,
    }, className: "vms-session-expired-state", children: [_jsx("div", { style: { padding: '12px', borderRadius: radius.full, backgroundColor: colors.slate[100], color: colors.slate[600] }, children: _jsx(Lock, { size: 36 }) }), _jsx("h3", { style: { margin: 0, fontSize: typography.fontSize.lg.size, fontWeight: 700, color: colors.slate[900] }, children: "Security Session Expired" }), _jsx("p", { style: { margin: 0, fontSize: typography.fontSize.sm.size, color: colors.slate[600], maxWidth: '420px' }, children: "Your authenticated operational shift token has expired in compliance with ISO 27001 idle-timeout governance." }), onRelogin && (_jsx(Button, { variant: "primary", size: "dense", onClick: onRelogin, children: "Re-authenticate Operator" }))] }));
