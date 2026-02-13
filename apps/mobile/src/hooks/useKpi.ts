import { useMemo } from 'react';
import {
  waistToHeightRatio,
  averageOfValues,
  goalPercentage,
  type KpiStatus,
  getKpiStatus,
  getWaistToHeightStatus,
} from '@progress/shared';
import { useDailyLogEntries } from './useDailyLog';
import { useHealthGoals } from './useHealthGoals';
import { useProfile } from './useProfile';

export interface KpiCardData {
  title: string;
  value: string;
  subtitle: string;
  status: KpiStatus;
  icon: string;
  missingMessage: string | null;
}

export interface KpiData {
  cards: KpiCardData[];
  isLoading: boolean;
}

export function useKpi(): KpiData {
  const { data: entries, isLoading: entriesLoading } = useDailyLogEntries(7);
  const { data: goals, isLoading: goalsLoading } = useHealthGoals();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const isLoading = entriesLoading || goalsLoading || profileLoading;

  const cards = useMemo((): KpiCardData[] => {
    // Waist-to-Height Ratio
    const latestWaist = entries?.find(e => e.waist_cm !== null)?.waist_cm ?? null;
    const heightCm = profile?.height_cm ?? null;

    const waistCard: KpiCardData = (() => {
      if (!heightCm) {
        return {
          title: 'Waist:Height',
          value: '--',
          subtitle: 'Set height in Profile',
          status: 'neutral' as KpiStatus,
          icon: 'tape-measure',
          missingMessage: 'Set height in Profile',
        };
      }
      if (!latestWaist) {
        return {
          title: 'Waist:Height',
          value: '--',
          subtitle: 'Log waist in Daily Log',
          status: 'neutral' as KpiStatus,
          icon: 'tape-measure',
          missingMessage: 'Log waist in Daily Log',
        };
      }
      const ratio = waistToHeightRatio(latestWaist, heightCm);
      return {
        title: 'Waist:Height',
        value: ratio.toFixed(2),
        subtitle: ratio < 0.5 ? 'Healthy range' : 'Above target (< 0.50)',
        status: getWaistToHeightStatus(ratio),
        icon: 'tape-measure',
        missingMessage: null,
      };
    })();

    // 7-Day Average Weight
    const weightValues = entries?.map(e => e.weight_kg) ?? [];
    const avgWeight = averageOfValues(weightValues);

    const weightCard: KpiCardData = (() => {
      if (avgWeight === null) {
        return {
          title: '7-Day Avg Weight',
          value: '--',
          subtitle: 'Log weight in Daily Log',
          status: 'neutral' as KpiStatus,
          icon: 'scale-bathroom',
          missingMessage: 'Log weight in Daily Log',
        };
      }
      const target = goals?.weight_target_kg;
      const subtitle = target ? `Target: ${target} kg` : 'No target set';
      const status: KpiStatus = target ? getKpiStatus(avgWeight, target, true) : 'neutral';
      return {
        title: '7-Day Avg Weight',
        value: `${avgWeight.toFixed(1)} kg`,
        subtitle,
        status,
        icon: 'scale-bathroom',
        missingMessage: null,
      };
    })();

    // Water vs Goal %
    const latestWater = entries?.find(e => e.water_intake_liters !== null)?.water_intake_liters ?? null;

    const waterCard: KpiCardData = (() => {
      const target = goals?.water_target_liters;
      if (!target) {
        return {
          title: 'Water vs Goal',
          value: '--',
          subtitle: 'Set water goal',
          status: 'neutral' as KpiStatus,
          icon: 'water',
          missingMessage: 'Set water goal',
        };
      }
      if (latestWater === null) {
        return {
          title: 'Water vs Goal',
          value: '--',
          subtitle: 'Log water in Daily Log',
          status: 'neutral' as KpiStatus,
          icon: 'water',
          missingMessage: 'Log water in Daily Log',
        };
      }
      const pct = goalPercentage(latestWater, target);
      return {
        title: 'Water vs Goal',
        value: `${Math.round(pct)}%`,
        subtitle: `${latestWater} / ${target} L`,
        status: getKpiStatus(latestWater, target),
        icon: 'water',
        missingMessage: null,
      };
    })();

    // Sleep vs Goal %
    const latestSleep = entries?.find(e => e.sleep_hours !== null)?.sleep_hours ?? null;

    const sleepCard: KpiCardData = (() => {
      const target = goals?.sleep_target_hours;
      if (!target) {
        return {
          title: 'Sleep vs Goal',
          value: '--',
          subtitle: 'Set sleep goal',
          status: 'neutral' as KpiStatus,
          icon: 'sleep',
          missingMessage: 'Set sleep goal',
        };
      }
      if (latestSleep === null) {
        return {
          title: 'Sleep vs Goal',
          value: '--',
          subtitle: 'Log sleep in Daily Log',
          status: 'neutral' as KpiStatus,
          icon: 'sleep',
          missingMessage: 'Log sleep in Daily Log',
        };
      }
      const pct = goalPercentage(latestSleep, target);
      return {
        title: 'Sleep vs Goal',
        value: `${Math.round(pct)}%`,
        subtitle: `${latestSleep.toFixed(1)} / ${target} hrs`,
        status: getKpiStatus(latestSleep, target),
        icon: 'sleep',
        missingMessage: null,
      };
    })();

    return [waistCard, weightCard, waterCard, sleepCard];
  }, [entries, goals, profile]);

  return { cards, isLoading };
}
