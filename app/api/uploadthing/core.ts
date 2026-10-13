import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { verifyUploadBearer } from "@/lib/auth/verifyUploadBearer";
import { registerUpload, type UploadKind } from "@/lib/uploads/register";
import { MAX_LISTING_PHOTOS } from "@/lib/uploads/policy";

const f = createUploadthing();

async function requireUser(req: Request): Promise<{ userId: string }> {
  const auth = await verifyUploadBearer(req);
  if (!auth) throw new UploadThingError("Please sign in again to upload.");
  return { userId: auth.userId };
}

/** Every image route takes the original file up to 16MB; nothing is recompressed. */
function imageRoute(kind: UploadKind, maxFileCount: number) {
  return f({ image: { maxFileSize: "16MB", maxFileCount } })
    .middleware(async ({ req }) => requireUser(req))
    .onUploadComplete(async ({ metadata, file }) => {
      await registerUpload({ key: file.key, url: file.ufsUrl, userId: metadata.userId, kind });
      return { url: file.ufsUrl, key: file.key };
    });
}

export const ourFileRouter = {
  productImage: imageRoute("listingPhoto", MAX_LISTING_PHOTOS),
  shopLogo: imageRoute("shopLogo", 1),
  shopBanner: imageRoute("shopBanner", 1),
  verificationDoc: imageRoute("verificationDoc", 1),
  /** Kept for older clients still pointing at the generic route. */
  imageUploader: imageRoute("verificationDoc", 1),
  avatarImage: imageRoute("avatar", 1),

  productVideo: f({
    video: { maxFileSize: "32MB", maxFileCount: 4 },
  })
    .middleware(async ({ req }) => requireUser(req))
    .onUploadComplete(async ({ metadata, file }) => {
      await registerUpload({ key: file.key, url: file.ufsUrl, userId: metadata.userId, kind: "productVideo" });
      return { url: file.ufsUrl, key: file.key };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
