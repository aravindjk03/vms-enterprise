import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';

export interface AccordionItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  content: React.ReactNode;
  defaultExpanded?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  style?: React.CSSProperties;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  style,
}) => {
  const [expandedIds, setExpandedIds] = useState<string[]>(() =>
    items.filter((item) => item.defaultExpanded).map((item) => item.id)
  );

  const toggleItem = (id: string) => {
    if (allowMultiple) {
      setExpandedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setExpandedIds((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${colors.slate[200]}`,
        borderRadius: radius.md,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        ...style,
      }}
      className="vms-accordion"
    >
      {items.map((item, idx) => {
        const isExpanded = expandedIds.includes(item.id);
        const isNotLast = idx < items.length - 1;

        return (
          <div
            key={item.id}
            style={{
              borderBottom: isNotLast ? `1px solid ${colors.slate[200]}` : 'none',
            }}
          >
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              aria-expanded={isExpanded}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: isExpanded ? colors.slate[50] : '#ffffff',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 80ms ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: colors.slate[500], display: 'flex' }}>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
                <div>
                  <strong style={{ fontSize: typography.fontSize.sm.size, color: colors.slate[900] }}>
                    {item.title}
                  </strong>
                  {item.subtitle && (
                    <span style={{ display: 'block', fontSize: '11px', color: colors.slate[500] }}>
                      {item.subtitle}
                    </span>
                  )}
                </div>
              </div>

              {item.badge && <div>{item.badge}</div>}
            </button>

            {isExpanded && (
              <div
                style={{
                  padding: '14px',
                  backgroundColor: '#ffffff',
                  borderTop: `1px solid ${colors.slate[100]}`,
                }}
              >
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
