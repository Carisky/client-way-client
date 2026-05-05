<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ApiError } from "../api/http";
import type { User, UserRole } from "../api/auth.api";
import { createUserRequest, deactivateUserRequest, listUsersRequest } from "../api/users.api";
import AppLayout from "../components/layout/AppLayout.vue";

const roles: UserRole[] = ["ADMIN", "MANAGER", "USER", "READONLY"];

const users = ref<User[]>([]);
const isLoading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const form = ref({
  email: "",
  password: "",
  fullName: "",
  role: "USER" as UserRole,
});

const loadUsers = async () => {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    users.value = (await listUsersRequest()).users;
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : "Failed to load users";
  } finally {
    isLoading.value = false;
  }
};

const createUser = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await createUserRequest(form.value);
    form.value = {
      email: "",
      password: "",
      fullName: "",
      role: "USER",
    };
    successMessage.value = "User created";
    await loadUsers();
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : "Failed to create user";
  }
};

const deactivateUser = async (id: number) => {
  await deactivateUserRequest(id);
  await loadUsers();
};

onMounted(loadUsers);
</script>

<template>
  <AppLayout>
    <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-2xl font-semibold text-highlighted">Users</h2>
        <p class="mt-1 text-sm text-muted">Create employee accounts and manage access.</p>
      </div>

      <UButton icon="i-lucide-refresh-cw" label="Refresh" variant="outline" @click="loadUsers" />
    </div>

    <div class="grid gap-5 xl:grid-cols-[380px_1fr]">
      <UCard>
        <template #header>
          <h3 class="font-medium text-highlighted">New user</h3>
        </template>

        <form class="space-y-4" @submit.prevent="createUser">
          <UAlert
            v-if="errorMessage"
            color="error"
            variant="soft"
            icon="i-lucide-circle-alert"
            :title="errorMessage"
          />
          <UAlert
            v-if="successMessage"
            color="success"
            variant="soft"
            icon="i-lucide-check"
            :title="successMessage"
          />

          <UFormField label="Full name">
            <UInput v-model="form.fullName" class="w-full" required />
          </UFormField>
          <UFormField label="Email">
            <UInput v-model="form.email" type="email" class="w-full" required />
          </UFormField>
          <UFormField label="Password">
            <UInput v-model="form.password" type="password" class="w-full" required />
          </UFormField>
          <UFormField label="Role">
            <select
              v-model="form.role"
              class="h-9 w-full rounded-md border border-default bg-default px-3 text-sm text-highlighted outline-none focus:border-primary"
            >
              <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
            </select>
          </UFormField>

          <UButton type="submit" icon="i-lucide-user-plus" label="Create user" block />
        </form>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-medium text-highlighted">Employee accounts</h3>
            <UBadge color="neutral" variant="soft">{{ users.length }}</UBadge>
          </div>
        </template>

        <div v-if="isLoading" class="py-10 text-center text-sm text-muted">Loading users...</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-default text-sm">
            <thead>
              <tr class="text-left text-muted">
                <th class="py-3 pr-4 font-medium">Name</th>
                <th class="py-3 pr-4 font-medium">Email</th>
                <th class="py-3 pr-4 font-medium">Role</th>
                <th class="py-3 pr-4 font-medium">Status</th>
                <th class="py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-for="user in users" :key="user.id">
                <td class="py-3 pr-4 font-medium text-highlighted">{{ user.fullName }}</td>
                <td class="py-3 pr-4 text-muted">{{ user.email }}</td>
                <td class="py-3 pr-4">
                  <UBadge color="primary" variant="soft">{{ user.role }}</UBadge>
                </td>
                <td class="py-3 pr-4">
                  <UBadge :color="user.isActive ? 'success' : 'neutral'" variant="soft">
                    {{ user.isActive ? "Active" : "Inactive" }}
                  </UBadge>
                </td>
                <td class="py-3 text-right">
                  <UButton
                    v-if="user.isActive"
                    size="xs"
                    color="error"
                    variant="soft"
                    icon="i-lucide-user-x"
                    label="Deactivate"
                    @click="deactivateUser(user.id)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>
  </AppLayout>
</template>
