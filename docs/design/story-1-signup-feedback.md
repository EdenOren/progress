# Story 1: Post-Signup Success Screen

**Branch**: `story/1-signup-feedback`

## Problem

After signup, the app shows a native `Alert.alert()` dialog saying "Check your email" — this is:
- Easy to dismiss accidentally
- Not visually clear or branded
- No guidance if the email doesn't arrive
- User gets sent back to login with no context

## Product Requirements

### User Flow
1. User fills signup form and submits
2. If signup succeeds → navigate to a **Success Screen** (not an alert)
3. Success screen shows:
   - Confirmation that account was created
   - Instructions to check email (including spam folder)
   - Option to resend verification email
   - Option to go back to login
4. If email verification is disabled in Supabase → skip email step, go directly to app

### Acceptance Criteria
- [ ] Signup success shows a dedicated full-screen confirmation (not Alert)
- [ ] Screen clearly states what the user should do next
- [ ] "Resend email" button available after a short delay (prevents spam)
- [ ] "Back to Login" link always visible
- [ ] Works for both email-verification-enabled and disabled Supabase configs

---

## UI/UX Design Spec

### Screen: Signup Success (`app/(auth)/signup-success.tsx`)

```
Layout (centered vertical, padding 32px):

  [Icon area]
    - 80x80 circle, bg=$primary at 15% opacity
    - Checkmark or mail icon inside (Text "✓" as placeholder), color=$primary

  [Title]
    - "Check your inbox"
    - fontSize=28, fontWeight=700, color=$color
    - marginTop=24

  [Message]
    - "We sent a verification link to {email}. Tap the link to activate your account."
    - fontSize=16, color=$textSecondary, textAlign=center
    - marginTop=8

  [Spam hint]
    - "Didn't get it? Check your spam folder."
    - fontSize=14, color=$textMuted
    - marginTop=24

  [Resend button]
    - variant=secondary, fullWidth
    - Label: "Resend Verification Email"
    - Disabled for first 30 seconds (shows countdown: "Resend in 28s")
    - After resend: show "Email sent!" text briefly, then re-disable for 30s
    - marginTop=16

  [Back to login]
    - variant=ghost
    - Label: "Back to Login"
    - marginTop=12
```

### States
- **Initial**: Resend button disabled with countdown
- **Resend available**: Button enabled, secondary variant
- **Resend clicked**: Button shows loading spinner, then "Email sent!" for 2s
- **Error on resend**: Translucent red error banner below spam hint

### Tokens Used
- Background: `$background` (SafeAreaView)
- Icon circle: `rgba(139, 92, 246, 0.15)` (primary at 15%)
- Icon text: `$primary`
- Title: `$color`
- Message: `$textSecondary`
- Hint: `$textMuted`
- Countdown text: `$textMuted`

---

## Frontend Implementation Tasks

### Task 1: Create signup success screen
- Create `apps/mobile/app/(auth)/signup-success.tsx`
- Accept `email` as route param
- Display layout per design spec above
- Implement 30-second countdown timer for resend button

### Task 2: Add resend verification API
- Add `resendVerification(email: string)` to `packages/shared/src/api/`
- Uses `supabase.auth.resend({ type: 'signup', email })`
- Returns `Result<void>`
- Export from shared index

### Task 3: Update signup flow
- In `apps/mobile/app/(auth)/signup.tsx`:
  - On success, navigate to `/(auth)/signup-success` with email param
  - Remove the `Alert.alert` call

### Task 4: Handle edge case — verification disabled
- If Supabase returns a session immediately on signup (verification disabled):
  - Skip success screen, navigate directly to `/(tabs)`
  - The signup result will contain `session` if auto-confirmed

---

## Priority
High — this is the first experience after a user decides to join.
