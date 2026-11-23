import { computed, onMounted, onUnmounted, ref, type ComputedRef } from "vue";

/**
 * Short links served by the self-hosted link service. Each placement has its
 * own slug so the click data can be compared per surface.
 */
export const KIE_AFFILIATE_URLS = {
  list: "https://link.littlebigfun.com/kie-list",
  grid: "https://link.littlebigfun.com/kie-grid",
  ai: "https://link.littlebigfun.com/kie-ai",
} as const;

/** Campaign window, in Singapore time. */
export const KIE_CAMPAIGN_START = new Date("2026-12-01T00:00:00+08:00");
export const KIE_CAMPAIGN_END = new Date("2026-12-31T00:00:00+08:00");

export const isKieCampaignActiveAt = (now: number): boolean =>
  now >= KIE_CAMPAIGN_START.getTime() && now < KIE_CAMPAIGN_END.getTime();

const MAX_TIMER_DELAY = 2 ** 31 - 1;

/**
 * Reactive campaign window shared by every KIE placement, so the cards appear
 * and disappear at the same moment without a page reload.
 */
export function useKieCampaign(): { isActive: ComputedRef<boolean> } {
  const now = ref(Date.now());
  let timer: ReturnType<typeof setTimeout> | undefined;

  const schedule = (): void => {
    if (timer !== undefined) clearTimeout(timer);
    const current = Date.now();
    now.value = current;
    const start = KIE_CAMPAIGN_START.getTime();
    const end = KIE_CAMPAIGN_END.getTime();
    const next = current < start ? start : current < end ? end : undefined;
    if (next === undefined) return;
    timer = setTimeout(schedule, Math.min(next - current, MAX_TIMER_DELAY));
  };

  onMounted(schedule);
  onUnmounted(() => {
    if (timer !== undefined) clearTimeout(timer);
  });

  const isActive = computed(() => isKieCampaignActiveAt(now.value));

  return { isActive };
}
