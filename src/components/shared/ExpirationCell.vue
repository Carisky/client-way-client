<script setup lang="ts">
import type { ExpirationState } from "../../api/dashboard.api";

defineProps<{
  state: ExpirationState;
  daysUntil: number | null;
  dueAt: string | null;
}>();

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
    return "No date";
  }

  if (days < 0) {
    return `${Math.abs(days)}d overdue`;
  }

  if (days === 0) {
    return "Today";
  }

  return `${days}d left`;
};
</script>

<template>
  <div class="space-y-1">
    <UBadge :color="colors[state]" variant="soft">{{ labels[state] }}</UBadge>
    <p class="text-xs text-muted">{{ dueLabel(dueAt) }} · {{ daysLabel(daysUntil) }}</p>
  </div>
</template>
