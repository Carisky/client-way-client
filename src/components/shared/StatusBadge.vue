<script setup lang="ts">
defineProps<{
  status: string | null | undefined;
}>();
</script>

<template>
  <UBadge
    :color="status === 'SIGNED' || status === 'YES' ? 'success' : status === 'DRAFT' ? 'neutral' : 'primary'"
    variant="soft"
  >
    {{ status ?? "Missing" }}
  </UBadge>
</template>
