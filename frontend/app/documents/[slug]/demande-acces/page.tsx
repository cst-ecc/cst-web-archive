import { redirect } from "next/navigation";

export default function LegacyDocumentAccessRequestPage({
  params,
}: {
  params: { slug: string };
}) {
  redirect(`/documents/${encodeURIComponent(params.slug)}/lire`);
}
