<script setup lang="ts">
import type { ExpirationState } from "../../api/dashboard.api";
import { useI18n } from "../../i18n";

defineProps<{
  state: ExpirationState;
  daysUntil: number | null;
  dueAt: string | null;
}>();

const { t } = useI18n();

const labels: Record<ExpirationState, string> = {
  EXPIRED: "Expired",
  SOON: "Soon",
  OK: "OK",
  MISSING: "Missing",
};

const colors: Record<ExpirationState, "error" | "warning" | "success" | "neutral"> = {
  EXPIRED: "error",
  SOON: "warning",
  OK: "success",
  MISSING: "neutral",
};

const dueLabel = (value: string | null) => value?.slice(0, 10) ?? "-";
const daysLabel = (days: number | null) => {
  if (days === null) {
    return t("No date");
  }

  if (days < 0) {
    return `${Math.abs(days)}${t("d overdue")}`;
  }

  if (days === 0) {
    return t("Today");
  }

  return `${days}${t("d left")}`;
};
</script>

<template>
  <div class="space-y-1">
    <UBadge :color="colors[state]" variant="soft">{{ t(labels[state]) }}</UBadge>
    <p class="text-xs text-muted">{{ dueLabel(dueAt) }} &middot; {{ daysLabel(daysUntil) }}</p>
  </div>
</template>
