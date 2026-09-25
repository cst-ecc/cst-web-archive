import { NextRequest, NextResponse } from "next/server";

import { getDocumentBySlug } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const doc = await getDocumentBySlug(params.slug);

  if (
    !doc ||
    doc.fileType !== "pdf" ||
    !doc.fileUrl ||
    doc.fileUrl === "#"
  ) {
    return NextResponse.redirect(
      new URL(`/documents/${encodeURIComponent(params.slug)}`, request.url),
      307,
    );
  }

  let target: URL;

  try {
    target = new URL(doc.fileUrl, request.nextUrl.origin);
  } catch {
    return NextResponse.redirect(
      new URL(`/documents/${encodeURIComponent(params.slug)}`, request.url),
      307,
    );
  }

  if (!['http:', 'https:'].includes(target.protocol)) {
    return NextResponse.redirect(
      new URL(`/documents/${encodeURIComponent(params.slug)}`, request.url),
      307,
    );
  }

  const response = NextResponse.redirect(target, 307);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
