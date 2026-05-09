import * as React from 'react'
import {Box, Flex, Text} from '@sanity/ui'
import styled from 'styled-components'

const CustomBox = styled(Box)<{$flexShrink?: number}>`
  flex-shrink: ${({$flexShrink = 0}) => $flexShrink};
`

export interface Filter {
  id: string
  field: string
  operator: string
  value: string | string[] | number | {from?: number; to?: number} | null
  label: string
  isValid?: boolean
  title?: string
}

export interface FilterLabelProps {
  filter: Filter
  fontSize?: number
  showContent?: boolean
  fullscreen?: boolean
  maxLength?: number
}

/**
 * FilterLabel - Displays the filter label on the button.
 *
 * Shows: Field name [operator] value
 * Example: "Title contains 'example'"
 */
export function FilterLabel({
  filter,
  fontSize = 1,
  showContent = true,
  fullscreen = false,
  maxLength,
}: FilterLabelProps) {
  const fieldName = filter.title || filter.field
  const operatorText = getOperatorText(filter.operator)
  const filterValue = filter.value

  // Truncate field name if needed
  const displayFieldName =
    maxLength && fieldName.length > maxLength ? `${fieldName.slice(0, maxLength)}...` : fieldName

  return (
    <Flex align="center" gap={1}>
      {/* Field name */}
      <CustomBox $flexShrink={fullscreen ? 1 : 0}>
        <Text size={fontSize} textOverflow="ellipsis" weight="medium">
          {displayFieldName}
        </Text>
      </CustomBox>

      {/* Operator */}
      {showContent && operatorText && (
        <CustomBox $flexShrink={0}>
          <Text size={fontSize} textOverflow="ellipsis" weight="regular">
            {operatorText}
          </Text>
        </CustomBox>
      )}

      {/* Value */}
      {showContent && filterValue !== null && filterValue !== undefined && (
        <CustomBox $flexShrink={1}>
          <Text size={fontSize} textOverflow="ellipsis" weight="medium">
            {formatValueForLabel(filterValue, filter.operator)}
          </Text>
        </CustomBox>
      )}
    </Flex>
  )
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
    dateTimeEqual: 'on',
    dateTimeNotEqual: 'not on',
  }
  return operatorMap[operator] || operator
}

// Helper to format value for label display
function formatValueForLabel(value: Filter['value'], operator?: string): string {
  if (value === null || value === undefined) return ''

  // Special handling for "in last X days"
  if (operator === 'dateTimeLast') {
    if (typeof value === 'object' && value !== null) {
      // New structure: {unit: 'day' | 'month' | 'year', unitValue: number | null}
      if ('unitValue' in value && 'unit' in value) {
        const dateValue = value as {unit: 'day' | 'month' | 'year'; unitValue: number | null}
        if (dateValue.unitValue !== null && dateValue.unitValue !== undefined) {
          const unitLabels: Record<'day' | 'month' | 'year', string> = {
            day: dateValue.unitValue === 1 ? 'day' : 'days',
            month: dateValue.unitValue === 1 ? 'month' : 'months',
            year: dateValue.unitValue === 1 ? 'year' : 'years',
          }
          return `${dateValue.unitValue} ${unitLabels[dateValue.unit]}`
        }
      }
      // Old structure: {unit: string, value: number}
      if ('value' in value && 'unit' in value) {
        const {unit, value: numValue} = value as {unit: string; value: number}
        const unitText = numValue === 1 ? unit.slice(0, -1) : unit // Remove 's' for singular
        return `${numValue} ${unitText}`
      }
    }
    // Legacy support for number values
    if (typeof value === 'number') {
      return `${value} ${value === 1 ? 'day' : 'days'}`
    }
  }

  if (typeof value === 'string') {
    // Check if it's an ISO date string
    if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          // Format as readable date
          return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            ...(value.includes('T') && {
              hour: '2-digit',
              minute: '2-digit',
            }),
          })
        }
      } catch {
        // Fall through to string handling
      }
    }
    // Truncate long strings
    if (value.length > 20) {
      return `"${value.slice(0, 20)}..."`
    }
    return `"${value}"`
  }
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return ''
    if (value.length === 1) return `"${value[0]}"`
    return `${value.length} items`
  }
  if (typeof value === 'object' && 'from' in value && 'to' in value) {
    const from = value.from
    const to = value.to
    // Handle date range formatting
    const formatDateValue = (dateValue: string | null): string => {
      if (!dateValue) return ''
      try {
        const date = new Date(dateValue)
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            ...(dateValue.includes('T') && {
              hour: '2-digit',
              minute: '2-digit',
            }),
          })
        }
      } catch {
        return String(dateValue)
      }
      return String(dateValue)
    }
    const fromFormatted = formatDateValue(typeof from === 'string' ? from : null)
    const toFormatted = formatDateValue(typeof to === 'string' ? to : null)
    if (fromFormatted && toFormatted) return `${fromFormatted} to ${toFormatted}`
    if (fromFormatted) return `from ${fromFormatted}`
    if (toFormatted) return `until ${toFormatted}`
    return ''
  }
  return String(value)
}
