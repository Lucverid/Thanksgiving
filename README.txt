
Thanksgiving v3.9.1 — Experience Controls + Photo Branding

NEW ADMIN CONTROLS
Brand & Vibe > Experience Controls:
- Menu & Harga ON/OFF
- User can choose Occasion ON/OFF
- choose which occasions customer is allowed to select

CUSTOMER OCCASION PICKER
- compact "Ganti occasion" control on Landing
- opens aesthetic occasion selector
- choice is session-only; original QR document is not rewritten
- chosen occasion automatically affects:
  - special intro
  - music scope/fallback
  - photo template group

MENU & HARGA TOGGLE
- when OFF, customer Menu & Harga button disappears
- direct menu open is also defensively blocked
- Admin Menu & Launch remains accessible so content can still be prepared

PHOTO BRANDING
Brand & Vibe > Photo Branding:
- Branding all templates ON/OFF
- style: Frame / Ribbon / Stamp
- strength: Subtle / Balanced / Bold
- custom branding label
- show/hide brand name
- show/hide tagline

Branding automatically follows:
- Brand logo
- Brand name
- Tagline
- Primary color
- Secondary/background color
- Accent color

Photo branding is applied to:
- template preview stage
- live camera preview
- final exported canvas
- existing draggable logo remains on top and can still be repositioned

RETAINED
- exact v3.7.9 intro/video behavior
- v3.9.0 animated responsive menu
- multi-image upload
- Best Seller 1–5
- Product Launch
- delivery consent links
- all gacha/lobby/Meong hotfixes

Checks:
- node --check PASS
- renderArrivalIntro exactly once
- renderGacha exactly once
- showGachaRoll exactly once
- commerceTab exactly once
- no Operator panel
