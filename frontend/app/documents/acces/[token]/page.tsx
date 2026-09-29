import { redirect } from "next/navigation";

export default function LegacySecureDocumentAccessPage() {
  redirect("/documents");
}
