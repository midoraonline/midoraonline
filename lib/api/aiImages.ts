import { apiFetch } from "./base";

export type RemoveBackgroundResponse = {
  image_url?: string | null;
};

export function removeBackground(
  body: { image_url: string },
  token?: string | null,
) {
  return apiFetch<RemoveBackgroundResponse>("/api/v1/ai/remove-background", {
    method: "POST",
    token,
    body,
  });
}
