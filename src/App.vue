<script setup lang="ts">
import { onMounted } from "vue";
import { useRequiredUpdate } from "./composables/useRequiredUpdate";

const {
  currentVersion,
  latestVersion,
  isInstalling,
  isRequired,
  error,
  progressText,
  checkForRequiredUpdate,
  installRequiredUpdate,
} = useRequiredUpdate();

onMounted(() => {
  void checkForRequiredUpdate();
});
</script>

<template>
  <UApp>
    <RouterView />

    <div v-if="isRequired" class="update-lock" role="alertdialog" aria-modal="true">
      <div class="update-lock__panel">
        <p class="update-lock__eyebrow">Update required</p>
        <h1>New version is available</h1>
        <p class="update-lock__copy">
          This build is outdated. Current version {{ currentVersion || "unknown" }},
          latest version {{ latestVersion || "available" }}. Install the update to continue.
        </p>

        <p v-if="progressText" class="update-lock__progress">{{ progressText }}</p>
        <p v-if="error" class="update-lock__error">{{ error }}</p>

        <UButton
          block
          size="xl"
          icon="i-lucide-download"
          :loading="isInstalling"
          :disabled="isInstalling"
          @click="installRequiredUpdate"
        >
          Update
        </UButton>
      </div>
    </div>
  </UApp>
</template>

<style scoped>
.update-lock {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(8, 14, 28, 0.92);
  backdrop-filter: blur(10px);
}

.update-lock__panel {
  width: min(520px, 100%);
  padding: 28px;
  border: 1px solid rgba(76, 132, 207, 0.38);
  border-radius: 8px;
  background: #0f1a2d;
  color: #ffffff;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.36);
}

.update-lock__eyebrow {
  margin: 0 0 8px;
  color: #93c5fd;
  font-size: 14px;
  font-weight: 700;
}

.update-lock__panel h1 {
  margin: 0;
  font-size: 28px;
  line-height: 1.15;
}

.update-lock__copy {
  margin: 14px 0 20px;
  color: #b9d4f4;
  line-height: 1.55;
}

.update-lock__progress {
  margin: 0 0 14px;
  color: #93c5fd;
  font-size: 14px;
}

.update-lock__error {
  margin: 0 0 14px;
  color: #ff7777;
  font-size: 14px;
}
</style>
