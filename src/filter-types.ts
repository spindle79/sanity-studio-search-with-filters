import type * as React from 'react'

/**
 * Canonical Filter type shared across FilterForm, FilterButton, FilterLabel,
 * FilterInput, and SearchBoxWithFilters. The `value` union covers every
 * shape the runtime code actually uses — keep it as the single source of truth.
 */
export interface Filter {
  id: string
  field: string
  operator: string
  value:
    | string
    | string[]
    | number
    | boolean
    | {from?: number | string | null; to?: number | string | null}
    | {unit: string; value: number}
    | {unit: 'day' | 'month' | 'year'; unitValue: number | null}
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
