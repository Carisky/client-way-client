<script setup lang="ts">
import AppLayout from "../components/layout/AppLayout.vue";
</script>

<template>
  <AppLayout>
    <div class="mb-6">
      <h2 class="text-2xl font-semibold text-highlighted">Dashboard</h2>
      <p class="mt-1 text-sm text-muted">
        Foundation is ready. Business modules will attach here in the next phases.
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-shield-check" class="size-5 text-primary" />
            <h3 class="font-medium text-highlighted">Authenticated shell</h3>
          </div>
        </template>
        <p class="text-sm text-muted">Routes require a valid API token before loading app views.</p>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-server" class="size-5 text-primary" />
            <h3 class="font-medium text-highlighted">API boundary</h3>
          </div>
        </template>
        <p class="text-sm text-muted">HTTP calls are centralized in typed API modules.</p>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-users" class="size-5 text-primary" />
            <h3 class="font-medium text-highlighted">Accounts</h3>
          </div>
        </template>
        <p class="text-sm text-muted">Admin users can create and deactivate employee accounts.</p>
      </UCard>
    </div>
  </AppLayout>
</template>
