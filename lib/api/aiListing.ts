import { apiFetch } from "./base";

export type ListingQualityRequest = {
  title: string;
  description: string;
  image_urls: string[];
  category?: string | null;
};

export type ListingQualityResponse = {
  ok: boolean;
  score: number;
  title_matches: boolean;
  description_quality: "poor" | "fair" | "good";
  images_match: boolean;
  feedback: string;
  suggestions: string[];
  suggested_title?: string | null;
  suggested_description?: string | null;
  suggested_category?: string | null;
  suggested_subcategory?: string | null;
};

export function checkListingQuality(
  body: ListingQualityRequest,
  token?: string | null,
) {
  return apiFetch<ListingQualityResponse>("/api/v1/ai/listing/quality-check", {
    method: "POST",
    token,
    body,
  });
}
