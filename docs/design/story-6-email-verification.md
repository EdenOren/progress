# Story 6: Enforce Email Verification

**Branch**: `story/6-email-verification`

## Problem (from QA Report)

After signup, if Supabase's email verification is enabled, a user who hasn't verified their email can potentially access the app if they navigate directly or if the session state is misread. The app should block access to authenticated screens until email is confirmed.

## Product Requirements

### User Flow
1. User signs up → gets redirected to signup-success screen (existing)
2. User verifies email via link → app detects verified session
3. If user tries to access app without verification → shown a "Verify your email" screen
4. Once verified → full access

### Acceptance Criteria
- [ ] Root index redirect checks `user.email_confirmed_at` (not just session existence)
- [ ] Unverified users are redirected to a verification-required screen
- [ ] Verification-required screen shows resend option (reuse signup-success)
- [ ] Once user verifies and returns to app, they're let through automatically

---

## Implementation Tasks

### Task 1: Update root redirect logic
In `apps/mobile/app/index.tsx`:
- Check `session` AND `user.email_confirmed_at`
- If session exists but email not confirmed → redirect to signup-success with email param
- If session exists and email confirmed → redirect to tabs

### Task 2: Handle session refresh after verification
In `apps/mobile/src/providers/supabase.tsx`:
- Listen for `SIGNED_IN` or `TOKEN_REFRESHED` auth events
- When email becomes confirmed, React Query will refetch and redirect will update

---

## Priority
Medium — prevents unverified users from accessing features, important for data integrity.
