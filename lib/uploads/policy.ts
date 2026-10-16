/** One limit for every image: originals up to 16MB are uploaded untouched. */
export const MAX_IMAGE_BYTES = 16 * 1024 * 1024;
export const MAX_IMAGE_MB = 16;
/** Default listing photo cap; the live cap is admin-configured (settings/public limits). */
export const MAX_LISTING_PHOTOS = 3;
/** Hard ceiling for one UploadThing batch; the API enforces the configured cap on save. */
export const LISTING_PHOTO_CEILING = 20;

export type ImageEndpoint =
  | "productImage"
  | "shopLogo"
  | "shopBanner"
  | "verificationDoc"
  | "avatarImage";

export type ImagePolicy = {
  /** Stock/AI/copied-image metadata check. Listing photos only. */
  metadataCheck: boolean;
  /** Optional background removal toggle is offered. */
  allowBackgroundRemoval: boolean;
  /** Shop logo overlay may be applied when a logo URL is given. */
  allowWatermark: boolean;
  maxFiles: number;
  noun: string;
};

export const IMAGE_POLICY: Record<ImageEndpoint, ImagePolicy> = {
  productImage: {
    metadataCheck: true,
    allowBackgroundRemoval: true,
    allowWatermark: true,
    maxFiles: LISTING_PHOTO_CEILING,
    noun: "photo",
  },
  shopLogo: {
    metadataCheck: false,
    allowBackgroundRemoval: true,
    allowWatermark: false,
    maxFiles: 1,
    noun: "logo",
  },
  shopBanner: {
    metadataCheck: false,
    allowBackgroundRemoval: false,
    allowWatermark: false,
    maxFiles: 1,
    noun: "banner",
  },
  verificationDoc: {
    metadataCheck: false,
    allowBackgroundRemoval: false,
    allowWatermark: false,
    maxFiles: 1,
    noun: "document",
  },
  avatarImage: {
    metadataCheck: false,
    allowBackgroundRemoval: false,
    allowWatermark: false,
    maxFiles: 1,
    noun: "photo",
  },
};
