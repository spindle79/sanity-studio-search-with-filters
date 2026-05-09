import * as React from 'react'
import {useState, useRef, useMemo} from 'react'
import {SearchIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Popover, Stack, Text, TextInput} from '@sanity/ui'
import {useClickOutsideEvent} from './useClickOutsideEvent'

const POPOVER_RADIUS = 3
const POPOVER_VERTICAL_MARGIN = 5 // px
const POPOVER_WIDTH = 300 // px
const ITEM_HEIGHT = 45 // px
const MAX_HEIGHT = 500 // px

export interface FilterOption {
  id: string
  title: string
  field: string
  operator: string
  description?: string
  icon?: React.ComponentType
  type?: 'pinned' | 'custom'
}

export interface AddFilterButtonProps {
  /**
   * Available filter options to choose from
   */
  filterOptions?: FilterOption[]
  /**
   * Callback when a filter is selected
   */
  onFilterAdd?: (filter: FilterOption) => void
  /**
   * Whether in fullscreen mode
   */
  fullscreen?: boolean
  /**
   * Placeholder text when no filter options available
   */
  emptyText?: string
}

/**
 * AddFilterButton - Button to open popover for adding new filters.
 *
 * Displays a button that opens a popover with available filter options.
 */
export function AddFilterButton({
  filterOptions = [],
  onFilterAdd,
  fullscreen = false,
  emptyText = 'No filters available',
}: AddFilterButtonProps) {
  const [open, setOpen] = useState(false)
  const [titleFilter, setTitleFilter] = useState('')
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)
  const [buttonElement, setButtonElement] = useState<HTMLElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  const handleClose = () => {
    setOpen(false)
    setTitleFilter('') // Clear filter on close
  }
  const handleOpen = () => {
    setOpen(true)
    // Focus input after a short delay to allow popover to render
    setTimeout(() => inputElement?.focus(), 100)
  }

  useClickOutsideEvent(
    open && handleClose,
    () => [buttonElement, popoverRef.current].filter(Boolean) as HTMLElement[],
  )

  const handleFilterSelect = (filter: FilterOption) => {
    onFilterAdd?.(filter)
    setOpen(false)
    setTitleFilter('') // Clear filter after selection
  }

  const handleFilterClear = () => {
    setTitleFilter('')
    inputElement?.focus()
  }

  // Filter options by search term
  const filteredOptions = useMemo(() => {
    if (!titleFilter.trim()) return filterOptions
    const searchLower = titleFilter.toLowerCase()
    return filterOptions.filter((filter) => filter.title.toLowerCase().includes(searchLower))
  }, [filterOptions, titleFilter])

  // Separate pinned and custom filters
  const pinnedFilters = useMemo(
    () => filteredOptions.filter((f) => f.type === 'pinned'),
    [filteredOptions],
  )
  const customFilters = useMemo(
    () => filteredOptions.filter((f) => f.type !== 'pinned'),
    [filteredOptions],
  )

  return (
    <Popover
      __unstable_margins={[POPOVER_VERTICAL_MARGIN, 0, 0, 0]}
      content={
        <Card
          padding={0}
          radius={POPOVER_RADIUS}
          ref={popoverRef}
          style={{width: POPOVER_WIDTH, maxHeight: MAX_HEIGHT, overflow: 'hidden'}}
        >
          <Flex direction="column" style={{height: '100%'}}>
            {/* Header with search input */}
            <Box style={{flexShrink: 0}}>
              <Card borderBottom>
                <Flex align="center" flex={1} padding={1}>
                  <TextInput
                    __unstable_disableFocusRing
                    aria-label="Filter by title"
                    autoComplete="off"
                    border={false}
                    clearButton={!!titleFilter}
                    fontSize={fullscreen ? 2 : 1}
                    icon={SearchIcon}
                    muted
                    onChange={(e) => setTitleFilter(e.currentTarget.value)}
                    onClear={handleFilterClear}
                    placeholder="Filter..."
                    radius={2}
                    ref={setInputElement}
                    spellCheck={false}
                    value={titleFilter}
                  />
                </Flex>
              </Card>
            </Box>

            {/* Scrollable list */}
            <Box
              flex={1}
              ref={listRef}
              style={{
                overflowY: 'auto',
                overflowX: 'hidden',
                maxHeight: MAX_HEIGHT - 50, // Account for header
              }}
            >
              <Stack padding={1} paddingBottom={0} space={0}>
                {filteredOptions.length > 0 ? (
                  <>
                    {/* Pinned filters section */}
                    {pinnedFilters.length > 0 && (
                      <>
                        <Box paddingTop={1}>
                          <Card borderBottom paddingX={2} paddingY={3} tone="primary">
                            <Text muted size={1} textOverflow="ellipsis" weight="medium">
                              Pinned filters
                            </Text>
                          </Card>
                        </Box>
                        {pinnedFilters.map((filter) => {
                          const Icon = filter.icon
                          return (
                            <Box key={filter.id} paddingBottom={1} style={{height: ITEM_HEIGHT}}>
                              <Button
                                fontSize={1}
                                justify="flex-start"
                                mode="bleed"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleFilterSelect(filter)
                                }}
                                padding={0}
                                style={{
                                  position: 'relative',
                                  whiteSpace: 'normal',
                                  width: '100%',
                                  height: '100%',
                                }}
                                tabIndex={-1}
                                tone="default"
                              >
                                <Box padding={3} style={{width: '100%'}}>
                                  <Flex align="center" gap={2}>
                                    {Icon && (
                                      <Box flex="none">
                                        <Icon />
                                      </Box>
                                    )}
                                    <Text size={1} textOverflow="ellipsis">
                                      {filter.title}
                                    </Text>
                                  </Flex>
                                </Box>
                              </Button>
                            </Box>
                          )
                        })}
                      </>
                    )}

                    {/* Custom filters section */}
                    {customFilters.length > 0 && (
                      <>
                        {pinnedFilters.length > 0 && (
                          <Box paddingTop={1}>
                            <Card borderBottom paddingX={2} paddingY={3} tone="default">
                              <Text muted size={1} textOverflow="ellipsis" weight="medium">
                                Custom filters
                              </Text>
                            </Card>
                          </Box>
                        )}
                        {customFilters.map((filter) => {
                          const Icon = filter.icon
                          return (
                            <Box key={filter.id} paddingBottom={1} style={{height: ITEM_HEIGHT}}>
                              <Button
                                fontSize={1}
                                justify="flex-start"
                                mode="bleed"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleFilterSelect(filter)
                                }}
                                padding={0}
                                style={{
                                  position: 'relative',
                                  whiteSpace: 'normal',
                                  width: '100%',
                                  height: '100%',
                                }}
                                tabIndex={-1}
                                tone="default"
                              >
                                <Box padding={3} style={{width: '100%'}}>
                                  <Flex align="center" gap={2}>
                                    {Icon && (
                                      <Box flex="none">
                                        <Icon />
                                      </Box>
                                    )}
                                    <Text size={1} textOverflow="ellipsis">
                                      {filter.title}
                                    </Text>
                                  </Flex>
                                </Box>
                              </Button>
                            </Box>
                          )
                        })}
                      </>
                    )}
                  </>
                ) : (
                  <Box padding={3}>
                    <Text muted size={1} textOverflow="ellipsis">
                      {titleFilter ? `No matches found for "${titleFilter}"` : emptyText}
                    </Text>
                  </Box>
                )}
              </Stack>
            </Box>
          </Flex>
        </Card>
      }
      open={open}
      placement="bottom-start"
      fallbackPlacements={['top-start', 'bottom-start']}
      portal
      radius={POPOVER_RADIUS}
    >
      <Button
        mode="ghost"
        onClick={handleOpen}
        size={fullscreen ? 3 : 2}
        ref={setButtonElement}
        selected={open}
        text="Add filter"
        tone="default"
      />
    </Popover>
  )
}
