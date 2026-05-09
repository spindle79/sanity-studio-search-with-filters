// @vitest-environment jsdom
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {renderHook, act} from '@testing-library/react'

import {useClickOutsideEvent} from '../src/useClickOutsideEvent'

function fireMouseDown(target: Node) {
  const event = new MouseEvent('mousedown', {bubbles: true})
  // jsdom respects useCapture-only listeners only if the event is dispatched
  // on a node within the document tree; ensure target is attached.
  target.dispatchEvent(event)
  return event
}

describe('useClickOutsideEvent', () => {
  let host: HTMLDivElement
  let inside: HTMLDivElement
  let outside: HTMLDivElement

  beforeEach(() => {
    host = document.createElement('div')
    inside = document.createElement('div')
    outside = document.createElement('div')
    host.appendChild(inside)
    document.body.appendChild(host)
    document.body.appendChild(outside)
  })

  afterEach(() => {
    host.remove()
    outside.remove()
  })

  it('fires the callback for clicks outside the ignored elements', () => {
    const cb = vi.fn()
    renderHook(() => useClickOutsideEvent(cb, () => [inside]))

    fireMouseDown(outside)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('does not fire when the click is inside an ignored element', () => {
    const cb = vi.fn()
    renderHook(() => useClickOutsideEvent(cb, () => [inside]))

    fireMouseDown(inside)
    expect(cb).not.toHaveBeenCalled()
  })

  it('treats the ignored element itself as "inside" (not just descendants)', () => {
    const cb = vi.fn()
    renderHook(() => useClickOutsideEvent(cb, () => [host]))

    fireMouseDown(host)
    expect(cb).not.toHaveBeenCalled()
  })

  it('skips null entries in the ignored elements array', () => {
    const cb = vi.fn()
    renderHook(() => useClickOutsideEvent(cb, () => [null, inside]))

    fireMouseDown(outside)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('does not attach a listener when the callback is disabled (false)', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')
    renderHook(() => useClickOutsideEvent(false, () => [inside]))

    const calls = addSpy.mock.calls.filter(([type]) => type === 'mousedown')
    expect(calls).toHaveLength(0)
    addSpy.mockRestore()
  })

  it('does not attach a listener when the callback is null/undefined', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')
    renderHook(() => useClickOutsideEvent(null, () => [inside]))
    renderHook(() => useClickOutsideEvent(undefined, () => [inside]))

    const calls = addSpy.mock.calls.filter(([type]) => type === 'mousedown')
    expect(calls).toHaveLength(0)
    addSpy.mockRestore()
  })

  it('removes its listener on unmount', () => {
    const cb = vi.fn()
    const {unmount} = renderHook(() => useClickOutsideEvent(cb, () => [inside]))

    fireMouseDown(outside)
    expect(cb).toHaveBeenCalledTimes(1)

    unmount()
    fireMouseDown(outside)
    // No additional calls after unmount.
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('only fires within the boundary when one is provided', () => {
    const cb = vi.fn()
    const boundary = document.createElement('div')
    const insideBoundary = document.createElement('div')
    boundary.appendChild(insideBoundary)
    document.body.appendChild(boundary)

    renderHook(() =>
      useClickOutsideEvent(
        cb,
        () => [inside],
        () => boundary,
      ),
    )

    // Click outside the ignored element AND outside the boundary -> ignored.
    fireMouseDown(outside)
    expect(cb).not.toHaveBeenCalled()

    // Click outside the ignored element but inside the boundary -> fires.
    fireMouseDown(insideBoundary)
    expect(cb).toHaveBeenCalledTimes(1)

    boundary.remove()
  })

  it('uses the latest callback when it changes between renders', () => {
    const first = vi.fn()
    const second = vi.fn()

    const {rerender} = renderHook(
      ({cb}: {cb: (event: MouseEvent) => void}) =>
        useClickOutsideEvent(cb, () => [inside]),
      {initialProps: {cb: first}},
    )

    fireMouseDown(outside)
    expect(first).toHaveBeenCalledTimes(1)

    act(() => {
      rerender({cb: second})
    })

    fireMouseDown(outside)
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
  })
})
