import * as React from 'react'
import {useState, useRef} from 'react'
import {Box, Button, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {SearchIcon, ControlsIcon, CloseIcon, ChevronDownIcon, SyncIcon} from '@sanity/icons'
import {keyframes, styled} from 'styled-components'
import {FilterButton} from './FilterButton'
import {DocumentTypesButton} from './DocumentTypesButton'
import {AddFilterButton, type FilterOption} from './AddFilterButton'
import {getFilterOperators} from './filterDefinitions'
import type {Filter} from './filter-types'

export type {Filter} from './filter-types'

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`

const AnimatedSpinnerIcon = styled(SyncIcon)`
  animation: ${rotate} 500ms linear infinite;
`

const FilterDiv = styled.div`
  line-height: 0;
  position: relative;
`

const CustomTextInputBox = styled(Box)<{$background?: boolean; $smallClearButton?: boolean}>`
  width: 100%;

  input + span {
    background: ${({theme, $background}) =>
      $background
        ? (theme as {sanity: {color: {card: {disabled: {bg2: string}}}}}).sanity.color.card
            .disabled.bg2
        : 'transparent'};
  }

  [data-qa='clear-button'] {
    background: none;
    box-shadow: none;
    display: flex;
    transform: ${({$smallClearButton}) => ($smallClearButton ? 'scale(0.8)' : 'scale(1)')};
    &:hover {
      opacity: 0.5;
    }
  }
`

export interface SearchBoxWithFiltersProps {
  /**
   * Current search query value
   */
  query: string
  /**
   * Callback when search query changes
   */
  onQueryChange: (query: string) => void
  /**
   * Whether search is loading
   */
  loading?: boolean
  /**
   * Whether filters section is visible
   */
  filtersVisible?: boolean
  /**
   * Callback to toggle filters visibility
   */
  onFiltersToggle?: () => void
  /**
   * Array of active filters
   */
  filters: Filter[]
  /**
   * Callback when a filter is removed
   */
  onFilterRemove: (filterId: string) => void
  /**
   * Callback when a filter is changed (value or operator updated)
   */
  onFilterChange?: (filter: Filter) => void
  /**
   * Callback to clear all filters
   */
  onClearFilters?: () => void
  /**
   * Selected document types
   */
  types: string[]
  /**
   * Available document types with their titles
   */
  availableTypes: Array<{name: string; title: string}>
  /**
   * Callback when document types change
   */
  onTypesChange: (types: string[]) => void
  /**
   * Whether to show document type filter
   */
  showTypeFilter?: boolean
  /**
   * Whether in fullscreen mode
   */
  fullscreen?: boolean
  /**
   * Placeholder text for search input
   */
  placeholder?: string
  /**
   * Available filter options for adding new filters
   */
  filterOptions?: FilterOption[]
  /**
   * Callback when a new filter is added
   */
  onFilterAdd?: (filter: FilterOption) => void
  /**
   * ID of the last added filter (for auto-opening)
   */
  lastAddedFilterId?: string
  /**
   * Extra controls rendered after the document type filter (tool-specific)
   */
  extraFilterControls?: React.ReactNode
  /**
   * True when custom filters outside `filters` / `types` are active (e.g. missing-content picks)
   */
  additionalFilterActive?: boolean
}

/**
 * SearchBoxWithFilters - A search input with filters following Sanity Studio design patterns.
 *
 * This component provides:
 * - Search input with loading indicator
 * - Toggleable filters section
 * - Document type filter
 * - Custom field filters
 * - Clear filters button
 */
export function SearchBoxWithFilters({
  query,
  onQueryChange,
  loading = false,
  filtersVisible = false,
  onFiltersToggle,
  filters,
  onFilterRemove,
  onFilterChange,
  onClearFilters,
  types,
  availableTypes,
  onTypesChange,
  showTypeFilter = true,
  fullscreen = false,
  placeholder = 'Search...',
  filterOptions,
  onFilterAdd,
  lastAddedFilterId,
  extraFilterControls,
  additionalFilterActive = false,
}: SearchBoxWithFiltersProps) {
  const notificationBadgeVisible =
    filters.length > 0 || types.length > 0 || additionalFilterActive
  const clearFiltersButtonVisible =
    filters.length > 0 ||
    (showTypeFilter && types.length > 0) ||
    additionalFilterActive

  // In popover mode (non-fullscreen), filters are always visible
  // In fullscreen mode, filters respect the filtersVisible prop
  const shouldShowFilters = fullscreen ? filtersVisible : true

  const handleQueryClear = () => {
    onQueryChange('')
  }

  return (
    <Card flex="none">
      <Stack space={shouldShowFilters ? 0 : 2}>
        {/* Search Header */}
        <Flex align="center" flex={1} gap={fullscreen ? 2 : 1} padding={fullscreen ? 2 : 1}>
          {/* Search input */}
          <Box flex={1}>
            <CustomTextInputBox $background={fullscreen} $smallClearButton={fullscreen}>
              <TextInput
                aria-label="Search"
                autoComplete="off"
                border={false}
                clearButton={!!query}
                fontSize={[2, 2, 1]} // Responsive: 15px/15px/13px
                icon={loading ? AnimatedSpinnerIcon : SearchIcon}
                onChange={(e) => onQueryChange(e.currentTarget.value)}
                onClear={handleQueryClear}
                placeholder={placeholder}
                radius={2}
                spellCheck={false}
                value={query}
              />
            </CustomTextInputBox>
          </Box>

          {/* Filter toggle (fullscreen only) */}
          {fullscreen && onFiltersToggle && (
            <FilterDiv>
              <Button
                aria-expanded={shouldShowFilters}
                aria-label={shouldShowFilters ? 'Hide filters' : 'Show filters'}
                icon={ControlsIcon}
                mode="bleed"
                onClick={onFiltersToggle}
                selected={shouldShowFilters}
                size={3}
                tone={notificationBadgeVisible ? 'primary' : undefined}
              />
            </FilterDiv>
          )}
        </Flex>

        {/* Filters Section */}
        {shouldShowFilters && (
          <Card borderTop flex="none">
            <Flex direction="column" gap={0}>
              {/* Main filter row */}
              <Flex align="flex-start" gap={3} justify="space-between" padding={2}>
                <Flex flex={1} gap={2} wrap="wrap">
                  {showTypeFilter && (
                    <DocumentTypesButton
                      types={types}
                      availableTypes={availableTypes}
                      onTypesChange={onTypesChange}
                      fullscreen={fullscreen}
                    />
                  )}
                  {extraFilterControls}
                  {filters.map((filter) => {
                    // Get filter definition for operators
                    const filterDef = filterOptions?.find((f) => f.id === filter.id)
                    const operators = filterDef ? getFilterOperators(filter.id) : undefined

                    return (
                      <FilterButton
                        key={filter.id}
                        filter={filter}
                        fullscreen={fullscreen}
                        onRemove={() => onFilterRemove(filter.id)}
                        onFilterChange={onFilterChange}
                        filterDefinition={{
                          description: filterDef?.description,
                          operators,
                        }}
                        initialOpen={lastAddedFilterId === filter.id}
                      />
                    )
                  })}
                  {!fullscreen && onFilterAdd && (
                    <AddFilterButton
                      filterOptions={filterOptions}
                      onFilterAdd={onFilterAdd}
                      fullscreen={fullscreen}
                    />
                  )}
                </Flex>
                {clearFiltersButtonVisible && !fullscreen && onClearFilters && (
                  <Button
                    mode="bleed"
                    onClick={onClearFilters}
                    text="Clear filters"
                    tone="critical"
                  />
                )}
              </Flex>

              {/* Fullscreen: Add filter and clear buttons on separate row */}
              {fullscreen && (
                <Flex justify="space-between" paddingBottom={2} paddingX={2}>
                  {onFilterAdd && (
                    <AddFilterButton
                      filterOptions={filterOptions}
                      onFilterAdd={onFilterAdd}
                      fullscreen={fullscreen}
                    />
                  )}
                  {clearFiltersButtonVisible && onClearFilters && (
                    <Button
                      mode="bleed"
                      onClick={onClearFilters}
                      size={3}
                      text="Clear filters"
                      tone="critical"
                    />
                  )}
                </Flex>
              )}
            </Flex>
          </Card>
        )}
      </Stack>
    </Card>
  )
}
