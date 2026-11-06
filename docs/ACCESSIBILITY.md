# Accessibility checklist

- [ ] `click` trigger is a native button, keyboard operable; `hidden` toggling preserves logical focus.
- [ ] Loading text uses `role="status"`/`aria-live` appropriately without repeated announcements.
- [ ] Fatal error uses `role="alert"`, retry is a button and receives focus appropriately when needed.
- [ ] Canvas has a descriptive accessible name (`role="region"` + `aria-label`, app-owned).
- [ ] Google AdvancedMarker and MapLibre Marker popups can open via keyboard; anchors can be tabbed and activated.
- [ ] Marker-only labels are accessible and do not create empty clickable popups.
- [ ] Controls remain usable at 200% zoom, forced colors, and reduced motion; no focus trap in map.
- [ ] Screen-reader smoke: NVDA+Chrome, VoiceOver+Safari (manual after browser tests).

The component hides the open/retry control when activation starts and does not automatically move focus. A focused control becoming hidden can send focus to the document body. Applications must choose a focus destination (for example a named map region with `tabindex="-1"` after readiness, or the retry button on error). This policy still requires application-level keyboard and assistive-technology validation before release.

## Automated evidence

The real MapLibre suite runs on Chromium, Firefox and WebKit. It checks Enter on a linked marker, focus on popup anchors, focusable named images for label-only markers, SDK CSS and visible attribution. This does not validate screen-reader announcements, Google markers, forced colors or application-owned focus transitions. The checklist above remains the manual release gate.
