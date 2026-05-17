<script setup lang="ts">
import ContributorBadgeIcon from "@/components/ContributorBadgeIcon.vue";

type ContributorBadge = {
  id: string;
  title: string;
  description: string;
  category: "count" | "rank" | "year" | "history" | "support";
  tier?: number;
  metric?: number;
  rank?: number;
  year?: number;
  icon: string;
  tone: "hunter" | "owner" | "history" | "support" | "muted";
  accent?: string;
};

defineProps<{
  badges: ContributorBadge[];
}>();

const getBadgeDetail = function (badge: ContributorBadge): string {
  if (badge.category === "rank" && badge.tier) return `Top ${badge.tier}`;
  if (badge.category === "year" && badge.year) return `${badge.year}`;
  if (badge.category === "count" && badge.tier && badge.tier > 1) {
    return `${badge.tier}+`;
  }
  return "";
};

const getBadgeIconLabel = function (badge: ContributorBadge): string {
  if (badge.category === "rank" && badge.tier) return `${badge.tier}`;
  if (badge.category === "year" && badge.year) return `${badge.year}`;
  return getBadgeDetail(badge);
};

const getBadgeStyle = function (badge: ContributorBadge): Record<string, string> {
  return badge.accent ? { "--badge-accent": badge.accent } : {};
};

const getBadgeAriaLabel = function (badge: ContributorBadge): string {
  const detail = getBadgeDetail(badge);
  return [badge.title, detail, badge.description].filter(Boolean).join(". ");
};
</script>

<template>
  <div
    v-if="badges.length"
    class="profile-badges"
    aria-label="Contributor badge wall"
  >
    <div
      v-for="badge in badges"
      :key="badge.id"
      class="profile-badge"
      :class="`profile-badge-${badge.tone}`"
      :style="getBadgeStyle(badge)"
      tabindex="0"
      :aria-label="getBadgeAriaLabel(badge)"
      :aria-describedby="`badge-tooltip-${badge.id}`"
    >
      <ContributorBadgeIcon
        :icon="badge.icon"
        :label="getBadgeIconLabel(badge)"
      />
      <span
        :id="`badge-tooltip-${badge.id}`"
        class="profile-badge-tooltip"
        role="tooltip"
      >
        <span class="profile-badge-title">
          {{ badge.title }}
          <span v-if="getBadgeDetail(badge)" class="profile-badge-detail">
            {{ getBadgeDetail(badge) }}
          </span>
        </span>
        <span class="profile-badge-description">{{ badge.description }}</span>
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.profile-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 0.75rem;
}

.profile-badge {
  position: relative;
  width: 70px;
  height: 70px;
  color: var(--badge-accent);
  cursor: help;

  &:focus-visible {
    outline: 2px solid var(--badge-accent);
    outline-offset: 3px;
    border-radius: 50%;
  }

  &:hover,
  &:focus-visible {
    .profile-badge-tooltip {
      opacity: 1;
      transform: translate(-50%, -0.25rem);
      visibility: visible;
    }
  }
}

.profile-badge-tooltip {
  position: absolute;
  bottom: calc(100% + 0.55rem);
  left: 50%;
  z-index: 2;
  width: max-content;
  max-width: min(18rem, calc(100vw - 2rem));
  padding: 0.55rem 0.65rem;
  border: 1px solid var(--c-border);
  border-radius: 6px;
  background: var(--c-bg);
  box-shadow: 0 0.4rem 1rem rgb(0 0 0 / 14%);
  color: var(--c-text);
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 0);
  transition:
    opacity 0.15s ease,
    transform 0.15s ease,
    visibility 0.15s ease;
  visibility: hidden;

  &::after {
    position: absolute;
    bottom: -0.38rem;
    left: 50%;
    width: 0.7rem;
    height: 0.7rem;
    border-right: 1px solid var(--c-border);
    border-bottom: 1px solid var(--c-border);
    background: var(--c-bg);
    content: "";
    transform: translateX(-50%) rotate(45deg);
  }
}

.profile-badge-title {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  align-items: baseline;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.2;
}

.profile-badge-detail {
  color: var(--c-text-light);
  font-size: 0.78rem;
  font-weight: 600;
}

.profile-badge-description {
  display: block;
  margin-top: 0.15rem;
  color: var(--c-text-light);
  font-size: 0.76rem;
  line-height: 1.25;
}

.profile-badge-hunter {
  --badge-accent: #2f7d78;
}

.profile-badge-owner {
  --badge-accent: #816a2d;
}

.profile-badge-history {
  --badge-accent: #8a5b3d;
}

.profile-badge-support {
  --badge-accent: #b24b68;
}

.profile-badge-muted {
  --badge-accent: #7a7f87;
}
</style>
