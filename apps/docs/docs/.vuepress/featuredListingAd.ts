import { ref, type Ref } from "vue";

export type TimedCampaignState = {
  isActive: Ref<boolean>;
  start: () => void;
  stop: () => void;
};

export const createTimedCampaignState = (
  campaignEnd: Date,
): TimedCampaignState => {
  const campaignEndTime = campaignEnd.getTime();
  const isActive = ref(Date.now() < campaignEndTime);
  let expiryTimer: ReturnType<typeof setTimeout> | undefined;

  const stop = (): void => {
    if (expiryTimer === undefined) return;
    clearTimeout(expiryTimer);
    expiryTimer = undefined;
  };

  const start = (): void => {
    stop();
    const remainingTime = campaignEndTime - Date.now();
    isActive.value = remainingTime > 0;
    if (!isActive.value) return;

    expiryTimer = setTimeout(() => {
      isActive.value = false;
      expiryTimer = undefined;
    }, remainingTime);
  };

  return { isActive, start, stop };
};
