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

The real MapLibre suite runs on Chromium, Firefox and WebKit. It checks Enter/Space and click selection on linked and label-only markers, button semantics, focus on popup anchors, SDK CSS and visible attribution. The demo also exercises an application-owned details dialog. Google uses `gmpClickable` for all markers and its native activation event; the API-double suite verifies selection callbacks and cleanup. Automated results do not establish screen-reader announcements; the checklist above remains the manual release gate.

`accessibility.spec.js` additionally verifies keyboard activation, named map regions, popup link focus, dialog Escape/return focus, forced-colors/reduced-motion emulation and CSS enlargement on all three browsers. `bun run test:google` verifies real Google keyboard activation for default and custom markers using the local demo key. These are automated observations, not a screen-reader audit.

## Manual release record

Status: not performed, as confirmed by the maintainer on 2026-11-06. Do not mark the manual checklist complete based on automated tests alone.

Record the following after the smoke:

- Operating system, browser/version and reader/version (NVDA+Chrome or VoiceOver+Safari).
- Open/loading/error announcements, map name and retry focus.
- Default/custom marker names and keyboard activation, popup links and dialog Escape/return focus.
- Browser zoom at 200%, forced colors and reduced motion.
- Result, any defect and follow-up action.
