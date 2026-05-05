<script setup lang="ts">
import AppLayout from "../components/layout/AppLayout.vue";
</script>

<template>
  <AppLayout>
    <div class="mb-6">
      <h2 class="text-2xl font-semibold text-highlighted">Dashboard</h2>
      <p class="mt-1 text-sm text-muted">
        Client records, contract drafts and continuous numbering are ready for daily work.
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-shield-check" class="size-5 text-primary" />
            <h3 class="font-medium text-highlighted">Clients</h3>
          </div>
        </template>
        <p class="text-sm text-muted">Create companies, addresses, identifiers and contacts.</p>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-server" class="size-5 text-primary" />
            <h3 class="font-medium text-highlighted">Contracts</h3>
          </div>
        </template>
        <p class="text-sm text-muted">Create contract drafts with type and language variant.</p>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-users" class="size-5 text-primary" />
            <h3 class="font-medium text-highlighted">Numbering</h3>
          </div>
        </template>
        <p class="text-sm text-muted">Confirming a draft assigns the next continuous number.</p>
      </UCard>
    </div>
  </AppLayout>
</template>
