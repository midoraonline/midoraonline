import { apiFetch } from "./base";

export function submitFeedback(feedbackText: string) {
  return apiFetch<{ status: string; message: string }>("/api/v1/feedback", {
    method: "POST",
    body: JSON.stringify({ feedback_text: feedbackText }),
  });
}
