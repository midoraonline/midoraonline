import type { Dispatch, SetStateAction } from "react";
import type { ItemType, Product } from "@/lib/api/products";
import type { ListingKind } from "@/lib/listingMeta";
import type { ListingDraft, ListingFieldErrors } from "@/lib/schemas/listingForm";

export type FormDraft = ListingDraft;
export type SetDraft = Dispatch<SetStateAction<FormDraft>>;
export type SectionKey = "intent" | "media" | "details" | "location" | "price" | "category" | "meta";
export type IntentErrors = { intent?: string; title?: string; application_link?: string };
export type ServerSection = { key: SectionKey; message: string };

/** Shared by the field sections: validation state plus the API rejection for that section. */
export type SectionProps = {
  draft: FormDraft;
  setDraft: SetDraft;
  showErrors: boolean;
  errors: ListingFieldErrors;
  invalid: boolean;
  serverMessage: string | null;
  /** Clears this section's API rejection once the merchant edits it. */
  onEdited: () => void;
};

export type ProductFormPageProps = {
  mode: "add" | "edit";
  product?: Product;
  /** Omit on create so the API attaches a personal profile or the only real shop. */
  shopId?: string;
  /** The "Other" choice: post on the personal profile even if the user owns shops. */
  noShop?: boolean;
  itemType?: ItemType;
  /** Set by the post-item type step. Changing it keeps the rest of the draft. */
  listingKind?: ListingKind;
  shopLabel?: string | null;
  onChangeType?: () => void;
  onChangeShop?: () => void;
  onVerificationRequired?: () => void;
  /** Known `can_post` from the caller (post-item already fetched it). */
  contactVerified?: boolean;
  backUrl?: string;
  /** In a step flow: Back goes to the previous step (draft stays mounted). */
  onBack?: () => void;
  /** Several shops: parent shows the picker. The draft stays mounted. */
  onShopRequired?: () => void;
  // Post-item / standalone flows don't render the mobile BottomNav, so the
  // sticky action bar shouldn't leave a gap where the nav would be.
  hasBottomNav?: boolean;
  flush?: boolean;
};
