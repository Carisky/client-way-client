<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  fetchContractNumberSettings,
  updateContractNumberSettings,
  type ContractNumberSettings,
} from "../api/settings.api";
import AppLayout from "../components/layout/AppLayout.vue";
import { useAppToast } from "../composables/useAppToast";
import { useI18n } from "../i18n";

const toast = useAppToast();
const { t } = useI18n();

const settings = ref<ContractNumberSettings | null>(null);
const nextNumber = ref<number | string>(1);
const isLoading = ref(false);
const isSaving = ref(false);

const loadSettings = async () => {
  isLoading.value = true;

  try {
    const response = await fetchContractNumberSettings();
    settings.value = response.settings;
    nextNumber.value = response.settings.nextNumber;
  } catch (error) {
    toast.error(error, "Failed to load settings");
  } finally {
    isLoading.value = false;
  }
};

const saveSettings = async () => {
  isSaving.value = true;

  try {
    const requestedNumber = Number(nextNumber.value);
    const response = await updateContractNumberSettings(requestedNumber);
    settings.value = response.settings;
    nextNumber.value = response.settings.nextNumber;

    if (response.settings.nextNumber > requestedNumber) {
      toast.success(t("Numbering start raised to {number}", { number: response.settings.nextNumber }));
    } else {
      toast.success(t("Settings saved"));
    }
  } catch (error) {
    toast.error(error, "Failed to save settings");
  } finally {
    isSaving.value = false;
  }
};

onMounted(loadSettings);
</script>

<template>
  <AppLayout>
    <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-2xl font-semibold text-highlighted">{{ t("Settings") }}</h2>
        <p class="mt-1 text-sm text-muted">{{ t("Configure administrative system defaults.") }}</p>
      </div>

      <UButton
        icon="i-lucide-refresh-cw"
        :label="t('Refresh')"
        variant="outline"
        :loading="isLoading"
        @click="loadSettings"
      />
    </div>

    <UCard class="max-w-xl">
      <template #header>
        <h3 class="font-medium text-highlighted">{{ t("Contract numbering") }}</h3>
      </template>

      <form class="space-y-4" novalidate @submit.prevent="saveSettings">
        <UFormField :label="t('Continue numbering from')">
          <UInput
            v-model="nextNumber"
            type="number"
            min="1"
            class="w-full"
            :disabled="isLoading"
          />
        </UFormField>

        <p v-if="settings" class="text-sm text-muted">
          {{ t("Minimum from existing contracts: {number}", { number: settings.minimumNextNumber }) }}
        </p>

        <UButton
          type="submit"
          icon="i-lucide-save"
          :label="t('Save')"
          :loading="isSaving"
          :disabled="isLoading"
        />
      </form>
    </UCard>
  </AppLayout>
</template>
