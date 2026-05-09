import * as React from 'react'
import {useRef} from 'react'
import {TrashIcon, ChevronRightIcon, CheckmarkIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text, Button} from '@sanity/ui'
import FocusLock from 'react-focus-lock'
import styled from 'styled-components'
import {OperatorsMenuButton} from './OperatorsMenuButton'
import {FilterInput} from './FilterInput'

const FormCard = styled(Card)`
  display: flex;
  overflow: hidden;
  max-width: 480px;
  min-width: 240px;
  width: 100%;
  z-index: 1000;
`

export interface Filter {
  id: string
  field: string
  operator: string
  value:
    | string
    | string[]
    | number
    | {from?: number | string | null; to?: number | string | null}
    | {unit: string; value: number}
    | null
  label: string
  isValid?: boolean
  filterName?: string
  operatorType?: string
  fieldPath?: string
  title?: string
  description?: string
  icon?: React.ComponentType
}

export interface FilterFormProps {
  filter: Filter
  onClose: () => void
  onRemove?: () => void
  onFilterChange: (filter: Filter) => void
  anchorElement: HTMLElement | null
  fullscreen?: boolean
  filterDefinition?: {
    description?: string
    operators?: Array<{type: 'item' | 'divider'; name?: string}>
  }
}

/**
 * FilterForm - Inline expandable form for editing a filter.
 *
 * Shows when a filter button is clicked, positioned absolutely below the button.
 */
export const FilterForm = React.forwardRef<HTMLDivElement, FilterFormProps>(function FilterForm(
  {filter, onClose, onRemove, onFilterChange, anchorElement, fullscreen = false, filterDefinition},
  forwardedRef,
) {
  // Calculate offset from anchor element for max-height calculation
  const popoverOffset = React.useMemo(() => {
    if (!anchorElement) return 0
    const rect = anchorElement.getBoundingClientRect()
    return rect.y + rect.height + 5
  }, [anchorElement])

  const handleValueChange = (value: Filter['value']) => {
    const hasValue = value !== null && value !== undefined && value !== ''
    const isValid = hasValue && validateFilterValue(value, filter.operator)

    onFilterChange({
      ...filter,
      value,
      label: generateFilterLabel({...filter, value}),
      isValid,
    })
  }

  const handleOperatorChange = (operator: string) => {
    // Reset value when operator changes (some operators may need different value types)
    const newValue = getDefaultValueForOperator(operator)
    const isValid = validateFilterValue(newValue, operator)

    onFilterChange({
      ...filter,
      operator,
      operatorType: operator,
      value: newValue,
      label: generateFilterLabel({...filter, operator, value: newValue}),
      isValid,
    })
  }

  const handleRemove = () => {
    onRemove?.()
    onClose()
  }

  // Handle Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <FormCard
      ref={forwardedRef}
      border
      radius={3}
      shadow={2}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        marginTop: '5px',
        maxHeight: `min(calc(100vh - ${popoverOffset}px - 5px - 16px), 500px)`,
      }}
    >
      <FocusLock autoFocus={!supportsTouch} returnFocus>
        <Flex direction="column-reverse" width="fill">
          {/* Value input section */}
          <Card borderTop padding={3}>
            <Stack space={3}>
              <FilterInput
                filter={filter}
                value={filter.value}
                onChange={handleValueChange}
                fullscreen={fullscreen}
              />

              {/* Apply/Remove buttons */}
              <Flex gap={2} justify="flex-end">
                {onRemove && (
                  <Button
                    icon={TrashIcon}
                    mode="bleed"
                    onClick={handleRemove}
                    text="Remove"
                    tone="critical"
                  />
                )}
                <Button
                  icon={CheckmarkIcon}
                  mode="default"
                  onClick={onClose}
                  text="Apply"
                  tone="primary"
                />
              </Flex>
            </Stack>
          </Card>

          {/* Header section */}
          <Card padding={3}>
            <Stack space={3}>
              <Flex align="flex-start" gap={3} justify="space-between">
                <Box paddingLeft={1} paddingRight={2} paddingY={1}>
                  <FilterDetails filter={filter} />
                </Box>

                {fullscreen && onRemove && (
                  <Button
                    icon={TrashIcon}
                    mode="bleed"
                    onClick={handleRemove}
                    tone="critical"
                    title="Remove filter"
                  />
                )}
              </Flex>

              {/* Description */}
              {filterDefinition?.description && (
                <Card border padding={3} radius={2} tone="transparent">
                  <Text muted size={1}>
                    {filterDefinition.description}
                  </Text>
                </Card>
              )}

              {/* Operator selector */}
              <OperatorsMenuButton
                filter={filter}
                operator={filter.operator}
                onOperatorChange={handleOperatorChange}
                operators={filterDefinition?.operators}
              />
            </Stack>
          </Card>
        </Flex>
      </FocusLock>
    </FormCard>
  )
})

// Helper to generate filter label
function generateFilterLabel(filter: Filter): string {
  const fieldName = filter.title || filter.field
  const operatorText = getOperatorText(filter.operator)
  const valueText = formatFilterValue(filter.value)

  if (valueText) {
    return `${fieldName} ${operatorText} ${valueText}`
  }
  return fieldName
}

// Helper to get operator text
function getOperatorText(operator: string): string {
  const operatorMap: Record<string, string> = {
    includes: 'contains',
    equals: 'is',
    notEquals: 'is not',
    greaterThan: '>',
    lessThan: '<',
    dateTimeLast: 'in last',
    dateTimeAfter: 'after',
    dateTimeBefore: 'before',
  }
  return operatorMap[operator] || operator
}

// Helper to format filter value for display
function formatFilterValue(value: Filter['value']): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object' && 'from' in value && 'to' in value) {
    return `${value.from ?? ''} to ${value.to ?? ''}`
  }
  return String(value)
}

// Helper to validate filter value
function validateFilterValue(value: Filter['value'], operator: string): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string' && value.trim() === '') return false
  if (typeof value === 'number' && !Number.isFinite(value)) return false
  if (Array.isArray(value) && value.length === 0) return false

  // Validate dateTimeLast structure: { unit: 'day' | 'month' | 'year', unitValue: number | null }
  if (operator === 'dateTimeLast') {
    if (typeof value === 'object' && value !== null) {
      // New structure: {unit: 'day' | 'month' | 'year', unitValue: number | null}
      if ('unitValue' in value && 'unit' in value) {
        const dateTimeLastValue = value as {
          unit: 'day' | 'month' | 'year'
          unitValue: number | null
        }
        return (
          typeof dateTimeLastValue.unit === 'string' &&
          ['day', 'month', 'year'].includes(dateTimeLastValue.unit) &&
          (dateTimeLastValue.unitValue === null ||
            (typeof dateTimeLastValue.unitValue === 'number' &&
              Number.isFinite(dateTimeLastValue.unitValue) &&
              dateTimeLastValue.unitValue > 0))
        )
      }
      // Old structure (backward compatibility): {unit: string, value: number}
      if ('value' in value && 'unit' in value) {
        const dateTimeLastValue = value as {unit: string; value: number}
        return (
          typeof dateTimeLastValue.value === 'number' &&
          Number.isFinite(dateTimeLastValue.value) &&
          dateTimeLastValue.value > 0 &&
          typeof dateTimeLastValue.unit === 'string' &&
          ['days', 'weeks', 'months', 'years'].includes(dateTimeLastValue.unit)
        )
      }
    }
    // Legacy support for number values
    if (typeof value === 'number') {
      return Number.isFinite(value) && value > 0
    }
    return false
  }

  if (typeof value === 'object' && 'from' in value && 'to' in value) {
    // Range is valid if at least one value is set
    return (
      (value.from !== null && value.from !== undefined) ||
      (value.to !== null && value.to !== undefined)
    )
  }
  return true
}

// Helper to get default value for operator
function getDefaultValueForOperator(operator: string): Filter['value'] {
  if (operator.includes('Range')) {
    return {from: null, to: null}
  }
  if (operator === 'booleanEqual') {
    return true
  }
  if (operator === 'dateTimeLast') {
    // Default to 7 days for "in last X days" - structure: { unit: 'day', unitValue: 7 }
    return {unit: 'day' as const, unitValue: 7}
  }
  return null
}

// FilterDetails component
function FilterDetails({filter}: {filter: Filter}) {
  const fieldPath = filter.fieldPath?.split('.') || []
  const hasNestedPath = fieldPath.length > 1

  return (
    <Stack space={2}>
      {/* Field path (if nested) */}
      {hasNestedPath && (
        <Box marginLeft={4}>
          <Text muted size={0}>
            {fieldPath.slice(0, -1).map((pathTitle, index) => (
              <React.Fragment key={index}>
                <span>{pathTitle}</span>
                {index !== fieldPath.length - 2 && (
                  <span style={{opacity: 0.75, paddingLeft: '0.25em', paddingRight: '0.25em'}}>
                    <ChevronRightIcon />
                  </span>
                )}
              </React.Fragment>
            ))}
          </Text>
        </Box>
      )}

      {/* Icon and title */}
      <Flex align="flex-start" gap={3}>
        {filter.icon && (
          <Box style={{flexShrink: 0}}>
            <Text size={1}>
              <filter.icon />
            </Text>
          </Box>
        )}
        <Text size={1} weight="medium">
          {filter.title || filter.field}
        </Text>
      </Flex>
    </Stack>
  )
}

// Check if touch is supported
const supportsTouch =
  typeof window !== 'undefined' && ('ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0)
