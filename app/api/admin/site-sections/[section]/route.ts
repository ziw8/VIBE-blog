import { revalidatePath } from "next/cache";
import { adminIsAuthenticated } from "@/lib/admin-auth";
import {
  isSiteSectionKey,
  validateSiteSectionBody,
} from "@/lib/site-sections";
import {
  getPublicSiteSectionFields,
  getSiteSectionsClient,
  isMissingSiteSectionsTableError,
  siteSectionsStorageIsConfigured,
} from "@/lib/supabase-site-sections";

type AdminSiteSectionRouteContext = {
  params: Promise<{
    section: string;
  }>;
};

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
      message:
        "Supabase 첫 페이지 관리 설정이 필요합니다. supabase/site-sections.sql을 실행해주세요.",
    },
    { status: 503 },
  );
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function revalidateSiteSectionPages(section: string) {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/blog");
  revalidatePath("/admin");
  revalidatePath("/admin/home");
  revalidatePath(`/admin/home/${section}`);
}

export async function PATCH(
  request: Request,
  { params }: AdminSiteSectionRouteContext,
) {
  if (!(await adminIsAuthenticated())) {
    return adminRequiredResponse();
  }

  if (!siteSectionsStorageIsConfigured()) {
    return setupRequiredResponse();
  }

  const { section } = await params;

  if (!isSiteSectionKey(section)) {
    return Response.json({ message: "섹션을 찾지 못했습니다." }, { status: 404 });
  }

  const supabase = getSiteSectionsClient();

  if (!supabase) {
    return setupRequiredResponse();
  }

  const payload = await readJson(request);
  const input = validateSiteSectionBody(
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>).body
      : null,
    section,
  );

  if (!input.ok) {
    return Response.json({ message: input.message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("site_sections")
    .upsert({
      body: input.value,
      key: section,
    })
    .select(getPublicSiteSectionFields())
    .single();

  if (error) {
    if (isMissingSiteSectionsTableError(error)) {
      return setupRequiredResponse();
    }

    return Response.json({ message: "저장하지 못했습니다." }, { status: 500 });
  }

  revalidateSiteSectionPages(section);

  return Response.json({ section: data });
}
