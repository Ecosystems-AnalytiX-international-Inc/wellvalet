# IAP / StoreKit Integration Guide — WellValet

**Context:** Apple rejected v1.0 with 2 subscription-related issues (Guideline 2.1(b)):
1. `The app includes references to subscription but the associated In-App Purchase products have not been submitted for review.`
2. `The In-App Purchase products in the app exhibited one or more bugs which create a poor user experience. Specifically, unable to verify subscription.`

This document explains the current state of the payments layer and two production paths.

---

## Current state

There is **no real StoreKit / IAP integration** in the codebase.

- `components/premiumService.ts` exposes `setPremium(true)`, which only writes `"true"` to `AsyncStorage["IS_PREMIUM"]` and posts the flag to `POST /me/set-premium` on the backend.
- `app/trial-offer.tsx` calls `setPremium(true)` directly when the user taps **Start Free Trial** — no App Store purchase actually happens.
- `app/upgrade.tsx` shows plan cards but its purchase button is not yet wired.
- No `react-native-iap`, `expo-in-app-purchases`, or `react-native-purchases` (RevenueCat) dependency is installed.

This is why Apple's sandbox reviewer sees "unable to verify subscription" — there is nothing to verify.

---

## Two paths forward

### Path A — Free-only launch for v1.0.1 (recommended)

Ship v1.0.1 with **all Premium/subscription UI hidden**, resubmit within 2 days.
Bring paid tiers back in v1.1 with a proper RevenueCat integration.

Code changes required (minor):

1. In `app/(tabs)/index.tsx`, `app/(tabs)/history.tsx`, `app/(tabs)/mealplanner.tsx`,
   `app/(tabs)/scan.tsx`, `app/(tabs)/shopping.tsx`, `app/profile.tsx` — hide any
   "Go Premium", "Upgrade", trial banner, or premium lock UI behind a feature flag.
2. Route guard: `app/trial-offer.tsx` → redirect straight to `/(tabs)` (never shown).
3. Remove nav entry to `app/upgrade.tsx` (or gate behind the same feature flag).
4. Keep `premiumService.ts` as-is (unused but harmless).

Suggested feature flag pattern:

```ts
// components/featureFlags.ts
export const FEATURES = {
  paidSubscriptions: false, // flip to true in v1.1 once RevenueCat is wired
};
```

Then wrap Premium UI:

```tsx
import { FEATURES } from "../components/featureFlags";
{FEATURES.paidSubscriptions && <UpgradeBanner />}
```

Business side:
- Nothing extra required — no RevenueCat, no Paid Apps Agreement, no ASC subscription submissions.
- On resubmit, App Review Notes should say: "Premium subscriptions are removed from v1.0.1 and will ship in a subsequent update once IAP products are configured."

**Timeline:** Code fixes + Apple resubmit = 1 day. Approval = 1–3 days.

---

### Path B — Full paid launch with RevenueCat

Wire the app up to RevenueCat so real App Store / Play Store purchases work.

#### B.1 — Business prerequisites (Sanjeev / Mike Sophie)

1. **Sign the Paid Apps Agreement** in ASC → Business → Agreements, Tax, and Banking.
   - Add bank account (US or Canadian bank recommended for CAD payouts).
   - Add tax forms (W-8BEN or equivalent depending on entity residency).
   - This must be **In Effect** — status "Pending" will block IAP.
2. **Configure Subscription Group** in ASC → Features → In-App Purchases:
   - Group name: `WellValet Premium`
   - Add 3 auto-renewable subscriptions:
     - `com.cruiseanalytix.wellvalet.monthly` — C$5.99 / month, no trial
     - `com.cruiseanalytix.wellvalet.yearly` — C$49.99 / year, 7-day free trial
     - `com.cruiseanalytix.wellvalet.family_yearly` — C$79.99 / year, 7-day free trial
   - Each subscription needs: localized display name, description, price tier, and
     one **App Review screenshot** (a screenshot of the paywall showing that plan).
3. **Google Play mirror**: Play Console → Monetize → Subscriptions — create same 3 SKUs.
4. **Create a RevenueCat account** at https://app.revenuecat.com (free tier is fine).
   - Add project "WellValet".
   - Add App Store app (paste ASC issuer ID, key ID, private key from ASC API).
   - Add Play Store app (paste service account JSON).
   - Create Products and map to the store SKUs above.
   - Create Entitlement `premium` and attach all three products.
   - Copy the iOS public SDK key + Android public SDK key.

#### B.2 — Code integration (developer)

1. **Install RevenueCat SDK.** Requires `pod install` after `npm install`:
   ```bash
   npm install react-native-purchases
   npx pod-install ios
   ```

2. **Create `components/purchasesService.ts`** — thin wrapper around
   `react-native-purchases`. It should expose:
   - `configurePurchases(userId: string)` — call after login
   - `getOfferings()` — return available packages
   - `purchasePackage(pkg)` — buy a package, return updated `CustomerInfo`
   - `restorePurchases()` — for "Restore Purchase" button
   - `getEntitlements()` — check if `premium` is active
   - `logOut()` — call when user signs out or deletes account

3. **Wire it into `trial-offer.tsx`** — replace the mock `setPremium(true)` with
   a real purchase call:
   ```ts
   const info = await purchasePackage(selectedPackage);
   if (info.entitlements.active["premium"]) {
     await setPremium(true); // still useful as a local cache
     router.replace("/(tabs)");
   }
   ```

4. **Wire it into `upgrade.tsx`** — same pattern, plus a **Restore Purchase**
   button (Apple requires this — Guideline 3.1.1).

5. **Backend receipt validation** — RevenueCat can be the source of truth via
   its webhook: point `POST /revenuecat/webhook` at your backend and update
   `is_premium` on the user record from webhook events (INITIAL_PURCHASE,
   RENEWAL, CANCELLATION, EXPIRATION, BILLING_ISSUE). This replaces the naive
   `/me/set-premium` call and makes subscription state trustworthy.

6. **On login / app start** — call `configurePurchases(user.id)` so RC knows
   which user to attribute purchases to. Cross-device restore works out of the box.

7. **On account deletion** (see `deleteAccount()` in `authService.ts`) — call
   `logOut()` on RC so the anonymous ID does not leak to a future user.

#### B.3 — Testing

1. Create **Sandbox tester accounts** in ASC → Users and Access → Sandbox → Testers.
2. On the test device, sign out of the real Apple ID for App Store purchases:
   Settings → App Store → Sandbox Account.
3. Buy in the app — StoreKit will show `[Environment: Sandbox]` in the confirm
   dialog. Card is not charged.
4. Verify:
   - Entitlement flips to active immediately on purchase.
   - Restore Purchase works after a fresh install with the same sandbox account.
   - Cancellation → app reflects loss of premium at the next refresh.
   - Network failure during purchase does not leave the UI in a broken state
     (show a retry button, do NOT double-charge).

**Timeline for Path B:** 7–14 days end-to-end, assuming business prerequisites
run in parallel with code work.

---

## Recommended next step

Pick Path A for **v1.0.1** to get the app live on both stores this week, then
do Path B for **v1.1**. This unblocks:
- User acquisition and organic reviews.
- Play Store listing (currently "Ready to publish" for the same reason).
- Real feedback on which features Premium should actually gate.

Path B alone is fine too, but plan for 2 weeks with multiple review rounds.
