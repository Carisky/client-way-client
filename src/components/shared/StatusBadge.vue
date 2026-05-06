<script setup lang="ts">
import { useI18n } from "../../i18n";

defineProps<{
  status: string | null | undefined;
}>();

const { t } = useI18n();
</script>

<template>
  <UBadge
    :color="status === 'SIGNED' || status === 'YES' ? 'success' : status === 'DRAFT' ? 'neutral' : 'primary'"
    variant="soft"
  >
    {{ status ? t(status) : t("Missing") }}
  </UBadge>
</template>
