import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

/**
 * Auth for uploads: require Bearer token so only logged-in users can upload.
 * Token is validated by presence; your API can verify it via /auth/me if needed.
 * All uploads are signed server-side using UPLOADTHING_TOKEN (encrypted at rest).
 */
function getAuth(req: Request): { userId: string } | null {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token?.trim()) return null;
  // Optional: decode JWT or call auth/me to get userId; for now use a stable id from token
  return { userId: token.slice(-12) || "user" };
}

export const ourFileRouter = {
  /** Shop logo: single image, 4MB. Use for shop logo_url. */
  shopLogo: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const auth = getAuth(req);
      if (!auth) throw new UploadThingError("Unauthorized");
      return { userId: auth.userId };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),

  /** Product image: single image, 4MB. Use for product image_url. */
  productImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const auth = getAuth(req);
      if (!auth) throw new UploadThingError("Unauthorized");
      return { userId: auth.userId };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),

  /** General image upload: single image, 4MB. Use for any other image (e.g. AI, profile). */
  imageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const auth = getAuth(req);
      if (!auth) throw new UploadThingError("Unauthorized");
      return { userId: auth.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
