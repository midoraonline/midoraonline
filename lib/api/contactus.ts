import { apiFetch } from "./base";

export function submitContactForm(data: {
  full_name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const qs = new URLSearchParams(data);
  return apiFetch<{ status: string; message: string }>(
    `/api/v1/contactus?${qs.toString()}`,
    { method: "POST" }
  );
}
