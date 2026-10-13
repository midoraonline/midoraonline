/** One limit for every image: originals up to 16MB are uploaded untouched. */
export const MAX_IMAGE_BYTES = 16 * 1024 * 1024;
export const MAX_IMAGE_MB = 16;
/** A listing holds at most 3 photos in total. */
export const MAX_LISTING_PHOTOS = 3;

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
    maxFiles: MAX_LISTING_PHOTOS,
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
