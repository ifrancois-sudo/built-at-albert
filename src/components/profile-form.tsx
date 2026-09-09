"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import { useSession } from "@/lib/session";
import { useT } from "@/i18n/provider";
import { FormMessage } from "@/components/form-message";

/** Right of rectification, and the only way to fix a typo in your own name. */
export function ProfileForm() {
  const t = useT();
  const { profile, reload } = useSession();
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;

    const form = new FormData(event.currentTarget);
    setPending(true);
    setSaved(false);
    setFailed(false);

    // role is not in the client's column grant, so it cannot be sent from here
    // whatever the form contains.
    const { error } = await supabase()
      .from("profiles")
      .update({
        full_name: String(form.get("full_name") ?? "").trim(),
        promo: String(form.get("promo") ?? "").trim() || null,
        campus: String(form.get("campus") ?? "").trim() || null,
      })
      .eq("id", profile.id);

    setPending(false);
    if (error) return setFailed(true);

    setSaved(true);
    await reload();
  }

  if (!profile) return null;

  return (
    <form onSubmit={onSubmit} className="surface mt-4 flex flex-col gap-5 p-6">
      <p className="prose-body">{t("profile.body")}</p>

      {saved ? <FormMessage tone="success" messageKey="profile.saved" /> : null}
      {failed ? <FormMessage tone="error" messageKey="common.genericError" /> : null}

      <div>
        <label className="field-label" htmlFor="full_name">
          {t("auth.fullNameLabel")}
        </label>
        <input
          id="full_name"
          name="full_name"
          required
          defaultValue={profile.full_name ?? ""}
          autoComplete="name"
          className="input"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="promo">
            {t("auth.promoLabel")}
          </label>
          <input id="promo" name="promo" defaultValue={profile.promo ?? ""} className="input" />
        </div>
        <div>
          <label className="field-label" htmlFor="campus">
            {t("auth.campusLabel")}
          </label>
          <input id="campus" name="campus" defaultValue={profile.campus ?? ""} className="input" />
        </div>
      </div>

      <button type="submit" className="btn btn-primary self-start" disabled={pending}>
        {pending ? t("common.loading") : t("profile.save")}
      </button>
    </form>
  );
}
