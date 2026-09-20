import { apiFetch } from "./base";

export function submitContactForm(data: {
  full_name: string;
  email: string;
  subject: string;
  message: string;
}) {
  return apiFetch<{ status: string; message: string }>("/api/v1/contactus", {
    method: "POST",
    body: data,
  });
}
