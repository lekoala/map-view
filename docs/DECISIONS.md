# Decisions

## D1 — Map engines are adapters, not a common SDK

Public surface is points/center/options + `mount` and `dispose`; do not add generalized `Map`, layer, camera, marker classes or draw APIs. MapLibre style/tile sources belong to its adapter.

## D2 — Activation defaults to click

`click`, `visible`, and `eager` are first-class loading policies. Importing `map-view` itself does not import providers. `click` ensures zero SDK/style/tile network requests until requested. `visible` keeps the canvas measurable before intersection. Switching mode on an already mounted element is unsupported in 0.1.

## D3 — Data in JSON, scalar options in HTML attributes

Points and optional center live in `<script type="application/json">`; scalar provider options live in attributes. No config JSON script. No secret credentials.

## D4 — No silent external services or engine fallback

`map-style` is mandatory with MapLibre. An application explicitly provides its style and worker URL if needed; Google requires a key and map ID. Errors are visible and retryable, never rerouted to a different provider.

## D5 — Safe generic points

Labels can stand alone. Links are optional; external HTTP(S) links are valid. Security is guaranteed by protocol filtering + textContent; individual applications can enforce same-origin rules. No arbitrary HTML popups.

## D6 — Per-attempt cancellation and immutable snapshot

Every activation has a fresh abort signal. Disconnect invalidates its entire session. Late successes dispose immediately. Post-mount dynamic changes to points/options/provider are out of scope (replace element).

## D7 — Ship ESM source only in 0.1

Provider-neutral lazy imports are more important than a standalone IIFE bundle. Use explicit peer imports and generated declarations.

## D8 — No bundled mock engine

Tests register a deterministic fake provider. The offline demo registers its own provider. A MapLibre local background style is suitable for future real integration smoke; Leaflet is not a requirement.

## D9 — Domain selection and application metadata

Adapters report marker activation through `onSelect(index)`. The core emits `map-view:select` with a copied normalized point and its index in the activation snapshot, only for the live ready attempt. All markers are selectable, including those without links. Built-in link popups remain adapter-owned. Optional JSON `data` belongs to the application and is never rendered as popup HTML automatically. Dialogs and record lookup belong to consumers.

