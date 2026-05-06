<script setup lang="ts">
import type { ExpiringItem } from "../../api/dashboard.api";
import { useI18n } from "../../i18n";
import ExpirationCell from "../shared/ExpirationCell.vue";

defineProps<{
  items: ExpiringItem[];
  isLoading: boolean;
}>();

const { t } = useI18n();

const itemTypeLabel = (type: ExpiringItem["itemType"]) => {
  return t(type.replace(/_/g, " "));
};

const itemTarget = (item: ExpiringItem) => {
  return item.itemType === "CONTRACT" ? `/contracts/${item.entityId}` : `/clients/${item.clientId}`;
};
</script>

<template>
  <div v-if="isLoading" class="py-10 text-center text-sm text-muted">{{ t("Loading expiring items...") }}</div>
  <div v-else class="overflow-x-auto">
    <table class="min-w-full divide-y divide-default text-sm">
      <thead>
        <tr class="text-left text-muted">
          <th class="py-3 pr-4 font-medium">{{ t("Client") }}</th>
          <th class="py-3 pr-4 font-medium">{{ t("Item") }}</th>
          <th class="py-3 pr-4 font-medium">{{ t("Type") }}</th>
          <th class="py-3 pr-4 font-medium">{{ t("Status") }}</th>
          <th class="py-3 pr-4 font-medium">{{ t("Owner") }}</th>
          <th class="py-3 text-right font-medium">{{ t("Deadline") }}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-default">
        <tr v-for="item in items" :key="item.id">
          <td class="py-3 pr-4">
            <RouterLink :to="`/clients/${item.clientId}`" class="font-medium text-primary hover:underline">
              {{ item.clientName }}
            </RouterLink>
          </td>
          <td class="py-3 pr-4">
            <RouterLink :to="itemTarget(item)" class="font-medium text-primary hover:underline">
              {{ item.title }}
            </RouterLink>
            <p class="text-xs text-muted">{{ itemTypeLabel(item.itemType) }}</p>
          </td>
          <td class="py-3 pr-4 text-muted">{{ item.contractType ?? "-" }}</td>
          <td class="py-3 pr-4 text-muted">{{ item.status ? t(item.status) : "-" }}</td>
          <td class="py-3 pr-4 text-muted">{{ item.owner?.fullName ?? "-" }}</td>
          <td class="py-3 text-right">
            <ExpirationCell :state="item.state" :days-until="item.daysUntil" :due-at="item.dueAt" />
          </td>
        </tr>
        <tr v-if="!items.length">
          <td colspan="6" class="py-10 text-center text-muted">{{ t("No items match the current filters") }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
