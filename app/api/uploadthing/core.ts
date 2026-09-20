import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { verifyUploadBearer } from "@/lib/auth/verifyUploadBearer";

const f = createUploadthing();

async function requireUser(req: Request): Promise<{ userId: string }> {
  const auth = await verifyUploadBearer(req);
  if (!auth) throw new UploadThingError("Unauthorized");
  return auth;
}

export const ourFileRouter = {
  shopLogo: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => requireUser(req))
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),

  productImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 8 },
  })
    .middleware(async ({ req }) => requireUser(req))
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),

  imageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => requireUser(req))
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  productVideo: f({
    video: { maxFileSize: "32MB", maxFileCount: 4 },
  })
    .middleware(async ({ req }) => requireUser(req))
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
