# Fix 2: Entry Detail Error State

**Branch**: `fix/2-entry-error-state`

## Problem (from QA Report)

The entry detail screen (`apps/mobile/app/entry/[id].tsx`) only checks `isLoading` from `useEntryWithItems()`. If the query errors out (network failure, not found, etc.), the screen shows `LoadingScreen` forever — the user is stuck.

## Acceptance Criteria

- [ ] If entry fetch errors, show EmptyState with "Something went wrong" message
- [ ] If entry is not found (404), show "Entry not found" with back button
- [ ] Error state is visually distinct from loading state

---

## Implementation

In `apps/mobile/app/entry/[id].tsx`:

```tsx
const { data: entry, isLoading, isError } = useEntryWithItems(id);

if (isLoading) {
  return <LoadingScreen />;
}

if (isError || !entry) {
  return (
    <EmptyState
      title="Not Found"
      message="This session could not be found"
      actionLabel="Go Back"
      onAction={() => router.back()}
    />
  );
}
```

---

## Priority
High — user gets stuck on broken screen with no way out.
