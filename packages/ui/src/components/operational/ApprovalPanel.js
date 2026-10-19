import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, UserPlus, Clock } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
import { Button } from '../foundation/Button.js';
import { Textarea } from '../foundation/Textarea.js';
export const ApprovalPanel = ({ stages, currentStageId, canApprove = true, canDelegate = false, onApprove, onReject, onRequestChanges, onDelegate, }) => {
    const [comment, setComment] = useState('');
    const activeStage = stages.find((s) => s.stageId === currentStageId) || stages.find((s) => s.status === 'PENDING') || stages[0];
    return (_jsxs("div", { style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            padding: '16px',
            backgroundColor: '#ffffff',
            border: `1px solid ${colors.slate[200]}`,
            borderRadius: radius.md,
        }, className: "vms-approval-panel", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsx("h4", { style: { margin: 0, fontSize: typography.fontSize.md.size, fontWeight: typography.fontWeight.bold, color: colors.slate[900] }, children: "Multi-Stage Approval Workflow" }), _jsx("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[500] }, children: "Sequential SLA Governance" })] }), _jsx("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    overflowX: 'auto',
                    paddingBottom: '4px',
                }, children: stages.map((stage, sIdx) => {
                    const isApproved = stage.status === 'APPROVED';
                    const isPending = stage.status === 'PENDING';
                    const isRejected = stage.status === 'REJECTED';
                    const stageBg = isApproved
                        ? colors.status.success.bg
                        : isRejected
                            ? colors.status.danger.bg
                            : isPending
                                ? colors.status.warning.bg
                                : colors.slate[100];
                    const stageBorder = isApproved
                        ? colors.status.success.border
                        : isRejected
                            ? colors.status.danger.border
                            : isPending
                                ? colors.status.warning.border
                                : colors.slate[200];
                    const stageColor = isApproved
                        ? colors.status.success.fg
                        : isRejected
                            ? colors.status.danger.fg
                            : isPending
                                ? colors.status.warning.fg
                                : colors.slate[600];
                    return (_jsxs(React.Fragment, { children: [_jsxs("div", { style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '6px 12px',
                                    borderRadius: radius.md,
                                    backgroundColor: stageBg,
                                    border: `1px solid ${stageBorder}`,
                                    color: stageColor,
                                    flexShrink: 0,
                                }, children: [isApproved ? (_jsx(CheckCircle2, { size: 16, color: colors.status.success.solid })) : isRejected ? (_jsx(XCircle, { size: 16, color: colors.status.danger.solid })) : (_jsx(Clock, { size: 16, color: colors.status.warning.solid })), _jsxs("div", { style: { display: 'flex', flexDirection: 'column' }, children: [_jsx("span", { style: { fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }, children: stage.stageName }), _jsxs("span", { style: { fontSize: '10px', color: colors.slate[600] }, children: [stage.approverName, " (", stage.approverRole, ")"] }), stage.slaTimeRemaining && isPending && (_jsxs("span", { style: { fontSize: '9px', fontWeight: 600, color: colors.status.warning.solid }, children: ["SLA: ", stage.slaTimeRemaining, " left"] }))] })] }), sIdx < stages.length - 1 && (_jsx("span", { style: { color: colors.slate[300], fontSize: '14px', flexShrink: 0 }, children: "\u2192" }))] }, stage.stageId));
                }) }), canApprove && activeStage && activeStage.status === 'PENDING' && (_jsxs("div", { style: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    paddingTop: '12px',
                    borderTop: `1px solid ${colors.slate[200]}`,
                }, children: [_jsx(Textarea, { label: "Approver Decision Comments", placeholder: "Provide mandatory review observations or reason for rejection/amendment...", value: comment, onChange: (e) => setComment(e.target.value), rows: 2 }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(Button, { variant: "primary", size: "dense", leftIcon: _jsx(CheckCircle2, { size: 14 }), onClick: () => onApprove && onApprove(activeStage.stageId, comment), children: "Approve Stage" }), _jsx(Button, { variant: "danger", size: "dense", leftIcon: _jsx(XCircle, { size: 14 }), onClick: () => onReject && onReject(activeStage.stageId, comment), children: "Reject" }), _jsx(Button, { variant: "secondary", size: "dense", leftIcon: _jsx(RotateCcw, { size: 14 }), onClick: () => onRequestChanges && onRequestChanges(activeStage.stageId, comment), children: "Request Changes" })] }), canDelegate && onDelegate && (_jsx(Button, { variant: "outline", size: "dense", leftIcon: _jsx(UserPlus, { size: 14 }), onClick: () => onDelegate(activeStage.stageId, 'DELEGATE_USER'), children: "Delegate" }))] })] }))] }));
};
