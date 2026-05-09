import * as React from 'react'
import {Box, Flex, TextInput, Select} from '@sanity/ui'
import type {Filter} from './FilterForm'

export interface FilterInputProps {
  filter: Filter
  value: Filter['value']
  onChange: (value: Filter['value']) => void
  fullscreen?: boolean
}

/**
 * FilterInput - Type-specific input component for filter values.
 *
 * Renders different input types based on the filter operator and field type.
 */
export function FilterInput({filter, value, onChange, fullscreen = false}: FilterInputProps) {
  const inputType = getInputType(filter.operator, filter.field)

  switch (inputType) {
    case 'string':
      return (
        <StringInput
          value={typeof value === 'string' ? value : ''}
          onChange={onChange}
          fullscreen={fullscreen}
        />
      )

    case 'number':
      return (
        <NumberInput
          value={typeof value === 'number' ? value : null}
          onChange={onChange}
          fullscreen={fullscreen}
        />
      )

    case 'numberRange':
      return (
        <NumberRangeInput
          value={
            typeof value === 'object' && 'from' in value && 'to' in value
              ? value
              : {from: null, to: null}
          }
          onChange={onChange}
          fullscreen={fullscreen}
        />
      )

    case 'boolean':
      return (
        <BooleanInput
          value={typeof value === 'boolean' ? value : true}
          onChange={onChange}
          fullscreen={fullscreen}
        />
      )

    case 'date':
    case 'dateTime':
      return (
        <DateTimeInput filter={filter} value={value} onChange={onChange} fullscreen={fullscreen} />
      )

    case 'reference':
      // For now, use string input for references
      // In a full implementation, you'd use a reference autocomplete
      return (
        <StringInput
          value={typeof value === 'string' ? value : ''}
          onChange={onChange}
          fullscreen={fullscreen}
          placeholder="Select document..."
        />
      )

    default:
      return (
        <StringInput
          value={typeof value === 'string' ? value : ''}
          onChange={onChange}
          fullscreen={fullscreen}
        />
      )
  }
}

// Determine input type based on operator and field
function getInputType(operator: string, field: string): string {
  // Number range operators
  if (operator === 'numberRange' || operator === 'dateTimeRange' || operator === 'dateRange') {
    if (field === '_updatedAt' || field === '_createdAt') {
      return 'dateTime'
    }
    return 'numberRange'
  }

  // Number operators
  if (
    operator.startsWith('number') ||
    operator === 'arrayCountEqual' ||
    operator === 'arrayCountGt' ||
    operator === 'arrayCountLt'
  ) {
    return 'number'
  }

  // Boolean operators
  if (operator === 'booleanEqual') {
    return 'boolean'
  }

  // Date/DateTime operators
  if (
    operator.startsWith('dateTime') ||
    operator.startsWith('date') ||
    field === '_updatedAt' ||
    field === '_createdAt'
  ) {
    return operator.includes('Range') ? 'dateTime' : 'dateTime'
  }

  // Reference operators
  if (operator.startsWith('reference') || operator.startsWith('asset') || field === '_references') {
    return 'reference'
  }

  // Default to string
  return 'string'
}

// String Input Component
function StringInput({
  value,
  onChange,
  fullscreen,
  placeholder = 'Enter text...',
}: {
  value: string
  onChange: (value: Filter['value']) => void
  fullscreen: boolean
  placeholder?: string
}) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.currentTarget.value || null)
  }

  return (
    <TextInput
      fontSize={fullscreen ? 2 : 1}
      onChange={handleChange}
      placeholder={placeholder}
      radius={2}
      value={value || ''}
    />
  )
}

// Number Input Component
function NumberInput({
  value,
  onChange,
  fullscreen,
}: {
  value: number | null
  onChange: (value: Filter['value']) => void
  fullscreen: boolean
}) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(value ?? '')

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUncontrolledValue(event.currentTarget.value)
    const numValue = parseFloat(event.currentTarget.value)
    onChange(Number.isFinite(numValue) ? numValue : null)
  }

  return (
    <TextInput
      fontSize={fullscreen ? 2 : 1}
      onChange={handleChange}
      placeholder="Enter number..."
      radius={2}
      step="any"
      type="number"
      value={uncontrolledValue}
    />
  )
}

// Number Range Input Component
function NumberRangeInput({
  value,
  onChange,
  fullscreen,
}: {
  value: {from: number | null; to: number | null}
  onChange: (value: Filter['value']) => void
  fullscreen: boolean
}) {
  const [from, setFrom] = React.useState(value?.from ?? '')
  const [to, setTo] = React.useState(value?.to ?? '')

  const handleFromChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFrom(event.currentTarget.value)
    const numValue = parseFloat(event.currentTarget.value)
    onChange({
      from: Number.isFinite(numValue) ? numValue : null,
      to: value?.to ?? null,
    })
  }

  const handleToChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTo(event.currentTarget.value)
    const numValue = parseFloat(event.currentTarget.value)
    onChange({
      from: value?.from ?? null,
      to: Number.isFinite(numValue) ? numValue : null,
    })
  }

  return (
    <Flex gap={2}>
      <Box flex={1}>
        <TextInput
          fontSize={fullscreen ? 2 : 1}
          onChange={handleFromChange}
          placeholder="Min"
          radius={2}
          step="any"
          type="number"
          value={from}
        />
      </Box>
      <Box flex={1}>
        <TextInput
          fontSize={fullscreen ? 2 : 1}
          onChange={handleToChange}
          placeholder="Max"
          radius={2}
          step="any"
          type="number"
          value={to}
        />
      </Box>
    </Flex>
  )
}

// Boolean Input Component
function BooleanInput({
  value,
  onChange,
  fullscreen,
}: {
  value: boolean
  onChange: (value: Filter['value']) => void
  fullscreen: boolean
}) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.currentTarget.value === 'true')
  }

  return (
    <Select
      fontSize={fullscreen ? 2 : 1}
      onChange={handleChange}
      radius={2}
      value={String(value ?? true)}
    >
      <option value="true">True</option>
      <option value="false">False</option>
    </Select>
  )
}

// DateTime Input Component - handles different date operators
function DateTimeInput({
  filter,
  value,
  onChange,
  fullscreen,
}: {
  filter: Filter
  value: Filter['value']
  onChange: (value: Filter['value']) => void
  fullscreen: boolean
}) {
  const operator = filter.operator

  // "In last X days" - number input with unit selector
  if (operator === 'dateTimeLast') {
    // Handle both old and new value structures
    let normalizedValue: {unit: 'day' | 'month' | 'year'; unitValue: number | null} | null = null

    if (value !== null && typeof value === 'object') {
      // New structure: {unit: 'day' | 'month' | 'year', unitValue: number | null}
      if ('unitValue' in value && 'unit' in value) {
        normalizedValue = value as {unit: 'day' | 'month' | 'year'; unitValue: number | null}
      }
      // Old structure: {unit: string, value: number}
      else if ('value' in value && 'unit' in value) {
        const oldValue = value as {unit: string; value: number}
        const unitMap: Record<string, 'day' | 'month' | 'year'> = {
          days: 'day',
          weeks: 'day',
          months: 'month',
          years: 'year',
        }
        normalizedValue = {
          unit: unitMap[oldValue.unit] || 'day',
          unitValue: oldValue.value,
        }
      }
    }
    // Legacy: number value (treat as days)
    else if (typeof value === 'number') {
      normalizedValue = {unit: 'day', unitValue: value}
    }

    // Default value
    if (!normalizedValue) {
      normalizedValue = {unit: 'day', unitValue: 7}
    }

    return <DateTimeLastInput value={normalizedValue} onChange={onChange} fullscreen={fullscreen} />
  }

  // "Between" - date range input
  if (operator === 'dateTimeRange') {
    return (
      <DateTimeRangeInput
        value={
          value !== null && typeof value === 'object' && 'from' in value && 'to' in value
            ? value
            : {from: null, to: null}
        }
        onChange={onChange}
        fullscreen={fullscreen}
      />
    )
  }

  // "After", "Before", "On", "Not on" - single date input
  return (
    <SingleDateTimeInput
      value={typeof value === 'string' ? value : null}
      onChange={onChange}
      fullscreen={fullscreen}
      includeTime={true} // Include time for datetime fields
    />
  )
}

// Single DateTime Input Component
function SingleDateTimeInput({
  value,
  onChange,
  fullscreen,
  includeTime = false,
}: {
  value: string | null
  onChange: (value: Filter['value']) => void
  fullscreen: boolean
  includeTime?: boolean
}) {
  // Convert ISO string to local datetime-local format
  const formatForInput = (isoString: string | null): string => {
    if (!isoString) return ''
    try {
      const date = new Date(isoString)
      if (isNaN(date.getTime())) return ''

      if (includeTime) {
        // Format as datetime-local: YYYY-MM-DDTHH:mm
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}`
      } else {
        // Format as date: YYYY-MM-DD
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
    } catch {
      return ''
    }
  }

  // Convert datetime-local format to ISO string
  const parseFromInput = (inputValue: string): string | null => {
    if (!inputValue) return null
    try {
      const date = new Date(inputValue)
      if (isNaN(date.getTime())) return null
      return date.toISOString()
    } catch {
      return null
    }
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.currentTarget.value
    const isoValue = parseFromInput(inputValue)
    onChange(isoValue)
  }

  return (
    <TextInput
      fontSize={fullscreen ? 2 : 1}
      onChange={handleChange}
      placeholder={includeTime ? 'Select date and time...' : 'Select date...'}
      radius={2}
      type={includeTime ? 'datetime-local' : 'date'}
      value={formatForInput(value)}
    />
  )
}

// DateTime Last Input Component (for "in last X days")
function DateTimeLastInput({
  value,
  onChange,
  fullscreen,
}: {
  value: {unit: 'day' | 'month' | 'year'; unitValue: number | null} | null
  onChange: (value: Filter['value']) => void
  fullscreen: boolean
}) {
  // Handle both old and new value structures for backward compatibility
  const normalizedValue = React.useMemo(() => {
    if (!value) return {unit: 'day' as const, unitValue: 7}

    // Handle old structure: {unit: string, value: number}
    if ('value' in value && typeof value.value === 'number') {
      const oldUnit = value.unit || 'days'
      // Map old units to new units
      const unitMap: Record<string, 'day' | 'month' | 'year'> = {
        days: 'day',
        weeks: 'day', // Convert weeks to days (approximate)
        months: 'month',
        years: 'year',
      }
      return {
        unit: unitMap[oldUnit] || 'day',
        unitValue: value.value,
      }
    }

    // Handle new structure: {unit: 'day' | 'month' | 'year', unitValue: number | null}
    return {
      unit: (value.unit || 'day') as 'day' | 'month' | 'year',
      unitValue: value.unitValue ?? 7,
    }
  }, [value])

  const [numberValue, setNumberValue] = React.useState(normalizedValue.unitValue ?? 7)
  const [unit, setUnit] = React.useState(normalizedValue.unit)

  React.useEffect(() => {
    setNumberValue(normalizedValue.unitValue ?? 7)
    setUnit(normalizedValue.unit)
  }, [normalizedValue])

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.currentTarget.value
    // Allow empty string for uncontrolled input
    if (inputValue === '') {
      setNumberValue(7) // Default to 7 when empty
      onChange({unit, unitValue: null})
      return
    }

    const numValue = parseInt(inputValue, 10)
    if (Number.isFinite(numValue) && numValue > 0) {
      setNumberValue(numValue)
      onChange({unit, unitValue: numValue})
    } else {
      // Invalid input, reset to previous value
      const prevValue = numberValue ?? 7
      setNumberValue(prevValue)
      event.currentTarget.value = String(prevValue)
    }
  }

  const handleUnitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = event.currentTarget.value as 'day' | 'month' | 'year'
    setUnit(newUnit)
    onChange({unit: newUnit, unitValue: numberValue})
  }

  return (
    <Flex gap={2}>
      <Box flex={1}>
        <TextInput
          aria-label="Date value"
          fontSize={fullscreen ? 2 : 1}
          onChange={handleNumberChange}
          pattern="\d*"
          radius={2}
          step="1"
          type="number"
          value={numberValue}
        />
      </Box>
      <Box flex={1}>
        <Select
          aria-label="Date unit"
          fontSize={fullscreen ? 2 : 1}
          onChange={handleUnitChange}
          radius={2}
          value={unit}
        >
          <option value="day">Days</option>
          <option value="month">Months</option>
          <option value="year">Years</option>
        </Select>
      </Box>
    </Flex>
  )
}

// DateTime Range Input Component
function DateTimeRangeInput({
  value,
  onChange,
  fullscreen,
}: {
  value: {from: string | null; to: string | null}
  onChange: (value: Filter['value']) => void
  fullscreen: boolean
}) {
  // Convert ISO string to local datetime-local format
  const formatForInput = (isoString: string | null): string => {
    if (!isoString) return ''
    try {
      const date = new Date(isoString)
      if (isNaN(date.getTime())) return ''
      // Format as datetime-local: YYYY-MM-DDTHH:mm
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    } catch {
      return ''
    }
  }

  // Convert datetime-local format to ISO string
  const parseFromInput = (inputValue: string): string | null => {
    if (!inputValue) return null
    try {
      const date = new Date(inputValue)
      if (isNaN(date.getTime())) return null
      return date.toISOString()
    } catch {
      return null
    }
  }

  const handleFromChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.currentTarget.value
    const isoValue = parseFromInput(inputValue)
    onChange({
      from: isoValue,
      to: value?.to ?? null,
    })
  }

  const handleToChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.currentTarget.value
    const isoValue = parseFromInput(inputValue)
    onChange({
      from: value?.from ?? null,
      to: isoValue,
    })
  }

  return (
    <Flex direction="column" gap={2}>
      <Box>
        <TextInput
          fontSize={fullscreen ? 2 : 1}
          onChange={handleFromChange}
          placeholder="From date and time..."
          radius={2}
          type="datetime-local"
          value={formatForInput(value?.from ?? null)}
        />
      </Box>
      <Box>
        <TextInput
          fontSize={fullscreen ? 2 : 1}
          onChange={handleToChange}
          placeholder="To date and time..."
          radius={2}
          type="datetime-local"
          value={formatForInput(value?.to ?? null)}
        />
      </Box>
    </Flex>
  )
}
