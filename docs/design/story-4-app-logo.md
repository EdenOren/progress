# Story 4: App Logo & Branding Assets

**Branch**: `story/4-app-logo`

## Problem

The app currently uses Expo's default placeholder icons and splash screen. The new brand logo (purple bar graph with upward arrow) exists but hasn't been applied to the app assets.

## Brand Logo

The logo is a **purple (#8B5CF6) bar graph with an upward-curving arrow**, representing progress/growth. It uses the app's primary violet color on a transparent/white background.

Source file: `c:\Users\ASUS\Downloads\graph.png`

---

## Product Requirements

### Acceptance Criteria
- [ ] App icon (iOS + Android) uses the new logo
- [ ] Adaptive icon (Android) uses logo on dark background (#09090B)
- [ ] Splash screen shows logo centered on dark background
- [ ] Web favicon uses the logo
- [ ] Login/signup screens show the logo above the title
- [ ] Logo is properly sized for all required resolutions

---

## Asset Specifications

### App Icon (`assets/icon.png`)
- Size: 1024x1024px
- Logo centered with padding (logo occupies ~70% of the area)
- Background: #09090B (zinc-950, matches app dark theme)
- Corner radius: handled by OS (don't bake in rounded corners)

### Adaptive Icon (`assets/adaptive-icon.png`)
- Size: 1024x1024px (foreground layer)
- Logo centered in safe zone (inner 66% circle)
- Background color set in app.json: #09090B
- Transparent background on the PNG (foreground only)

### Splash Screen (`assets/splash.png`)
- Size: 1284x2778px (iPhone 14 Pro Max resolution)
- Logo centered, ~200px wide
- Background: #09090B
- resizeMode: "contain" (already configured)

### Favicon (`assets/favicon.png`)
- Size: 48x48px
- Logo on transparent background
- Simple, recognizable at small size

---

## Implementation Tasks

### Task 1: Generate app assets
- Copy source logo to project
- Create `assets/icon.png` (1024x1024, logo on #09090B background)
- Create `assets/adaptive-icon.png` (1024x1024, logo on transparent, centered in safe zone)
- Create `assets/splash.png` (1284x2778, logo centered on #09090B)
- Create `assets/favicon.png` (48x48, logo on transparent)

### Task 2: Add logo to auth screens
- In `apps/mobile/app/(auth)/login.tsx`:
  - Add logo Image above the "Welcome back" title
  - Size: 64x64, marginBottom=16
- In `apps/mobile/app/(auth)/signup.tsx`:
  - Add logo Image above the "Create account" title
  - Size: 64x64, marginBottom=16
- Store the in-app logo as `assets/logo.png` (128x128, transparent background)

### Task 3: Verify app.json configuration
- Ensure `icon`, `splash.image`, `android.adaptiveIcon.foregroundImage`, and `web.favicon` paths are correct (they already point to the right files)
- Splash backgroundColor: #09090B (already set)
- Adaptive icon backgroundColor: #09090B (already set)

---

## Priority
Medium — branding polish, improves first impression and store listing readiness.
