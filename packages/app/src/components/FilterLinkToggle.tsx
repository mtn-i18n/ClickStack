import { useTranslation } from 'next-i18next/pages';
import type { CSSProperties } from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';
import { IconArrowsLeftRight } from '@tabler/icons-react';

type FilterLinkToggleProps = {
  linked: boolean;
  onChange: (linked: boolean) => void;
  /**
   * Whether filters on this page can declare variables. When they can, the
   * tooltip adds a note that linking is separate from variable references
   * written into a filter's own "Dropdown values filter".
   */
  showVariableNote?: boolean;
  'data-testid'?: string;
};

/**
 * Opt-in toggle that "links" a set of filter dropdowns so each one's selectable
 * values are narrowed by the others' current selections (faceted / filter-aware
 * values). Off by default because contingent value lookups can't be served from
 * the cheap per-key rollups and are far more expensive at scale.
 */
export function FilterLinkToggle({
  linked,
  onChange,
  showVariableNote = false,
  'data-testid': dataTestId = 'filter-link-toggle',
}: FilterLinkToggleProps) {
  const { t } = useTranslation('search');
  const label =
    (linked ? t('filterLink.linked') : t('filterLink.unlinked')) +
    (showVariableNote ? ` ${t('filterLink.variableNote')}` : '');

  return (
    <Tooltip withinPortal multiline w={400} label={label}>
      <ActionIcon
        variant="subtle"
        // Active state: a high-contrast inverted "pill" via theme tokens (never
        // green, on any theme) so linked mode is clearly visible; off is the
        // plain subtle icon. Overrides Mantine's ActionIcon CSS vars inline.
        style={
          linked
            ? ({
                '--ai-bg': 'var(--color-bg-inverted)',
                '--ai-hover': 'var(--color-bg-inverted)',
                '--ai-color': 'var(--color-text-inverted)',
              } as CSSProperties)
            : undefined
        }
        onClick={() => onChange(!linked)}
        aria-label={t('filterLink.ariaLabel')}
        aria-pressed={linked}
        data-testid={dataTestId}
      >
        <IconArrowsLeftRight size={16} />
      </ActionIcon>
    </Tooltip>
  );
}
