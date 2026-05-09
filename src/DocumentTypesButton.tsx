import * as React from 'react'
import {useState, useRef, useMemo, useCallback} from 'react'
import {ChevronDownIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, MenuDivider, Popover, Stack, Text, TextInput} from '@sanity/ui'
import {SearchIcon} from '@sanity/icons'

const POPOVER_RADIUS = 3
const POPOVER_VERTICAL_MARGIN = 5 // px
const POPOVER_WIDTH = 250 // px
const MAX_HEIGHT = 500 // px
const ITEM_HEIGHT = 37 // px

export interface DocumentType {
  name: string
  title: string
}

export interface DocumentTypesButtonProps {
  /**
   * Selected document type names
   */
  types: string[]
  /**
   * Available document types
   */
  availableTypes: DocumentType[]
  /**
   * Callback when types change
   */
  onTypesChange: (types: string[]) => void
  /**
   * Whether in fullscreen mode
   */
  fullscreen?: boolean
}

/**
 * DocumentTypesButton - Button to open document type filter popover.
 *
 * Displays selected types count and opens a popover to select/deselect types.
 */
export function DocumentTypesButton({
  types,
  availableTypes,
  onTypesChange,
  fullscreen = false,
}: DocumentTypesButtonProps) {
  const [open, setOpen] = useState(false)
  const [titleFilter, setTitleFilter] = useState('')
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)
  const [buttonElement, setButtonElement] = useState<HTMLElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  const handleClose = useCallback(() => {
    setOpen(false)
    setTitleFilter('') // Clear filter on close
  }, [])
  const handleOpen = () => {
    setOpen(true)
    // Focus input after a short delay to allow popover to render
    setTimeout(() => inputElement?.focus(), 100)
  }

  // Use click outside detection - need to wait for popover to render in portal
  React.useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return

      // Check if click is inside button or popover
      const isInsideButton =
        buttonElement && (buttonElement === target || buttonElement.contains(target))
      const isInsidePopover =
        popoverRef.current && (popoverRef.current === target || popoverRef.current.contains(target))

      if (!isInsideButton && !isInsidePopover) {
        handleClose()
      }
    }

    // Use a small delay to ensure popover is rendered in portal
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true)
    }, 10)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside, true)
    }
  }, [open, buttonElement, handleClose])

  const title =
    types.length > 0 ? `${types.length} type${types.length > 1 ? 's' : ''}` : 'All types'

  const toggleType = (typeName: string) => {
    if (types.includes(typeName)) {
      onTypesChange(types.filter((t) => t !== typeName))
    } else {
      onTypesChange([...types, typeName])
    }
  }

  const handleFilterClear = () => {
    setTitleFilter('')
    inputElement?.focus()
  }

  const clearTypes = () => {
    onTypesChange([])
  }

  // Sort types alphabetically by title
  const sortedTypes = useMemo(() => {
    return [...availableTypes].sort((a, b) => a.title.localeCompare(b.title))
  }, [availableTypes])

  // Filter types by search term
  const filteredTypes = useMemo(() => {
    if (!titleFilter.trim()) return sortedTypes
    const searchLower = titleFilter.toLowerCase()
    return sortedTypes.filter(
      (type) =>
        type.title.toLowerCase().includes(searchLower) ||
        type.name.toLowerCase().includes(searchLower),
    )
  }, [sortedTypes, titleFilter])

  // Separate selected and unselected types
  const selectedTypes = useMemo(
    () => filteredTypes.filter((type) => types.includes(type.name)),
    [filteredTypes, types],
  )
  const unselectedTypes = useMemo(
    () => filteredTypes.filter((type) => !types.includes(type.name)),
    [filteredTypes, types],
  )

  // Ref callback to ensure we capture the popover element even when portaled
  const setPopoverRef = React.useCallback((element: HTMLDivElement | null) => {
    popoverRef.current = element
  }, [])

  return (
    <Popover
      __unstable_margins={[POPOVER_VERTICAL_MARGIN, 0, 0, 0]}
      content={
        <Card
          padding={0}
          radius={POPOVER_RADIUS}
          ref={setPopoverRef}
          style={{width: POPOVER_WIDTH, maxHeight: MAX_HEIGHT, overflow: 'hidden'}}
        >
          <Flex direction="column" style={{height: '100%'}}>
            {/* Header with search input */}
            <Box style={{flexShrink: 0}}>
              <Card borderBottom>
                <Flex align="center" flex={1} padding={1}>
                  <TextInput
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
              <Stack padding={1} paddingBottom={0} space={0} aria-multiselectable={true}>
                {filteredTypes.length > 0 ? (
                  <>
                    {/* Selected header */}
                    {selectedTypes.length > 0 && (
                      <Box margin={2} padding={1}>
                        <Text muted size={1} weight="medium">
                          Selected
                        </Text>
                      </Box>
                    )}

                    {/* Selected items */}
                    {selectedTypes.map((type) => (
                      <Box key={type.name} paddingBottom={1} style={{height: ITEM_HEIGHT}}>
                        <Button
                          fontSize={1}
                          justify="flex-start"
                          mode="bleed"
                          onClick={() => toggleType(type.name)}
                          padding={0}
                          style={{
                            position: 'relative',
                            whiteSpace: 'normal',
                            width: '100%',
                            height: '100%',
                          }}
                          tabIndex={-1}
                          tone="primary"
                        >
                          <Box padding={3} style={{width: '100%'}}>
                            <Text size={1} textOverflow="ellipsis">
                              {type.title}
                            </Text>
                          </Box>
                        </Button>
                      </Box>
                    ))}

                    {/* Divider */}
                    {selectedTypes.length > 0 && unselectedTypes.length > 0 && (
                      <Box paddingY={1}>
                        <MenuDivider />
                      </Box>
                    )}

                    {/* Unselected items */}
                    {unselectedTypes.map((type) => (
                      <Box key={type.name} paddingBottom={1} style={{height: ITEM_HEIGHT}}>
                        <Button
                          fontSize={1}
                          justify="flex-start"
                          mode="bleed"
                          onClick={() => toggleType(type.name)}
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
                            <Text size={1} textOverflow="ellipsis">
                              {type.title}
                            </Text>
                          </Box>
                        </Button>
                      </Box>
                    ))}
                  </>
                ) : (
                  <Box padding={3}>
                    <Text muted size={1} textOverflow="ellipsis">
                      {titleFilter ? `No matches found for "${titleFilter}"` : 'No types available'}
                    </Text>
                  </Box>
                )}
              </Stack>
            </Box>

            {/* Clear button footer */}
            {types.length > 0 && !titleFilter && (
              <Box style={{flexShrink: 0}}>
                <Card borderTop>
                  <Flex padding={1}>
                    <Button
                      mode="bleed"
                      onClick={clearTypes}
                      text="Clear type filters"
                      tone="primary"
                      style={{width: '100%'}}
                    />
                  </Flex>
                </Card>
              </Box>
            )}
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
        iconRight={ChevronDownIcon}
        mode="ghost"
        onClick={handleOpen}
        size={fullscreen ? 3 : 2}
        ref={setButtonElement}
        selected={open}
        text={title}
        tone="default"
      />
    </Popover>
  )
}
