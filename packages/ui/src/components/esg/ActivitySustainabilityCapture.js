import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Leaf, Info, Compass } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
import { Input } from '../foundation/Input.js';
import { Select } from '../foundation/Select.js';
export const ActivitySustainabilityCapture = ({ data, onChange, disabled = false, }) => {
    const handleChange = (field, val) => {
        onChange({
            ...data,
            [field]: val,
        });
    };
    const modeOptions = [
        { value: 'CAR', label: 'Car / Passenger Auto' },
        { value: 'TWO_WHEELER', label: 'Two-Wheeler (Motorcycle / Scooter)' },
        { value: 'BUS', label: 'Bus (Shuttle / Public)' },
        { value: 'TRAIN', label: 'Train / Rail' },
        { value: 'FLIGHT', label: 'Aviation / Commercial Flight' },
        { value: 'TAXI_CAB', label: 'Taxi / Ride-Hailing' },
        { value: 'VAN', label: 'Van / Light Utility Vehicle' },
        { value: 'TRUCK', label: 'Truck / Heavy Commercial Vehicle' },
        { value: 'WALKING', label: 'Active Mobility (Walking / Bicycle)' },
        { value: 'OTHER', label: 'Other Mobility Mode' },
    ];
    const ownershipOptions = [
        { value: 'PERSONAL', label: 'Personal / Privately Owned' },
        { value: 'COMPANY', label: 'Company Fleet / Corporate Vehicle' },
        { value: 'HIRED', label: 'Hired / Commercial Rental' },
        { value: 'SUPPLIER', label: 'Supplier / Vendor Vehicle' },
        { value: 'TRANSPORTER', label: 'Contracted Transporter' },
        { value: 'PUBLIC', label: 'Public Transit' },
        { value: 'OTHER', label: 'Other' },
    ];
    const vehicleClassOptions = [
        { value: 'SEDAN', label: 'Sedan' },
        { value: 'SUV', label: 'SUV' },
        { value: 'HATCHBACK', label: 'Hatchback' },
        { value: 'TWO_WHEELER', label: 'Two-Wheeler' },
        { value: 'MINI_BUS', label: 'Mini Bus' },
        { value: 'COACH_BUS', label: 'Coach Bus' },
        { value: 'LIGHT_COMMERCIAL_VAN', label: 'Light Commercial Van' },
        { value: 'MEDIUM_DUTY_TRUCK', label: 'Medium-Duty Truck' },
        { value: 'HEAVY_DUTY_TRUCK', label: 'Heavy-Duty Truck' },
        { value: 'TRAILER', label: 'Multi-Axle Trailer' },
        { value: 'CONTAINER_CARRIER', label: 'Container Carrier' },
        { value: 'OTHER', label: 'Other Class' },
    ];
    const fuelTypeOptions = [
        { value: 'DIESEL', label: 'Diesel' },
        { value: 'PETROL', label: 'Petrol / Gasoline' },
        { value: 'ELECTRIC', label: 'Electric Vehicle (EV)' },
        { value: 'CNG', label: 'Compressed Natural Gas (CNG)' },
        { value: 'HYBRID_PETROL', label: 'Hybrid (Petrol-Electric)' },
        { value: 'HYBRID_DIESEL', label: 'Hybrid (Diesel-Electric)' },
        { value: 'HYDROGEN', label: 'Hydrogen Fuel Cell' },
        { value: 'OTHER', label: 'Other Fuel' },
    ];
    const journeyTypeOptions = [
        { value: 'ONE_WAY', label: 'One-Way Journey' },
        { value: 'ROUND_TRIP', label: 'Round-Trip (Symmetric Return)' },
        { value: 'MULTI_STOP', label: 'Multi-Stop Route' },
        { value: 'LOCAL_CAMPUS', label: 'Local Intra-Facility Movement' },
    ];
    return (_jsxs("div", { style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            padding: '16px 18px',
            backgroundColor: '#ffffff',
            border: `1.5px solid ${colors.esg[500]}`,
            borderRadius: radius.md,
        }, className: "vms-activity-sustainability-capture", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("div", { style: {
                                    padding: '6px',
                                    borderRadius: radius.sm,
                                    backgroundColor: colors.esg[50],
                                    color: colors.esg[600],
                                    display: 'flex',
                                }, children: _jsx(Compass, { size: 18 }) }), _jsxs("div", { children: [_jsx("h4", { style: {
                                            margin: 0,
                                            fontSize: typography.fontSize.md.size,
                                            fontWeight: typography.fontWeight.bold,
                                            color: colors.slate[900],
                                        }, children: "Activity & Sustainability" }), _jsx("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[500] }, children: "Operational mobility capture linked to transaction provenance" })] })] }), _jsxs("div", { style: {
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '3px 8px',
                            borderRadius: radius.sm,
                            backgroundColor: colors.esg[50],
                            border: `1px solid ${colors.esg[500]}`,
                            color: colors.esg[700],
                            fontSize: '11px',
                            fontWeight: 600,
                        }, children: [_jsx(Leaf, { size: 12, color: colors.esg[600] }), _jsx("span", { children: "Automated ESG Traceability" })] })] }), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '14px',
                }, children: [_jsx(Select, { label: "Transport Mode", options: modeOptions, value: data.mode, disabled: disabled, onChange: (e) => handleChange('mode', e.target.value) }), _jsx(Select, { label: "Vehicle Ownership", options: ownershipOptions, value: data.ownership, disabled: disabled, onChange: (e) => handleChange('ownership', e.target.value) }), _jsx(Select, { label: "Vehicle Class", options: vehicleClassOptions, value: data.vehicleClass, disabled: disabled, onChange: (e) => handleChange('vehicleClass', e.target.value) }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px' }, children: [_jsx(Select, { label: "Fuel Type", options: fuelTypeOptions, value: data.fuelType, disabled: disabled, onChange: (e) => handleChange('fuelType', e.target.value) }), _jsxs("span", { style: { fontSize: '10px', color: colors.slate[500] }, children: ["Provenance: ", _jsx("em", { children: data.fuelProvenance || 'From vehicle / driver profile' })] })] })] }), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '14px',
                    paddingTop: '8px',
                    borderTop: `1px solid ${colors.slate[100]}`,
                }, children: [_jsx(Input, { label: "Origin Location", placeholder: "e.g. Bengaluru, Karnataka", value: data.originLocation, disabled: disabled, onChange: (e) => handleChange('originLocation', e.target.value) }), _jsx(Input, { label: "Destination Facility", placeholder: "e.g. Chennai Plant Gate 1", value: data.destinationLocation, disabled: disabled, onChange: (e) => handleChange('destinationLocation', e.target.value) }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px' }, children: [_jsx(Input, { label: "Estimated Distance (km)", type: "number", value: data.distanceKm, disabled: disabled, onChange: (e) => handleChange('distanceKm', Number(e.target.value)) }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }, children: [_jsx("span", { style: { color: colors.slate[500] }, children: "Provenance:" }), _jsx("span", { style: {
                                            backgroundColor: colors.slate[100],
                                            color: colors.slate[800],
                                            padding: '0 4px',
                                            borderRadius: '2px',
                                            fontWeight: 600,
                                        }, children: data.distanceProvenance })] })] }), _jsx(Select, { label: "Journey Type", options: journeyTypeOptions, value: data.journeyType, disabled: disabled, onChange: (e) => handleChange('journeyType', e.target.value) }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px' }, children: [_jsx(Input, { label: "Passenger Occupancy", type: "number", min: 1, max: 80, value: data.occupancy, disabled: disabled, onChange: (e) => handleChange('occupancy', Number(e.target.value)) }), _jsxs("span", { style: { fontSize: '10px', color: colors.slate[500] }, children: ["Provenance: ", _jsx("em", { children: "User provided (for carpool allocation)" })] })] })] }), _jsxs("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    backgroundColor: colors.slate[50],
                    border: `1px solid ${colors.slate[200]}`,
                    borderRadius: radius.sm,
                    fontSize: typography.fontSize.xs.size,
                    color: colors.slate[700],
                }, children: [_jsx(Info, { size: 16, color: colors.esg[600], style: { flexShrink: 0 } }), _jsxs("span", { children: [_jsx("strong", { children: "Operational Traceability:" }), " This mobility data is normalized and linked to this transaction. Scope 1/3 emissions and factor calculations are derived asynchronously by the controlled enterprise ESG engine."] })] })] }));
};
