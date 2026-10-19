import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Building2, ChevronDown, Check, Globe, DoorOpen, MapPin } from 'lucide-react';
import { colors, radius, shadows, typography } from '../../tokens.js';
export const ContextSwitcher = ({ currentContext, availableSites, onSelectContext, allowAllSitesRollup = true, }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('SITE');
    // Available gates and zones for currently selected site
    const currentSiteOption = availableSites.find((s) => s.siteId === currentContext.siteId) || availableSites[0];
    const siteGates = [
        { gateId: 'GATE-01', gateName: 'North Main Gate (Passenger)' },
        { gateId: 'GATE-02', gateName: 'Commercial Logistics Gate (Freight)' },
        { gateId: 'GATE-03', gateName: 'Contractor & Maintenance Gate' },
    ];
    const siteZones = [
        { zoneId: 'ZONE-A', zoneName: 'Administrative Lobby & Visitor Center' },
        { zoneId: 'ZONE-WH', zoneName: 'Raw Materials Bay & Warehouse' },
        { zoneId: 'ZONE-HAZ', zoneName: 'Chemical Tank Farm (Restricted Zone)' },
        { zoneId: 'ZONE-PROD', zoneName: 'Main Production Line 1 & 2' },
    ];
    return (_jsxs("div", { style: { position: 'relative' }, className: "vms-context-switcher", children: [_jsxs("button", { type: "button", "aria-label": "Switch site and organization context", onClick: () => setIsOpen(!isOpen), style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    borderRadius: radius.md,
                    backgroundColor: colors.slate[800],
                    border: `1px solid ${colors.slate[700]}`,
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: typography.fontSize.xs.size,
                    transition: 'all 120ms ease',
                    outline: 'none',
                }, children: [_jsx(Building2, { size: 14, color: colors.primary[500] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', lineHeight: '1.2' }, children: [_jsx("span", { style: { fontSize: '10px', color: colors.slate[400], textTransform: 'uppercase', letterSpacing: '0.04em' }, children: currentContext.organizationName }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx("strong", { style: { fontSize: typography.fontSize.xs.size, color: '#ffffff' }, children: currentContext.isAllSites ? 'All Sites (Enterprise Roll-up)' : currentContext.siteName }), currentContext.gateName && !currentContext.isAllSites && (_jsxs("span", { style: { fontSize: '10px', color: colors.primary[500] }, children: ["\u2022 ", currentContext.gateName] }))] })] }), _jsx(ChevronDown, { size: 14, color: colors.slate[400] })] }), isOpen && (_jsxs(_Fragment, { children: [_jsx("div", { "aria-hidden": "true", onClick: () => setIsOpen(false), style: { position: 'fixed', inset: 0, zIndex: 900 } }), _jsxs("div", { style: {
                            position: 'absolute',
                            left: 0,
                            top: '100%',
                            marginTop: '6px',
                            width: '340px',
                            backgroundColor: '#ffffff',
                            borderRadius: radius.md,
                            boxShadow: shadows.modal,
                            border: `1px solid ${colors.slate[200]}`,
                            zIndex: 901,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }, children: [_jsxs("div", { style: {
                                    padding: '10px 14px',
                                    borderBottom: `1px solid ${colors.slate[200]}`,
                                    backgroundColor: colors.slate[900],
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(Building2, { size: 16, color: colors.primary[500] }), _jsxs("div", { children: [_jsx("span", { style: { fontSize: '10px', color: colors.slate[400], textTransform: 'uppercase' }, children: "Organization" }), _jsx("div", { style: { fontSize: typography.fontSize.xs.size, fontWeight: 700 }, children: currentContext.organizationName })] })] }), _jsx("span", { style: { fontSize: '10px', padding: '1px 5px', borderRadius: radius.sm, backgroundColor: colors.slate[800], color: colors.slate[300] }, children: "ISO 27001" })] }), _jsx("div", { style: {
                                    display: 'flex',
                                    borderBottom: `1px solid ${colors.slate[200]}`,
                                    backgroundColor: colors.slate[50],
                                }, children: ['SITE', 'GATE', 'ZONE'].map((tab) => {
                                    const isActive = activeTab === tab;
                                    return (_jsx("button", { type: "button", onClick: () => setActiveTab(tab), style: {
                                            flex: 1,
                                            padding: '8px',
                                            border: 'none',
                                            borderBottom: isActive ? `2px solid ${colors.primary[600]}` : '2px solid transparent',
                                            backgroundColor: isActive ? '#ffffff' : 'transparent',
                                            color: isActive ? colors.primary[700] : colors.slate[600],
                                            fontSize: '11px',
                                            fontWeight: isActive ? 700 : 500,
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                        }, children: tab === 'SITE' ? '1. Operating Site' : tab === 'GATE' ? '2. Terminal Gate' : '3. Facility Zone' }, tab));
                                }) }), activeTab === 'SITE' && (_jsxs("div", { style: { maxHeight: '280px', overflowY: 'auto', padding: '6px' }, children: [allowAllSitesRollup && (_jsxs("div", { onClick: () => {
                                            onSelectContext({
                                                organizationId: currentContext.organizationId,
                                                organizationName: currentContext.organizationName,
                                                siteId: 'ALL',
                                                siteName: 'All Sites (Enterprise Roll-up)',
                                                isAllSites: true,
                                            });
                                            setIsOpen(false);
                                        }, style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '8px 10px',
                                            borderRadius: radius.sm,
                                            backgroundColor: currentContext.isAllSites ? colors.primary[50] : 'transparent',
                                            cursor: 'pointer',
                                            fontSize: typography.fontSize.xs.size,
                                            color: currentContext.isAllSites ? colors.primary[800] : colors.slate[800],
                                            fontWeight: currentContext.isAllSites ? 600 : 500,
                                        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(Globe, { size: 14, color: colors.primary[600] }), _jsx("span", { children: "All Sites (Enterprise Roll-up)" })] }), currentContext.isAllSites && _jsx(Check, { size: 14, color: colors.primary[600] })] })), availableSites.map((site) => {
                                        const isSelected = !currentContext.isAllSites && currentContext.siteId === site.siteId;
                                        return (_jsxs("div", { onClick: () => {
                                                onSelectContext({
                                                    ...site,
                                                    gateId: site.gateId || 'GATE-01',
                                                    gateName: site.gateName || 'North Main Gate',
                                                    zoneId: site.zoneId || 'ZONE-A',
                                                    zoneName: site.zoneName || 'Administrative Lobby',
                                                    isAllSites: false,
                                                });
                                                setActiveTab('GATE');
                                            }, style: {
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '8px 10px',
                                                borderRadius: radius.sm,
                                                backgroundColor: isSelected ? colors.primary[50] : 'transparent',
                                                cursor: 'pointer',
                                                fontSize: typography.fontSize.xs.size,
                                                color: isSelected ? colors.primary[800] : colors.slate[800],
                                                fontWeight: isSelected ? 600 : 500,
                                            }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column' }, children: [_jsx("span", { children: site.siteName }), _jsx("span", { style: { fontSize: '10px', color: colors.slate[500] }, children: site.siteId })] }), isSelected && _jsx(Check, { size: 14, color: colors.primary[600] })] }, site.siteId));
                                    })] })), activeTab === 'GATE' && (_jsxs("div", { style: { maxHeight: '280px', overflowY: 'auto', padding: '6px' }, children: [_jsxs("div", { style: { padding: '6px 10px', fontSize: '10px', color: colors.slate[500] }, children: ["Select operational lane or cabin gate for ", _jsx("strong", { children: currentContext.siteName }), ":"] }), siteGates.map((gate) => {
                                        const isSelected = currentContext.gateId === gate.gateId;
                                        return (_jsxs("div", { onClick: () => {
                                                onSelectContext({
                                                    ...currentContext,
                                                    gateId: gate.gateId,
                                                    gateName: gate.gateName,
                                                    isAllSites: false,
                                                });
                                                setActiveTab('ZONE');
                                            }, style: {
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '8px 10px',
                                                borderRadius: radius.sm,
                                                backgroundColor: isSelected ? colors.primary[50] : 'transparent',
                                                cursor: 'pointer',
                                                fontSize: typography.fontSize.xs.size,
                                                color: isSelected ? colors.primary[800] : colors.slate[800],
                                                fontWeight: isSelected ? 600 : 500,
                                            }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(DoorOpen, { size: 14, color: colors.primary[600] }), _jsx("span", { children: gate.gateName })] }), isSelected && _jsx(Check, { size: 14, color: colors.primary[600] })] }, gate.gateId));
                                    })] })), activeTab === 'ZONE' && (_jsxs("div", { style: { maxHeight: '280px', overflowY: 'auto', padding: '6px' }, children: [_jsxs("div", { style: { padding: '6px 10px', fontSize: '10px', color: colors.slate[500] }, children: ["Select authorized zone context inside ", _jsx("strong", { children: currentContext.siteName }), ":"] }), siteZones.map((zone) => {
                                        const isSelected = currentContext.zoneId === zone.zoneId;
                                        return (_jsxs("div", { onClick: () => {
                                                onSelectContext({
                                                    ...currentContext,
                                                    zoneId: zone.zoneId,
                                                    zoneName: zone.zoneName,
                                                    isAllSites: false,
                                                });
                                                setIsOpen(false);
                                            }, style: {
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '8px 10px',
                                                borderRadius: radius.sm,
                                                backgroundColor: isSelected ? colors.primary[50] : 'transparent',
                                                cursor: 'pointer',
                                                fontSize: typography.fontSize.xs.size,
                                                color: isSelected ? colors.primary[800] : colors.slate[800],
                                                fontWeight: isSelected ? 600 : 500,
                                            }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(MapPin, { size: 14, color: colors.primary[600] }), _jsx("span", { children: zone.zoneName })] }), isSelected && _jsx(Check, { size: 14, color: colors.primary[600] })] }, zone.zoneId));
                                    })] })), _jsxs("div", { style: {
                                    padding: '8px 12px',
                                    borderTop: `1px solid ${colors.slate[200]}`,
                                    backgroundColor: colors.slate[50],
                                    fontSize: '11px',
                                    color: colors.slate[500],
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                }, children: [_jsxs("span", { children: ["Current: ", _jsx("strong", { children: currentContext.gateName || 'Main Gate' })] }), _jsx("span", { children: currentContext.zoneName || 'Lobby' })] })] })] }))] }));
};
