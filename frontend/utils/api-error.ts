import { AxiosError } from "axios";

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const responseMessage = error.response?.data?.message;
    if (typeof responseMessage === "string") {
      return responseMessage;
    }
  }

  return fallback;
}
