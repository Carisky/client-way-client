import { useToast } from "@nuxt/ui/composables";
import { ApiError } from "../api/http";
import { useI18n } from "../i18n";

export const useAppToast = () => {
  const toast = useToast();
  const { t } = useI18n();

  const success = (title: string, description?: string, onClick?: () => void) => {
    toast.add({
      title: t(title),
      description: description ? t(description) : undefined,
      color: "success",
      icon: "i-lucide-check",
      onClick,
    });
  };

  const error = (err: unknown, fallback = "Operation failed") => {
    toast.add({
      title: t(err instanceof ApiError || err instanceof Error ? err.message : fallback),
      color: "error",
      icon: "i-lucide-circle-alert",
    });
  };

  return { success, error };
};
