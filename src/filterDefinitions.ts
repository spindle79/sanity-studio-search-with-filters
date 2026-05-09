import * as React from 'react'
import {CalendarIcon, LinkIcon} from '@sanity/icons'
import type {FilterOption} from './AddFilterButton'

/**
 * Standard Sanity filter definitions matching the spec
 */
export interface FilterDefinition {
  id: string
  title: string
  field: string
  operator: string
  description?: string
  icon?: React.ComponentType
  type: 'pinned' | 'custom'
}

/**
 * Default pinned filters from Sanity Studio
 */
export const defaultPinnedFilters: FilterDefinition[] = [
  {
    id: 'updatedAt',
    title: 'Edited at',
    field: '_updatedAt',
    operator: 'dateTimeLast',
    description: 'Filter by last edited date',
    icon: CalendarIcon,
    type: 'pinned',
  },
  {
    id: 'createdAt',
    title: 'Created at',
    field: '_createdAt',
    operator: 'dateTimeLast',
    description: 'Filter by creation date',
    icon: CalendarIcon,
    type: 'pinned',
  },
  {
    id: 'references',
    title: 'Contains document, image or file',
    field: '_references',
    operator: 'referencesDocument',
    description: 'Filter by referenced documents, images, or files',
    icon: LinkIcon,
    type: 'pinned',
  },
]

/**
 * Get operators for a filter type
 */
export function getFilterOperators(
  filterId: string,
): Array<{type: 'item' | 'divider'; name?: string}> {
  if (filterId === 'updatedAt' || filterId === 'createdAt') {
    return [
      {type: 'item', name: 'dateTimeLast'},
      {type: 'item', name: 'dateTimeRange'},
      {type: 'divider'},
      {type: 'item', name: 'dateTimeAfter'},
      {type: 'item', name: 'dateTimeBefore'},
      {type: 'divider'},
      {type: 'item', name: 'dateTimeEqual'},
      {type: 'item', name: 'dateTimeNotEqual'},
    ]
  }

  if (filterId === 'references') {
    return [
      {type: 'item', name: 'referencesDocument'},
      {type: 'item', name: 'referencesAssetImage'},
      {type: 'item', name: 'referencesAssetFile'},
    ]
  }

  if (filterId === 'missingFields') {
    return [{type: 'item', name: 'hasMissingFields'}]
  }

  // Default operators for string-based filters
  return [
    {type: 'item', name: 'includes'},
    {type: 'item', name: 'equals'},
    {type: 'item', name: 'notEquals'},
  ]
}

/**
 * Custom filter for missing fields (useful for manual review)
 */
export const missingFieldsFilter: FilterDefinition = {
  id: 'missingFields',
  title: 'Missing fields',
  field: '_missingFields',
  operator: 'hasMissingFields',
  description: 'Filter documents with missing required fields',
  type: 'custom',
}

/**
 * Get all default filter options as FilterOption[] (compatible with AddFilterButton)
 */
export function getDefaultFilterOptions(): FilterOption[] {
  return [...defaultPinnedFilters, missingFieldsFilter].map((def) => ({
    id: def.id,
    title: def.title,
    field: def.field,
    operator: def.operator,
    description: def.description,
    icon: def.icon,
    type: def.type,
  }))
}
