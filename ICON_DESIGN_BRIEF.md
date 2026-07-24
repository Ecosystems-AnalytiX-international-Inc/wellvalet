# App Icon Design Brief — WellValet

**Blocker:** Apple rejected v1.0 under Guideline 2.3.8 (Accurate Metadata) because
the app icons currently in the project are Expo starter-template placeholders — not
finished WellValet branding. The reviewer explicitly wrote: *"the app icons appear
to be placeholder icons."*

The current icon files show blue design-guide graphics (grids, circles, a generic
"A/V" shape), not a real brand mark. These MUST be replaced before we can resubmit.

---

## What needs to change

Replace the following files with real WellValet icon artwork:

| Path | Size | Format | Purpose |
|---|---|---|---|
| `assets/images/icon.png` | **1024×1024** | PNG, **no alpha**, sRGB, no rounded corners | iOS App Store + iOS home screen |
| `assets/images/splash-icon.png` | **1024×1024** | PNG (alpha OK) | Splash screen mark (should sit centred on a solid `#FFFFFF` background) |
| `assets/images/android-icon-foreground.png` | **512×512** | PNG with alpha | Android adaptive icon foreground (mark only, transparent bg) |
| `assets/images/android-icon-background.png` | **512×512** | PNG (solid color) | Android adaptive icon background layer |
| `assets/images/android-icon-monochrome.png` | **432×432** | PNG, single-color mask (A13+ themed icons) | Android themed icons |
| `assets/images/favicon.png` | **48×48** | PNG | Web favicon (optional, low priority) |

Do NOT change file names — `app.json` references them by exact path.

---

## Design direction

- **Brand:** WellValet — wellness scanner (food + beauty products), allergen alerts,
  meal planning, family shopping.
- **Existing app palette:**
  - Primary green: `#2D6A2D`
  - Accent green: `#42D674`
  - Highlight yellow-green: `#E3F0A3`
  - Backgrounds: white + dark green `#1a3a1a` for premium surfaces
- **Tone:** friendly, trustworthy, "clean living" — think Yuka / Fooducate / Whole Foods,
  not clinical medical.

Recommended concept (pick one, do not combine):

1. **Green leaf + barcode motif** — the leaf represents wellness, barcode lines
   inside/behind it hint at scanning. Clean, distinctive at small sizes.
2. **Stylised "W" or checkmark inside a shield** — the shield hints at "valet" /
   guardian. Green fill, white symbol.
3. **Wordmark reduction** — an outlined "WV" monogram in a rounded square, with
   subtle leaf accent on the crossbar.

**Avoid:**
- Photorealistic food / apples / groceries (looks generic in the App Store).
- Multiple colors — stick to 2 max plus one accent.
- Text-only icons — "WellValet" full word will not read at 60×60 iOS springboard size.
- Design guide lines, grids, alignment marks, "+" markers.
- Alpha channels on the iOS `icon.png` (Apple will reject the upload).

---

## Delivery checklist (for the designer)

- [ ] Master vector file in Figma / Illustrator, artboard 1024×1024
- [ ] Export the six PNG assets at the sizes above, into `assets/images/`
- [ ] Verify iOS icon (1024×1024) has **no alpha channel** — flatten on white if needed
- [ ] Verify no design guides / annotations remain on any exported PNG
- [ ] Test how the icon looks at 60×60 on an iPhone home screen (Simulator or a real
      device) — the mark should still be readable
- [ ] Send back a preview grid showing the icon on both light and dark home screens

Once the new files land in `assets/images/`, we can regenerate the iOS native icons
by running `npx expo prebuild --clean` (or let EAS Build do it) and bundle a fresh
v1.0.1 build for resubmission.
