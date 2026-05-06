import { useToast } from "@nuxt/ui/composables";
import { ApiError } from "../api/http";

export const useAppToast = () => {
  const toast = useToast();

  const success = (title: string, description?: string, onClick?: () => void) => {
    toast.add({
      title,
      description,
      color: "success",
      icon: "i-lucide-check",
      onClick,
    });
  };

  const error = (err: unknown, fallback = "Operation failed") => {
    toast.add({
      title: err instanceof ApiError || err instanceof Error ? err.message : fallback,
      color: "error",
      icon: "i-lucide-circle-alert",
    });
  };

  return { success, error };
};
