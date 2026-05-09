import {useEffect, useRef} from 'react'

/**
 * Hook to detect clicks outside of specified elements
 *
 * @param callback - Function to call when clicking outside. Can be conditional (false/null to disable)
 * @param getElements - Function returning array of elements to ignore clicks within
 * @param getBoundary - Optional function returning boundary element (clicks must be within boundary)
 */
export function useClickOutsideEvent(
  callback: ((event: MouseEvent) => void) | false | null | undefined,
  getElements: () => (HTMLElement | null)[],
  getBoundary?: () => HTMLElement | null,
) {
  const callbackRef = useRef(callback)
  const getElementsRef = useRef(getElements)
  const getBoundaryRef = useRef(getBoundary)

  // Keep refs up to date
  useEffect(() => {
    callbackRef.current = callback
    getElementsRef.current = getElements
    getBoundaryRef.current = getBoundary
  }, [callback, getElements, getBoundary])

  useEffect(() => {
    // Don't set up listener if callback is disabled
    if (!callbackRef.current) {
      return
    }

    function handleMouseDown(event: MouseEvent) {
      const callback = callbackRef.current
      if (!callback) {
        return
      }

      const target = event.target as Node | null
      if (!target) {
        return
      }

      // Get elements to ignore
      const elements = getElementsRef.current()
      const isClickInside = elements.some((element) => {
        if (!element) {
          return false
        }
        return element === target || element.contains(target)
      })

      if (isClickInside) {
        return
      }

      // Check boundary if provided
      if (getBoundaryRef.current) {
        const boundary = getBoundaryRef.current()
        if (boundary) {
          const isWithinBoundary = boundary === target || boundary.contains(target)
          if (!isWithinBoundary) {
            return
          }
        }
      }

      // Click is outside all ignored elements (and within boundary if specified)
      callback(event)
    }

    // Use mousedown instead of click for better responsiveness
    document.addEventListener('mousedown', handleMouseDown, true)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown, true)
    }
  }, []) // Empty deps - we use refs to access latest values
}
