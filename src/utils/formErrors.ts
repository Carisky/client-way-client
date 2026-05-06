import { ApiError } from "../api/http";

type ZodIssue = {
  path?: Array<string | number>;
  message?: string;
};

export type FieldErrors = Record<string, string>;

const normalizePath = (path: Array<string | number>) => path.join(".");

export const fieldErrorsFromApiError = (error: unknown): FieldErrors => {
  if (!(error instanceof ApiError) || !Array.isArray(error.details)) {
    return {};
  }

  return (error.details as ZodIssue[]).reduce<FieldErrors>((errors, issue) => {
    if (!issue.path?.length || !issue.message) {
      return errors;
    }

    errors[normalizePath(issue.path)] = issue.message;
    return errors;
  }, {});
};

export const setFieldError = (errors: FieldErrors, path: string, message: string) => ({
  ...errors,
  [path]: message,
});
