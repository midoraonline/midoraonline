import { redirect } from "next/navigation";

export default async function ProductListing({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = q?.trim();
  redirect(term ? `/?q=${encodeURIComponent(term)}` : "/");
}
