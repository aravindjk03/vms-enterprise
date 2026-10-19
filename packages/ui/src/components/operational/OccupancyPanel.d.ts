import React from 'react';
export interface OccupancyStats {
    totalInside: number;
    maxCapacity: number;
    staffCount: number;
    contractorCount: number;
    visitorCount: number;
    driverCount: number;
    vehiclesInside: number;
    overstayCount: number;
}
export interface OccupancyPanelProps {
    stats: OccupancyStats;
    siteName: string;
}
export declare const OccupancyPanel: React.FC<OccupancyPanelProps>;
