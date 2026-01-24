# Progress App - Product Requirements

## Overview

**Progress** is a mobile app for tracking personal progress across multiple domains. The MVP focuses on **workout tracking**, with the architecture designed to support future domains like nutrition, sleep, and study.

### Vision
Help users build consistency and see measurable improvement in their personal development through simple, focused tracking.

### Target Users
- Fitness enthusiasts who want to track workout progress
- People starting a new fitness routine
- Users who want data-driven insights into their training

---

## MVP Features

### 1. Authentication

#### 1.1 Sign Up
**Description**: New users can create an account to start tracking.

**User Flow**:
1. User opens app for the first time
2. Sees welcome screen with "Sign Up" option
3. Enters name, email, password
4. Receives email verification link
5. Clicks link to verify account
6. Can now log in

**Acceptance Criteria**:
- [ ] Name field: 2-100 characters
- [ ] Email field: Valid email format
- [ ] Password field: Minimum 8 characters
- [ ] Shows validation errors inline
- [ ] Shows success message after signup
- [ ] Sends verification email

#### 1.2 Sign In
**Description**: Existing users can log in to access their data.

**User Flow**:
1. User opens app
2. Enters email and password
3. Taps "Sign In"
4. Redirected to Workouts screen

**Acceptance Criteria**:
- [ ] Shows error for invalid credentials
- [ ] Shows error for unverified email
- [ ] Persists session across app restarts
- [ ] Auto-refreshes session tokens

#### 1.3 Google Sign-In
**Description**: Users can sign in with their Google account for convenience.

**User Flow**:
1. User taps "Continue with Google"
2. Google OAuth popup appears
3. User selects Google account
4. Redirected to Workouts screen

**Acceptance Criteria**:
- [ ] Works on iOS and Android
- [ ] Creates profile automatically
- [ ] Handles OAuth errors gracefully

#### 1.4 Sign Out
**Description**: Users can log out of the app.

**Acceptance Criteria**:
- [ ] Confirmation dialog before sign out
- [ ] Clears local session
- [ ] Redirects to login screen

---

### 2. Workout Subjects

#### 2.1 Subject List
**Description**: Users see all their workout routines on the main screen.

**User Flow**:
1. User logs in
2. Sees list of workout subjects (e.g., "Monday Practice", "Leg Day")
3. Each subject shows name, entry count, last session date

**Acceptance Criteria**:
- [ ] Shows empty state with CTA when no subjects exist
- [ ] Subjects sorted by creation date (newest first)
- [ ] Pull-to-refresh to reload data
- [ ] Shows entry count per subject
- [ ] Shows relative date of last entry ("2 days ago")

#### 2.2 Create Subject
**Description**: Users can create a new workout routine.

**User Flow**:
1. User taps "New Workout" button
2. Modal appears with form
3. Enters name (required) and description (optional)
4. Taps "Create Workout"
5. Subject appears in list

**Acceptance Criteria**:
- [ ] Name: 1-100 characters, required
- [ ] Description: 0-500 characters, optional
- [ ] Shows error if name already exists for this user
- [ ] Closes modal on success
- [ ] New subject appears immediately in list

#### 2.3 Subject Detail
**Description**: Users can view a subject's history and start new sessions.

**User Flow**:
1. User taps a subject in the list
2. Sees subject name, description, entry history
3. Can tap an entry to view/edit it
4. Can tap "Start Today's Session" to create new entry

**Acceptance Criteria**:
- [ ] Shows all entries sorted by date (newest first)
- [ ] Each entry shows date, status (completed/in progress)
- [ ] Shows empty state when no entries exist
- [ ] "Start Session" creates entry for today's date

---

### 3. Workout Entries

#### 3.1 Entry Screen
**Description**: Users log their workout session with exercises, sets, and feedback.

**User Flow**:
1. User creates or opens an entry
2. Sees list of exercises (items)
3. Can add exercises
4. Can add sets to each exercise
5. Can rate each exercise (success/hard/fail)
6. Can mark session as completed

**Acceptance Criteria**:
- [ ] Shows entry date and status
- [ ] Shows comparison hint when previous entry exists
- [ ] "Add Exercise" button opens modal
- [ ] Exercises can have multiple sets
- [ ] Each set has weight (kg) and reps fields
- [ ] Feedback buttons: Success, Hard, Fail
- [ ] "Complete Session" marks entry as done

#### 3.2 Add Exercise
**Description**: Users add exercises to their entry.

**User Flow**:
1. User taps "+ Add" or "Add Exercise"
2. Modal appears
3. Enters exercise name (e.g., "Deadlift")
4. Taps "Add Exercise"
5. Exercise appears in entry

**Acceptance Criteria**:
- [ ] Name: 1-100 characters, required
- [ ] Exercise added at end of list
- [ ] Modal closes on success

#### 3.3 Add Set
**Description**: Users record sets for each exercise.

**User Flow**:
1. User taps "+ Add Set" on an exercise
2. Inline form appears
3. Enters weight and/or reps
4. Taps "Add Set"
5. Set appears in exercise card

**Acceptance Criteria**:
- [ ] Weight: 0-1000 kg, optional
- [ ] Reps: 0-1000, optional
- [ ] At least one field should have a value
- [ ] Sets numbered sequentially (Set 1, Set 2, etc.)
- [ ] Can add multiple sets

#### 3.4 Exercise Feedback
**Description**: Users rate how each exercise went.

**User Flow**:
1. User sees feedback buttons below each exercise
2. Taps "Success", "Hard", or "Fail"
3. Button becomes highlighted
4. Can change selection

**Acceptance Criteria**:
- [ ] One feedback per exercise (upsert)
- [ ] Visual feedback on selection
- [ ] Feedback saved immediately

#### 3.5 Last Time Comparison
**Description**: Users see their previous performance for reference.

**User Flow**:
1. User opens entry with previous session for same subject
2. Sees "Comparing with your session from [date]"
3. Each exercise shows volume change (+/- kg)

**Acceptance Criteria**:
- [ ] Compares with most recent previous entry for same subject
- [ ] Shows date of comparison entry
- [ ] Shows volume change per exercise (green for increase, red for decrease)
- [ ] Only compares exercises with matching names (case-insensitive)

#### 3.6 Complete Entry
**Description**: Users mark a session as completed.

**User Flow**:
1. User taps "Complete Session"
2. Confirmation dialog appears
3. User confirms
4. Entry status changes to "Completed"
5. Button disappears

**Acceptance Criteria**:
- [ ] Confirmation required
- [ ] Status visually distinct (green badge)
- [ ] Cannot be undone (for MVP)

---

### 4. Profile

#### 4.1 Profile Screen
**Description**: Users view their account information.

**Display**:
- Avatar (first letter of email)
- Display name
- Email
- Member since date

**Acceptance Criteria**:
- [ ] Shows user's display name or "User" as fallback
- [ ] Shows email address
- [ ] Shows account creation date
- [ ] Sign out button at bottom

---

## User Interface Guidelines

### Design Principles
1. **Simple**: Minimal UI, focus on the task
2. **Fast**: Quick to log, quick to review
3. **Motivating**: Show progress, celebrate wins
4. **Dark-first**: Dark theme as default, light theme available

### Color Palette
| Usage | Light | Dark |
|-------|-------|------|
| Primary | #3b82f6 | #60a5fa |
| Success | #22c55e | #4ade80 |
| Warning | #f59e0b | #fbbf24 |
| Error | #ef4444 | #f87171 |
| Background | #ffffff | #0a0a0a |
| Text | #111827 | #f9fafb |

### Typography
- Headings: Inter SemiBold/Bold
- Body: Inter Regular/Medium
- Sizes: 12px (small), 14px (body), 16px (large), 20-48px (headings)

### Spacing
- Base unit: 4px
- Common spacing: 8px, 12px, 16px, 20px, 24px

---

## Future Features (Post-MVP)

### Phase 2: Enhanced Tracking
- **Goals**: Set targets for exercises (e.g., "Deadlift 120kg x 8")
- **Goal Progress**: Visual progress toward goals
- **Exercise Templates**: Pre-populate exercises from subject history
- **Edit/Delete**: Modify existing entries, exercises, sets

### Phase 3: Insights
- **Dashboard**: Overview of workout stats
- **Charts**: Volume over time, personal records
- **Streaks**: Track workout consistency
- **BMI Calculator**: Based on profile height/weight

### Phase 4: Discovery
- **YouTube Search**: Search for exercise tutorials
- **Exercise Library**: Browse common exercises
- **Share Progress**: Export or share achievements

### Phase 5: Multi-Domain
- **Nutrition Tracking**: Log meals and calories
- **Sleep Tracking**: Log sleep hours and quality
- **Custom Domains**: User-defined tracking categories

---

## Success Metrics

### MVP Launch
- Users can complete full workout logging flow
- Session persistence works reliably
- No critical bugs in auth flow
- App loads in < 3 seconds

### Post-Launch (30 days)
- User retention: 40% weekly active
- Avg. sessions logged per user: 3/week
- Crash rate: < 1%
- App store rating: 4.0+

---

## Glossary

| Term | Definition |
|------|------------|
| **Domain** | Category of tracking (workout, nutrition, etc.) |
| **Subject** | User's custom routine (e.g., "Monday Practice") |
| **Entry** | A logged session for a subject on a specific date |
| **Item** | An exercise within an entry (e.g., "Deadlift") |
| **Set** | A single set record (weight, reps) |
| **Feedback** | User's rating of an exercise (success/hard/fail) |
| **Goal** | Target for an exercise (future feature) |
