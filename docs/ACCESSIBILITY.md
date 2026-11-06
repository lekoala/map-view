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

The real MapLibre suite runs on Chromium, Firefox and WebKit. It checks Enter/Space and click selection on linked and label-only markers, button semantics, focus on popup anchors, SDK CSS and visible attribution. The demo also exercises an application-owned details dialog. Google uses `gmpClickable` for all markers and its native activation event; the API-double suite verifies selection callbacks and cleanup. These tests do not validate screen-reader announcements, real Google marker keyboard behavior, forced colors or all application-owned focus transitions. The checklist above remains the manual release gate.
