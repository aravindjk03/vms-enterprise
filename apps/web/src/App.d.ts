import React from 'react';
import type { EnterpriseRole } from '@vms/types';
export interface AppProps {
    initialRoute?: string;
    initialRole?: EnterpriseRole;
}
export declare const App: React.FC<AppProps>;
