import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { adminIsAuthenticated } from "@/lib/admin-auth";

const POST_MEDIA_BUCKET =
  process.env.SUPABASE_POST_MEDIA_BUCKET?.trim() || "post-media";
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const VIDEO_MAX_BYTES = 80 * 1024 * 1024;
const allowedImageTypes = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const allowedVideoTypes = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

function adminRequiredResponse() {
  return Response.json(
    { message: "관리자 권한이 필요합니다." },
    { status: 401 },
  );
}

function setupRequiredResponse() {
  return Response.json(
    {
      setupRequired: true,
      message: "Supabase 업로드 설정이 필요합니다.",
    },
    { status: 503 },
  );
}

function getSupabaseKey() {
  return (
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function getUploadsClient() {
  const url = process.env.SUPABASE_URL;
  const key = getSupabaseKey();

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getExtension(file: File) {
  const [, subtype] = file.type.split("/");
  const fallback = subtype || "bin";

  return (
    file.name
      .normalize("NFKC")
      .toLowerCase()
      .match(/\.([a-z0-9]+)$/)?.[1] ?? fallback.replace("quicktime", "mov")
  );
}

async function ensurePostMediaBucket(
  supabase: NonNullable<ReturnType<typeof getUploadsClient>>,
) {
  const { data: bucket, error: getError } =
    await supabase.storage.getBucket(POST_MEDIA_BUCKET);

  if (!getError) {
    if (bucket.public === false) {
      const { error: updateError } = await supabase.storage.updateBucket(
        POST_MEDIA_BUCKET,
        {
          allowedMimeTypes: [
            ...Array.from(allowedImageTypes),
            ...Array.from(allowedVideoTypes),
          ],
          fileSizeLimit: VIDEO_MAX_BYTES,
          public: true,
        },
      );

      return updateError;
    }

    return null;
  }

  const { error: createError } = await supabase.storage.createBucket(
    POST_MEDIA_BUCKET,
    {
      allowedMimeTypes: [
        ...Array.from(allowedImageTypes),
        ...Array.from(allowedVideoTypes),
      ],
      fileSizeLimit: VIDEO_MAX_BYTES,
      public: true,
    },
  );

  if (
    createError &&
    !createError.message.toLowerCase().includes("already exists")
  ) {
    return createError;
  }

  return null;
}

export async function POST(request: Request) {
  if (!(await adminIsAuthenticated())) {
    return adminRequiredResponse();
  }

  const supabase = getUploadsClient();

  if (!supabase) {
    return setupRequiredResponse();
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const kind = formData?.get("kind");

  if (!(file instanceof File) || (kind !== "image" && kind !== "video")) {
    return Response.json(
      { message: "업로드할 파일을 다시 확인해주세요." },
      { status: 400 },
    );
  }

  const allowedTypes = kind === "image" ? allowedImageTypes : allowedVideoTypes;
  const maxBytes = kind === "image" ? IMAGE_MAX_BYTES : VIDEO_MAX_BYTES;

  if (!allowedTypes.has(file.type)) {
    return Response.json(
      {
        message:
          kind === "image"
            ? "이미지는 jpg, png, webp, gif, avif만 업로드할 수 있습니다."
            : "동영상은 mp4, webm, mov만 업로드할 수 있습니다.",
      },
      { status: 400 },
    );
  }

  if (file.size > maxBytes) {
    return Response.json(
      {
        message:
          kind === "image"
            ? "이미지는 5MB 이하로 업로드해주세요."
            : "동영상은 80MB 이하로 업로드해주세요.",
      },
      { status: 400 },
    );
  }

  const bucketError = await ensurePostMediaBucket(supabase);

  if (bucketError) {
    return Response.json(
      { message: "업로드 버킷을 준비하지 못했습니다." },
      { status: 500 },
    );
  }

  const date = new Date().toISOString().slice(0, 10);
  const path = `${kind}s/${date}/${randomUUID()}.${getExtension(file)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(POST_MEDIA_BUCKET)
    .upload(path, buffer, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return Response.json(
      { message: "파일을 업로드하지 못했습니다." },
      { status: 500 },
    );
  }

  const { data } = supabase.storage
    .from(POST_MEDIA_BUCKET)
    .getPublicUrl(path);

  return Response.json({
    path,
    url: data.publicUrl,
  });
}
