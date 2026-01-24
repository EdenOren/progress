# Exercise Library - Seed Data

## Icon Mapping (MaterialCommunityIcons)

| Icon Key | Icon Name | Used For |
|----------|-----------|----------|
| `dumbbell` | dumbbell | General dumbbell/barbell exercises |
| `weight-lifter` | weight-lifter | Heavy compound lifts |
| `arm-flex` | arm-flex | Arm isolation exercises |
| `human-handsup` | human-handsup | Overhead movements |
| `human` | human | Bodyweight exercises |
| `run` | run | Running/cardio |
| `bike` | bike | Cycling |
| `rowing` | rowing | Rowing |
| `yoga` | yoga | Stretching/flexibility |
| `stairs-up` | stairs-up | Step/stair exercises |

---

## Exercise List (40 exercises)

### Chest (6)
| Name | Icon | Category | Muscle Group |
|------|------|----------|--------------|
| Flat Bench Press | dumbbell | strength | chest |
| Incline Bench Press | dumbbell | strength | chest |
| Dumbbell Chest Fly | dumbbell | strength | chest |
| Cable Crossover | dumbbell | strength | chest |
| Push-ups | human | bodyweight | chest |
| Chest Press Machine | dumbbell | strength | chest |

### Back (7)
| Name | Icon | Category | Muscle Group |
|------|------|----------|--------------|
| Deadlift | weight-lifter | strength | back |
| Barbell Row | weight-lifter | strength | back |
| Lat Pulldown | dumbbell | strength | back |
| Seated Cable Row | rowing | strength | back |
| Pull-ups | human | bodyweight | back |
| T-Bar Row | weight-lifter | strength | back |
| Face Pull | dumbbell | strength | back |

### Legs (8)
| Name | Icon | Category | Muscle Group |
|------|------|----------|--------------|
| Back Squat | weight-lifter | strength | legs |
| Front Squat | weight-lifter | strength | legs |
| Leg Press | weight-lifter | strength | legs |
| Lunges | human | strength | legs |
| Leg Extension | dumbbell | strength | legs |
| Leg Curl | dumbbell | strength | legs |
| Calf Raises | human | strength | legs |
| Romanian Deadlift | weight-lifter | strength | legs |

### Shoulders (5)
| Name | Icon | Category | Muscle Group |
|------|------|----------|--------------|
| Overhead Press | human-handsup | strength | shoulders |
| Lateral Raise | dumbbell | strength | shoulders |
| Front Raise | dumbbell | strength | shoulders |
| Rear Delt Fly | dumbbell | strength | shoulders |
| Shrugs | dumbbell | strength | shoulders |

### Arms (6)
| Name | Icon | Category | Muscle Group |
|------|------|----------|--------------|
| Barbell Curl | arm-flex | strength | arms |
| Hammer Curl | arm-flex | strength | arms |
| Preacher Curl | arm-flex | strength | arms |
| Tricep Pushdown | arm-flex | strength | arms |
| Tricep Dips | human | bodyweight | arms |
| Skull Crusher | dumbbell | strength | arms |

### Core (5)
| Name | Icon | Category | Muscle Group |
|------|------|----------|--------------|
| Plank | human | bodyweight | core |
| Hanging Leg Raise | human | bodyweight | core |
| Cable Crunch | dumbbell | strength | core |
| Russian Twist | human | bodyweight | core |
| Ab Wheel Rollout | human | bodyweight | core |

### Cardio (3)
| Name | Icon | Category | Muscle Group |
|------|------|----------|--------------|
| Treadmill Run | run | cardio | cardio |
| Cycling | bike | cardio | cardio |
| Rowing Machine | rowing | cardio | cardio |

---

## SQL Seed Format

```sql
INSERT INTO exercise_library (id, name, icon, category, muscle_group, is_system) VALUES
  (uuid_generate_v4(), 'Flat Bench Press', 'dumbbell', 'strength', 'chest', true),
  (uuid_generate_v4(), 'Incline Bench Press', 'dumbbell', 'strength', 'chest', true),
  -- ... etc
ON CONFLICT DO NOTHING;
```

---

## Custom Exercise Creation

When user creates a custom exercise:
- `is_system = false`
- `created_by = auth.uid()`
- User picks from the 10 available icons above
- Custom exercises only visible to the user who created them
