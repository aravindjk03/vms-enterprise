import React, { useState } from 'react';
import { Bookmark, ChevronDown, Check, Plus, Trash2 } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';

export interface SavedViewItem {
  id: string;
  name: string;
  isDefault?: boolean;
  filterCount?: number;
}

export interface SavedViewProps {
  views: SavedViewItem[];
  activeViewId: string;
  onSelectView: (viewId: string) => void;
  onSaveCurrentView?: (name: string) => void;
  onDeleteView?: (viewId: string) => void;
  style?: React.CSSProperties;
}

export const SavedView: React.FC<SavedViewProps> = ({
  views,
  activeViewId,
  onSelectView,
  onSaveCurrentView,
  onDeleteView,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const activeView = views.find((v) => v.id === activeViewId) || views[0];

  const handleSave = () => {
    if (newViewName.trim() && onSaveCurrentView) {
      onSaveCurrentView(newViewName.trim());
      setNewViewName('');
      setIsCreating(false);
    }
  };

  return (
    <div style={{ position: 'relative', ...style }} className="vms-saved-view">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          height: '32px',
          padding: '0 10px',
          backgroundColor: '#ffffff',
          border: `1px solid ${colors.slate[300]}`,
          borderRadius: radius.md,
          fontSize: typography.fontSize.xs.size,
          color: colors.slate[700],
          cursor: 'pointer',
        }}
      >
        <Bookmark size={13} color={colors.primary[600]} />
        <span style={{ fontWeight: 600 }}>{activeView ? activeView.name : 'Saved Views'}</span>
        <ChevronDown size={13} color={colors.slate[400]} />
      </button>

      {isOpen && (
        <>
          <div
            aria-hidden="true"
            onClick={() => {
              setIsOpen(false);
              setIsCreating(false);
            }}
            style={{ position: 'fixed', inset: 0, zIndex: 900 }}
          />

          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '4px',
              width: '240px',
              backgroundColor: '#ffffff',
              border: `1px solid ${colors.slate[200]}`,
              borderRadius: radius.md,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              zIndex: 901,
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ padding: '4px 6px', fontSize: '10px', fontWeight: 700, color: colors.slate[400], textTransform: 'uppercase' }}>
              Select Saved View
            </div>

            {views.map((v) => {
              const isSelected = v.id === activeViewId;
              return (
                <div
                  key={v.id}
                  onClick={() => {
                    onSelectView(v.id);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: radius.sm,
                    backgroundColor: isSelected ? colors.primary[50] : 'transparent',
                    cursor: 'pointer',
                    fontSize: typography.fontSize.xs.size,
                    color: isSelected ? colors.primary[800] : colors.slate[800],
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{v.name}</span>
                    {v.isDefault && (
                      <span style={{ fontSize: '9px', backgroundColor: colors.slate[100], padding: '1px 4px', borderRadius: '2px', color: colors.slate[500] }}>
                        Default
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isSelected && <Check size={13} color={colors.primary[600]} />}
                    {onDeleteView && !v.isDefault && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteView(v.id);
                        }}
                        style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: colors.slate[400] }}
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {onSaveCurrentView && (
              <div style={{ borderTop: `1px solid ${colors.slate[100]}`, paddingTop: '6px', marginTop: '4px' }}>
                {isCreating ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <input
                      type="text"
                      autoFocus
                      placeholder="View name..."
                      value={newViewName}
                      onChange={(e) => setNewViewName(e.target.value)}
                      style={{
                        padding: '4px 6px',
                        fontSize: typography.fontSize.xs.size,
                        border: `1px solid ${colors.slate[300]}`,
                        borderRadius: radius.sm,
                        outline: 'none',
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setIsCreating(false)}
                        style={{ padding: '2px 8px', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', color: colors.slate[500] }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        style={{
                          padding: '2px 8px',
                          fontSize: '11px',
                          backgroundColor: colors.primary[600],
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: radius.sm,
                          cursor: 'pointer',
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCreating(true)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 8px',
                      borderRadius: radius.sm,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: typography.fontSize.xs.size,
                      color: colors.primary[700],
                      fontWeight: 600,
                    }}
                  >
                    <Plus size={13} />
                    <span>Save Current View</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
