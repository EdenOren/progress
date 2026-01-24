# UI/UX Agent Opinion: Pre-fill vs Reference

## Question
Should we pre-fill last session's weights into input fields, or show them as reference above?

## Recommendation: Hybrid — Reference + Quick Copy

Neither pure pre-fill nor pure reference is ideal. The best UX is **showing last session as reference text with a one-tap copy action**.

---

## Why Not Pure Pre-fill

- User can't tell at a glance what's "old" vs "new"
- If they scroll through without changing, they submit stale data
- On a bad day, seeing pre-filled high numbers feels like pressure
- User loses the intentional act of "choosing today's weight"

## Why Not Pure Reference Only

- Too much typing — most users repeat or increment by small amounts
- Friction kills habit formation (speed of logging matters)
- User has to mentally parse reference while typing elsewhere

---

## Proposed Design

```
┌─────────────────────────────────────────┐
│ 🏋️ Bench Press                          │
│                                         │
│ Last: 80kg×8 · 85kg×6 · 85kg×5         │  ← muted reference line
│                                         │
│ Set 1: [____] kg × [____] reps   [⟳]   │  ← empty inputs + copy button
│ Set 2: [____] kg × [____] reps   [⟳]   │
│ Set 3: [____] kg × [____] reps   [⟳]   │
│                                         │
│ [+ Add Set]                             │
│                                         │
│ [😊 Easy] [👍 Good] [💪 Hard] [❌ Failed]│
└─────────────────────────────────────────┘
```

### Behavior

1. **Set count** pre-matches last session (3 sets last time → 3 empty rows shown)
2. **Input fields start empty** — user actively enters values
3. **[⟳] copy button** per set — taps to fill from last session's matching set
4. **"Last:" line** always visible as context (compact, muted text)
5. If user taps [⟳] on Set 1 → fills 80kg and 8 reps → user can then adjust to 82.5kg

### Why This Works

- **Fast path**: Tap [⟳] on each set, bump weight up → 3 taps + 3 small edits
- **Intentional**: User actively chooses to copy (no accidental stale submissions)
- **Flexible**: Skip sets, change everything, or copy-and-adjust
- **Visible progress**: Last time's numbers always in view for motivation
- **Clean**: Empty fields make it obvious what's been filled vs not

---

## Tokens

- "Last:" text: `$textMuted`, fontSize 13
- Copy button [⟳]: `$primary` at 60% opacity, 28×28 touch target
- Input fields: standard Input component, compact size
- Feedback buttons: translucent pills matching existing pattern

---

## Alternative Considered: Pre-fill + Highlight

Pre-fill inputs with last values but style them differently (italic, muted color) until user touches them. Rejected because:
- Adds visual complexity
- Hard to distinguish "edited" from "pre-filled" at a glance
- User might submit without noticing values are old
