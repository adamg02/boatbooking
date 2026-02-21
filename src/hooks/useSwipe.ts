import { useEffect, useRef } from "react";

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

/**
 * Detects horizontal swipe gestures on a DOM element using the Pointer Events API.
 *
 * Using pointer events (rather than touch events) provides a cross-platform,
 * best-practice approach that works reliably on iOS Safari 13+, Android, and
 * desktop browsers. `setPointerCapture` ensures the pointerup event is always
 * delivered to the capturing element even when the pointer moves outside it,
 * which is a common failure point on iOS with synthetic touch events.
 *
 * `touch-action: pan-y` must be set on the target element so the browser
 * handles vertical scrolling natively while JavaScript handles horizontal swipes.
 */
export function useSwipe<T extends HTMLElement = HTMLDivElement>(
  options: UseSwipeOptions
) {
  const ref = useRef<T>(null);
  const thresholdValue = options.threshold ?? 50;

  // Keep callback refs stable so the effect does not re-run on every render.
  const onSwipeLeftRef = useRef(options.onSwipeLeft);
  const onSwipeRightRef = useRef(options.onSwipeRight);

  useEffect(() => {
    onSwipeLeftRef.current = options.onSwipeLeft;
    onSwipeRightRef.current = options.onSwipeRight;
  }, [options.onSwipeLeft, options.onSwipeRight]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let startX = 0;
    let startY = 0;
    let activePointerId: number | null = null;

    const handlePointerDown = (e: PointerEvent) => {
      // Only track the primary pointer (first finger or left mouse button).
      if (!e.isPrimary) return;
      startX = e.clientX;
      startY = e.clientY;
      activePointerId = e.pointerId;
      // Capture the pointer so pointerup fires on this element even if the
      // finger moves outside its bounds — critical for reliable swipe detection
      // on iOS Safari.
      element.setPointerCapture(e.pointerId);
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!e.isPrimary || activePointerId !== e.pointerId) return;
      activePointerId = null;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      // Discard gestures that are more vertical than horizontal (user is scrolling).
      if (Math.abs(deltaY) > Math.abs(deltaX)) return;
      if (Math.abs(deltaX) < thresholdValue) return;

      if (deltaX < 0) {
        onSwipeLeftRef.current?.();
      } else {
        onSwipeRightRef.current?.();
      }
    };

    const handlePointerCancel = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      activePointerId = null;
    };

    element.addEventListener("pointerdown", handlePointerDown);
    element.addEventListener("pointerup", handlePointerUp);
    element.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      element.removeEventListener("pointerdown", handlePointerDown);
      element.removeEventListener("pointerup", handlePointerUp);
      element.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [thresholdValue]);

  return ref;
}
