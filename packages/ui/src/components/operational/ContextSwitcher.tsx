import React, { useState } from 'react';
import { Building2, ChevronDown, Check, Globe, Shield, DoorOpen, MapPin } from 'lucide-react';
import { colors, radius, shadows, typography } from '../../tokens.js';

export interface SiteContextOption {
  organizationId: string;
  organizationName: string;
  siteId: string;
  siteName: string;
  gateId?: string;
  gateName?: string;
  zoneId?: string;
  zoneName?: string;
  isAllSites?: boolean;
}

export interface ContextSwitcherProps {
  currentContext: SiteContextOption;
  availableSites: SiteContextOption[];
  onSelectContext: (selected: SiteContextOption) => void;
  allowAllSitesRollup?: boolean;
}

export const ContextSwitcher: React.FC<ContextSwitcherProps> = ({
  currentContext,
  availableSites,
  onSelectContext,
  allowAllSitesRollup = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'SITE' | 'GATE' | 'ZONE'>('SITE');

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

  return (
    <div style={{ position: 'relative' }} className="vms-context-switcher">
      {/* Current selection pill button */}
      <button
        type="button"
        aria-label="Switch site and organization context"
        onClick={() => setIsOpen(!isOpen)}
        style={{
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
        }}
      >
        <Building2 size={14} color={colors.primary[500]} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', lineHeight: '1.2' }}>
          <span style={{ fontSize: '10px', color: colors.slate[400], textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {currentContext.organizationName}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <strong style={{ fontSize: typography.fontSize.xs.size, color: '#ffffff' }}>
              {currentContext.isAllSites ? 'All Sites (Enterprise Roll-up)' : currentContext.siteName}
            </strong>
            {currentContext.gateName && !currentContext.isAllSites && (
              <span style={{ fontSize: '10px', color: colors.primary[500] }}>
                • {currentContext.gateName}
              </span>
            )}
          </div>
        </div>
        <ChevronDown size={14} color={colors.slate[400]} />
      </button>

      {/* Popover Dropdown (Hierarchical Org -> Site -> Gate -> Zone) */}
      {isOpen && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setIsOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 900 }}
          />

          <div
            style={{
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
            }}
          >
            {/* Header: Organization Context */}
            <div
              style={{
                padding: '10px 14px',
                borderBottom: `1px solid ${colors.slate[200]}`,
                backgroundColor: colors.slate[900],
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={16} color={colors.primary[500]} />
                <div>
                  <span style={{ fontSize: '10px', color: colors.slate[400], textTransform: 'uppercase' }}>Organization</span>
                  <div style={{ fontSize: typography.fontSize.xs.size, fontWeight: 700 }}>{currentContext.organizationName}</div>
                </div>
              </div>
              <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: radius.sm, backgroundColor: colors.slate[800], color: colors.slate[300] }}>
                ISO 27001
              </span>
            </div>

            {/* Selector Tabs: Site -> Gate -> Zone (Section 7) */}
            <div
              style={{
                display: 'flex',
                borderBottom: `1px solid ${colors.slate[200]}`,
                backgroundColor: colors.slate[50],
              }}
            >
              {(['SITE', 'GATE', 'ZONE'] as const).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    style={{
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
                    }}
                  >
                    {tab === 'SITE' ? '1. Operating Site' : tab === 'GATE' ? '2. Terminal Gate' : '3. Facility Zone'}
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Sites Selection */}
            {activeTab === 'SITE' && (
              <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '6px' }}>
                {allowAllSitesRollup && (
                  <div
                    onClick={() => {
                      onSelectContext({
                        organizationId: currentContext.organizationId,
                        organizationName: currentContext.organizationName,
                        siteId: 'ALL',
                        siteName: 'All Sites (Enterprise Roll-up)',
                        isAllSites: true,
                      });
                      setIsOpen(false);
                    }}
                    style={{
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
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Globe size={14} color={colors.primary[600]} />
                      <span>All Sites (Enterprise Roll-up)</span>
                    </div>
                    {currentContext.isAllSites && <Check size={14} color={colors.primary[600]} />}
                  </div>
                )}

                {availableSites.map((site) => {
                  const isSelected = !currentContext.isAllSites && currentContext.siteId === site.siteId;

                  return (
                    <div
                      key={site.siteId}
                      onClick={() => {
                        onSelectContext({
                          ...site,
                          gateId: site.gateId || 'GATE-01',
                          gateName: site.gateName || 'North Main Gate',
                          zoneId: site.zoneId || 'ZONE-A',
                          zoneName: site.zoneName || 'Administrative Lobby',
                          isAllSites: false,
                        });
                        setActiveTab('GATE');
                      }}
                      style={{
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
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{site.siteName}</span>
                        <span style={{ fontSize: '10px', color: colors.slate[500] }}>
                          {site.siteId}
                        </span>
                      </div>
                      {isSelected && <Check size={14} color={colors.primary[600]} />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 2: Gate Selection */}
            {activeTab === 'GATE' && (
              <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '6px' }}>
                <div style={{ padding: '6px 10px', fontSize: '10px', color: colors.slate[500] }}>
                  Select operational lane or cabin gate for <strong>{currentContext.siteName}</strong>:
                </div>
                {siteGates.map((gate) => {
                  const isSelected = currentContext.gateId === gate.gateId;
                  return (
                    <div
                      key={gate.gateId}
                      onClick={() => {
                        onSelectContext({
                          ...currentContext,
                          gateId: gate.gateId,
                          gateName: gate.gateName,
                          isAllSites: false,
                        });
                        setActiveTab('ZONE');
                      }}
                      style={{
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
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DoorOpen size={14} color={colors.primary[600]} />
                        <span>{gate.gateName}</span>
                      </div>
                      {isSelected && <Check size={14} color={colors.primary[600]} />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 3: Zone Selection */}
            {activeTab === 'ZONE' && (
              <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '6px' }}>
                <div style={{ padding: '6px 10px', fontSize: '10px', color: colors.slate[500] }}>
                  Select authorized zone context inside <strong>{currentContext.siteName}</strong>:
                </div>
                {siteZones.map((zone) => {
                  const isSelected = currentContext.zoneId === zone.zoneId;
                  return (
                    <div
                      key={zone.zoneId}
                      onClick={() => {
                        onSelectContext({
                          ...currentContext,
                          zoneId: zone.zoneId,
                          zoneName: zone.zoneName,
                          isAllSites: false,
                        });
                        setIsOpen(false);
                      }}
                      style={{
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
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={14} color={colors.primary[600]} />
                        <span>{zone.zoneName}</span>
                      </div>
                      {isSelected && <Check size={14} color={colors.primary[600]} />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer Summary */}
            <div
              style={{
                padding: '8px 12px',
                borderTop: `1px solid ${colors.slate[200]}`,
                backgroundColor: colors.slate[50],
                fontSize: '11px',
                color: colors.slate[500],
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>Current: <strong>{currentContext.gateName || 'Main Gate'}</strong></span>
              <span>{currentContext.zoneName || 'Lobby'}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
