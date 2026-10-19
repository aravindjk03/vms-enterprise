import React from 'react';
import { colors } from '../../tokens.js';

export interface SplitViewProps {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
  leftWidth?: string;
  minLeftWidth?: string;
  minRightWidth?: string;
}

export const SplitView: React.FC<SplitViewProps> = ({
  leftPane,
  rightPane,
  leftWidth = '50%',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        minHeight: '600px',
        border: `1px solid ${colors.slate[200]}`,
        borderRadius: '6px',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
      }}
      className="vms-split-view"
    >
      <div
        style={{
          width: leftWidth,
          borderRight: `1px solid ${colors.slate[200]}`,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
        className="vms-split-left"
      >
        {leftPane}
      </div>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: colors.slate[50],
        }}
        className="vms-split-right"
      >
        {rightPane}
      </div>
    </div>
  );
};
