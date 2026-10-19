import React from 'react';
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
export declare const ContextSwitcher: React.FC<ContextSwitcherProps>;
