import { NextRequest, NextResponse } from "next/server";

import { getDocumentBySlug } from "@/lib/api";
import { toPublicMediaHref } from "@/lib/media";

export const dynamic = "force-dynamic";

function redirectWithoutInternalOrigin(location: string) {
  /*
   * Important : Location peut être relative selon HTTP. En la conservant
   * relative pour /media/, le téléphone réutilise automatiquement l'origine
   * publique qui a servi la page (https://cst.ecc.bj en production, ou l'IP
   * LAN réellement utilisée en développement).
   *
   * Il ne faut surtout pas reconstruire cette URL avec request.nextUrl.origin :
   * derrière Docker/Nginx, Next peut y voir 0.0.0.0:3000 ou une autre origine
   * interne qui est inaccessible — voire bloquée — depuis Safari/Chrome mobile.
   */
  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: location,
      "Cache-Control": "no-store",
    },
  });
}

function fallbackLocation(slug: string) {
  return `/documents/${encodeURIComponent(slug)}`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const doc = await getDocumentBySlug(params.slug);

  if (
    !doc ||
    doc.isConfidential ||
    doc.fileType !== "pdf" ||
    !doc.fileUrl ||
    doc.fileUrl === "#"
  ) {
    return redirectWithoutInternalOrigin(fallbackLocation(params.slug));
  }

  const publicHref = toPublicMediaHref(doc.fileUrl);

  if (!publicHref) {
    return redirectWithoutInternalOrigin(fallbackLocation(params.slug));
  }

  // Les ressources servies par le gateway (/api/ ou /media/) doivent rester
  // sur l’origine publique courante. Les documents passent désormais par
  // l’endpoint Django contrôlé plutôt que par /media/documents/.
  if (publicHref.startsWith("/")) {
    return redirectWithoutInternalOrigin(publicHref);
  }

  // Pour un éventuel PDF externe, n'autoriser que HTTP(S).
  try {
    const target = new URL(publicHref);

    if (!['http:', 'https:'].includes(target.protocol)) {
      return redirectWithoutInternalOrigin(fallbackLocation(params.slug));
    }

    return redirectWithoutInternalOrigin(target.toString());
  } catch {
    return redirectWithoutInternalOrigin(fallbackLocation(params.slug));
  }
}
