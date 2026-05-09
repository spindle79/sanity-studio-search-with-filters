import * as React from 'react'
import {useState, useRef} from 'react'
import {CloseIcon} from '@sanity/icons'
import {Card} from '@sanity/ui'
import {Button} from '@sanity/ui'
import styled from 'styled-components'
import {rem} from '@sanity/ui'
import {useClickOutsideEvent} from './useClickOutsideEvent'
import {FilterForm} from './FilterForm'
import {FilterLabel} from './FilterLabel'
import type {Filter} from './filter-types'

export type {Filter} from './filter-types'

const ContainerDiv = styled.div`
  align-items: center;
  display: inline-flex;
  max-width: 100%;
  position: relative;
`

const LabelButton = styled(Button)`
  border: none;
  width: 100%;
`

const CloseCard = styled(Card)`
  position: absolute;
  right: 0;
`

const CloseButton = styled(Button)`
  border-radius: 0 ${rem(2)} ${rem(2)} 0;
`

export interface FilterButtonProps {
  filter: Filter
  fullscreen?: boolean
  onRemove: () => void
  /**
   * Callback when filter is changed
   */
  onFilterChange?: (filter: Filter) => void
  /**
   * Optional filter definition for operators and description
   */
  filterDefinition?: {
    description?: string
    operators?: Array<{type: 'item' | 'divider'; name?: string}>
  }
  /**
   * Auto-open filter form when filter is first added
   */
  initialOpen?: boolean
}

/**
 * FilterButton - Individual filter button with inline expandable form.
 *
 * Displays a filter as a button/badge that expands inline to show a filter form when clicked.
 */
export function FilterButton({
  filter,
  fullscreen = false,
  onRemove,
  onFilterChange,
  filterDefinition,
  initialOpen = false,
}: FilterButtonProps) {
  const [isOpen, setIsOpen] = useState(initialOpen)
  const [buttonElement, setButtonElement] = useState<HTMLElement | null>(null)
  const formRef = useRef<HTMLDivElement | null>(null)

  // Auto-open when initialOpen changes to true
  React.useEffect(() => {
    if (initialOpen && !isOpen) {
      setIsOpen(true)
    }
  }, [initialOpen])

  const handleClose = () => setIsOpen(false)
  const handleOpen = () => setIsOpen(true)
  const handleToggle = () => setIsOpen(!isOpen)

  useClickOutsideEvent(
    isOpen && handleClose,
    () => [buttonElement, formRef.current].filter(Boolean) as HTMLElement[],
  )

  const isValid = filter.isValid !== false

  const handleFilterChange = (updatedFilter: Filter) => {
    onFilterChange?.(updatedFilter)
  }

  return (
    <ContainerDiv style={{position: 'relative'}}>
      {/* Main filter button */}
      <Card
        __unstable_focusRing
        display="flex"
        radius={2}
        tone={isValid ? 'primary' : 'transparent'}
      >
        <LabelButton
          mode="bleed"
          onClick={handleToggle}
          paddingLeft={fullscreen ? 3 : 2}
          paddingRight={fullscreen ? 3 : 5}
          paddingY={fullscreen ? 3 : 2}
          ref={setButtonElement}
        >
          <FilterLabel filter={filter} showContent={isValid} fullscreen={fullscreen} />
        </LabelButton>
      </Card>

      {/* Close button (only in popover mode) */}
      {!fullscreen && (
        <CloseCard
          __unstable_focusRing
          display="flex"
          radius={2}
          tone={isValid ? 'primary' : 'transparent'}
        >
          <CloseButton
            aria-label="Remove filter"
            fontSize={1}
            icon={CloseIcon}
            mode="bleed"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            padding={2}
            radius={2}
          />
        </CloseCard>
      )}

      {/* Inline filter form (shown when isOpen) */}
      {isOpen && (
        <FilterForm
          ref={formRef}
          filter={filter}
          onClose={handleClose}
          onRemove={fullscreen ? onRemove : undefined}
          onFilterChange={handleFilterChange}
          anchorElement={buttonElement}
          fullscreen={fullscreen}
          filterDefinition={filterDefinition}
        />
      )}
    </ContainerDiv>
  )
}
