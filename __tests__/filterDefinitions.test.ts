import {describe, it, expect} from 'vitest'

import {
  defaultPinnedFilters,
  getFilterOperators,
  missingFieldsFilter,
  getDefaultFilterOptions,
} from '../src/filterDefinitions'

describe('defaultPinnedFilters', () => {
  it('exposes three pinned filters: updatedAt, createdAt, references', () => {
    expect(defaultPinnedFilters).toHaveLength(3)
    expect(defaultPinnedFilters.map((f) => f.id)).toEqual([
      'updatedAt',
      'createdAt',
      'references',
    ])
  })

  it('all pinned filters have type "pinned"', () => {
    for (const f of defaultPinnedFilters) {
      expect(f.type).toBe('pinned')
    }
  })

  it('updatedAt and createdAt map to the corresponding system fields and dateTimeLast operator', () => {
    const updated = defaultPinnedFilters.find((f) => f.id === 'updatedAt')!
    const created = defaultPinnedFilters.find((f) => f.id === 'createdAt')!
    expect(updated.field).toBe('_updatedAt')
    expect(updated.operator).toBe('dateTimeLast')
    expect(created.field).toBe('_createdAt')
    expect(created.operator).toBe('dateTimeLast')
  })

  it('references filter targets _references with referencesDocument operator', () => {
    const refs = defaultPinnedFilters.find((f) => f.id === 'references')!
    expect(refs.field).toBe('_references')
    expect(refs.operator).toBe('referencesDocument')
  })

  it('every pinned filter has a description and an icon', () => {
    for (const f of defaultPinnedFilters) {
      expect(f.description).toBeTruthy()
      expect(f.icon).toBeTruthy()
    }
  })
})

describe('missingFieldsFilter', () => {
  it('is a custom filter targeting _missingFields', () => {
    expect(missingFieldsFilter.id).toBe('missingFields')
    expect(missingFieldsFilter.type).toBe('custom')
    expect(missingFieldsFilter.field).toBe('_missingFields')
    expect(missingFieldsFilter.operator).toBe('hasMissingFields')
  })

  it('has a human-readable title and description', () => {
    expect(missingFieldsFilter.title).toBe('Missing fields')
    expect(missingFieldsFilter.description).toBeTruthy()
  })
})

describe('getFilterOperators', () => {
  it('returns date-time operators for updatedAt', () => {
    const ops = getFilterOperators('updatedAt')
    const names = ops.filter((o) => o.type === 'item').map((o) => o.name)
    expect(names).toEqual([
      'dateTimeLast',
      'dateTimeRange',
      'dateTimeAfter',
      'dateTimeBefore',
      'dateTimeEqual',
      'dateTimeNotEqual',
    ])
  })

  it('returns date-time operators for createdAt (same set as updatedAt)', () => {
    expect(getFilterOperators('createdAt')).toEqual(getFilterOperators('updatedAt'))
  })

  it('intersperses dividers within the date-time operator list', () => {
    const ops = getFilterOperators('updatedAt')
    // Two dividers: one after dateTimeRange, one after dateTimeBefore.
    expect(ops.filter((o) => o.type === 'divider')).toHaveLength(2)
    expect(ops[0]).toEqual({type: 'item', name: 'dateTimeLast'})
    expect(ops[2]).toEqual({type: 'divider'})
    expect(ops[5]).toEqual({type: 'divider'})
  })

  it('returns the three reference-asset operators for references', () => {
    const ops = getFilterOperators('references')
    expect(ops).toEqual([
      {type: 'item', name: 'referencesDocument'},
      {type: 'item', name: 'referencesAssetImage'},
      {type: 'item', name: 'referencesAssetFile'},
    ])
  })

  it('returns just hasMissingFields for missingFields', () => {
    expect(getFilterOperators('missingFields')).toEqual([
      {type: 'item', name: 'hasMissingFields'},
    ])
  })

  it('falls back to includes/equals/notEquals for unknown filter ids', () => {
    expect(getFilterOperators('title')).toEqual([
      {type: 'item', name: 'includes'},
      {type: 'item', name: 'equals'},
      {type: 'item', name: 'notEquals'},
    ])
  })

  it('returns the default operator set for an empty filter id', () => {
    const ops = getFilterOperators('')
    expect(ops.map((o) => o.name)).toEqual(['includes', 'equals', 'notEquals'])
  })
})

describe('getDefaultFilterOptions', () => {
  it('returns the three pinned filters followed by missingFields', () => {
    const opts = getDefaultFilterOptions()
    expect(opts.map((o) => o.id)).toEqual([
      'updatedAt',
      'createdAt',
      'references',
      'missingFields',
    ])
  })

  it('preserves the type discriminator (pinned vs custom)', () => {
    const opts = getDefaultFilterOptions()
    const byId = Object.fromEntries(opts.map((o) => [o.id, o.type]))
    expect(byId.updatedAt).toBe('pinned')
    expect(byId.createdAt).toBe('pinned')
    expect(byId.references).toBe('pinned')
    expect(byId.missingFields).toBe('custom')
  })

  it('forwards field, operator, description, and icon for every option', () => {
    const opts = getDefaultFilterOptions()
    for (const opt of opts) {
      expect(opt.field).toBeTruthy()
      expect(opt.operator).toBeTruthy()
      expect(opt.description).toBeTruthy()
    }
    // pinned filters all carry icons; missingFields does not
    expect(opts.find((o) => o.id === 'updatedAt')?.icon).toBeTruthy()
    expect(opts.find((o) => o.id === 'missingFields')?.icon).toBeUndefined()
  })

  it('returns a fresh array on each call (does not leak module state to callers)', () => {
    const a = getDefaultFilterOptions()
    const b = getDefaultFilterOptions()
    expect(a).not.toBe(b)
    a.push({
      id: 'extra',
      title: 'Extra',
      field: 'x',
      operator: 'equals',
    })
    expect(b.map((o) => o.id)).not.toContain('extra')
  })
})
