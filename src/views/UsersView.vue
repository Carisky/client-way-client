<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { User, UserRole } from "../api/auth.api";
import { createUserRequest, deactivateUserRequest, listUsersRequest } from "../api/users.api";
import AppLayout from "../components/layout/AppLayout.vue";
import { useAppToast } from "../composables/useAppToast";
import {
  fieldErrorsFromApiError,
  setFieldError,
  type FieldErrors,
} from "../utils/formErrors";

const roles: UserRole[] = ["ADMIN", "MANAGER", "USER", "READONLY"];

const toast = useAppToast();
const users = ref<User[]>([]);
const isLoading = ref(false);
const fieldErrors = ref<FieldErrors>({});
const form = ref({
  email: "",
  password: "",
  fullName: "",
  role: "USER" as UserRole,
});

const fieldError = (path: string) => fieldErrors.value[path];

const validateForm = () => {
  let errors: FieldErrors = {};

  if (form.value.fullName.trim().length < 2) {
    errors = setFieldError(errors, "fullName", "Full name must contain at least 2 characters");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email.trim())) {
    errors = setFieldError(errors, "email", "Invalid email address");
  }

  if (form.value.password.length < 8) {
    errors = setFieldError(errors, "password", "Password must contain at least 8 characters");
  }

  fieldErrors.value = errors;
  return Object.keys(errors).length === 0;
};

const loadUsers = async () => {
  isLoading.value = true;

  try {
    users.value = (await listUsersRequest()).users;
  } catch (error) {
    toast.error(error, "Failed to load users");
  } finally {
    isLoading.value = false;
  }
};

const createUser = async () => {
  fieldErrors.value = {};

  if (!validateForm()) {
    toast.error(new Error("Fix highlighted fields"));
    return;
  }

  try {
    await createUserRequest(form.value);
    form.value = {
      email: "",
      password: "",
      fullName: "",
      role: "USER",
    };
    toast.success("User created");
    await loadUsers();
  } catch (error) {
    fieldErrors.value = fieldErrorsFromApiError(error);
    toast.error(error, "Failed to create user");
  }
};

const deactivateUser = async (id: number) => {
  try {
    await deactivateUserRequest(id);
    toast.success("User deactivated");
    await loadUsers();
  } catch (error) {
    toast.error(error, "Failed to deactivate user");
  }
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

    <div class="grid min-w-0 gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
      <UCard>
        <template #header>
          <h3 class="font-medium text-highlighted">New user</h3>
        </template>

        <form class="space-y-4" novalidate @submit.prevent="createUser">
          <UFormField label="Full name" :error="fieldError('fullName')">
            <UInput v-model="form.fullName" class="w-full" />
          </UFormField>
          <UFormField label="Email" :error="fieldError('email')">
            <UInput v-model="form.email" type="email" class="w-full" />
          </UFormField>
          <UFormField label="Password" :error="fieldError('password')">
            <UInput v-model="form.password" type="password" class="w-full" />
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

      <UCard class="min-w-0">
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
