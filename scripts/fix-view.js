import fs from 'node:fs';

let code = fs.readFileSync('apps/web/src/views/contractor/ContractorManagementView.tsx', 'utf8');

// Insert const fs definition
const importTarget = 'import type {\n  EnterpriseRole,';
const fsDef = `const fs = {
  micro: typography.fontSize.micro.size,
  xs: typography.fontSize.xs.size,
  sm: typography.fontSize.sm.size,
  base: typography.fontSize.base.size,
  md: typography.fontSize.md.size,
  lg: typography.fontSize.lg.size,
  xl: typography.fontSize.xl.size,
  '2xl': typography.fontSize['2xl'].size,
  '3xl': typography.fontSize['3xl'].size,
};

` + importTarget;

if (!code.includes('const fs = {')) {
  code = code.replace(importTarget, fsDef);
}

code = code.replaceAll('typography.fontSize.', 'fs.');
code = code.replaceAll("typography.fontSize['2xl']", "fs['2xl']");

// Fix Banner props: description -> message, variant -> type
code = code.replaceAll('description="Facility operating under full automated access control', 'message="Facility operating under full automated access control');
code = code.replaceAll('variant="info"', 'type="system"');
code = code.replaceAll('description="Manual corrections create an immutable', 'message="Manual corrections create an immutable');
code = code.replaceAll('variant="warning"', 'type="system"');
code = code.replaceAll('description={`Isolated entity strictly governed by Part 8', 'message={`Isolated entity strictly governed by Part 8');

fs.writeFileSync('apps/web/src/views/contractor/ContractorManagementView.tsx', code, 'utf8');
console.log('Successfully updated ContractorManagementView.tsx');
