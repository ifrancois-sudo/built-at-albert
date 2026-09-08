import type { Metadata } from "next";
import { requireViewer } from "@/lib/auth";
import { getTranslator } from "@/i18n/server";
import { NewIdeaForm } from "./new-idea-form";

export const metadata: Metadata = { title: "Proposer une idée" };

export default async function NewIdeaPage() {
  const viewer = await requireViewer();
  const t = await getTranslator();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl">{t("ideas.newTitle")}</h1>
      <p className="prose-body mt-1.5 text-sm">{t("ideas.newSubtitle")}</p>
      <NewIdeaForm defaultCampus={viewer.profile.campus ?? ""} />
    </div>
  );
}
