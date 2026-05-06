<script setup lang="ts">
import type { AppLanguage } from "../../i18n";
import { useI18n } from "../../i18n";

const { language, languageOptions, setLanguage } = useI18n();

const onChange = (event: Event) => {
  setLanguage((event.target as HTMLSelectElement).value as AppLanguage);
};
</script>

<template>
  <select
    :value="language"
    class="h-9 rounded-md border border-default bg-default px-3 text-sm text-highlighted outline-none focus:border-primary"
    aria-label="Language"
    @change="onChange"
  >
    <option v-for="option in languageOptions" :key="option.value" :value="option.value">
      {{ option.label }}
    </option>
  </select>
</template>
