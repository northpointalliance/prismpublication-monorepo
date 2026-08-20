// R2 replaces Supabase Storage. The old client held a service-role key; R2 uses a binding,
// so there is no key to leak and no signed-URL round trip for public reads.
import type { Bindings } from "./env";

export type ImageBucket = "blog" | "ad";

const bucketFor = (env: Bindings, kind: ImageBucket): R2Bucket =>
  kind === "blog" ? env.BLOG_IMAGES : env.AD_IMAGES;

// Public read path. Bind a custom domain such as img.prismpublication.com to the buckets,
// or front them with a Worker route, then serve `${PUBLIC_IMAGE_BASE}/${key}`.
export const publicUrl = (kind: ImageBucket, key: string): string =>
  `https://img.prismpublication.com/${kind}/${key}`;

export const putImage = async (
  env: Bindings,
  kind: ImageBucket,
  key: string,
  body: ArrayBuffer | ReadableStream,
  contentType: string,
): Promise<string> => {
  await bucketFor(env, kind).put(key, body, {
    httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" },
  });
  return publicUrl(kind, key);
};

export const getImage = (env: Bindings, kind: ImageBucket, key: string) =>
  bucketFor(env, kind).get(key);

export const deleteImage = (env: Bindings, kind: ImageBucket, key: string) =>
  bucketFor(env, kind).delete(key);
