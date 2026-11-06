# Accessibility checklist

- [ ] `click` trigger is a native button, keyboard operable; `hidden` toggling preserves logical focus.
- [ ] Loading text uses `role="status"`/`aria-live` appropriately without repeated announcements.
- [ ] Fatal error uses `role="alert"`, retry is a button and receives focus appropriately when needed.
- [ ] Canvas has a descriptive accessible name (`role="region"` + `aria-label`, app-owned).
- [ ] Google AdvancedMarker and MapLibre Marker popups can open via keyboard; anchors can be tabbed and activated.
- [ ] Marker-only labels are accessible and do not create empty clickable popups.
- [ ] Controls remain usable at 200% zoom, forced colors, and reduced motion; no focus trap in map.
- [ ] Screen-reader smoke: NVDA+Chrome, VoiceOver+Safari (manual after browser tests).

The component does not automatically move focus at ready; applications can choose to focus the map or keep focus on the open trigger. Verify this with real browsers before the public API freezes.
