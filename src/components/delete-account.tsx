"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useT } from "@/i18n/provider";
import { FormMessage } from "@/components/form-message";

/**
 * Erasure, behind a typed confirmation rather than a single button.
 *
 * The action cannot be undone and the wording has to be honest about what
 * survives it, so the panel says so before it offers the button, not after.
 */
export function DeleteAccount() {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const word = t("danger.word");

  async function erase() {
    setPending(true);
    setFailed(false);

    try {
      const {
        data: { session },
      } = await supabase().auth.getSession();
      if (!session) throw new Error("no session");

      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error(`status ${response.status}`);

      await supabase().auth.signOut();
      router.replace("/");
    } catch (error) {
      console.error("[account] erasure failed", error);
      setFailed(true);
      setPending(false);
    }
  }

  return (
    <section className="mt-14 rounded-[5px] border-2 border-bad p-6">
      <h2 className="text-[1.6rem] leading-tight text-bad">{t("danger.title")}</h2>
      <p className="prose-body mt-3">{t("danger.body")}</p>
      <p className="prose-body mt-2">{t("danger.release")}</p>

      {failed ? (
        <div className="mt-5">
          <FormMessage tone="error" messageKey="danger.failed" />
        </div>
      ) : null}

      {open ? (
        <div className="mt-6">
          <label className="field-label" htmlFor="confirm-word">
            {t("danger.typeToConfirm")}
          </label>
          <input
            id="confirm-word"
            className="input max-w-xs"
            value={typed}
            autoComplete="off"
            onChange={(event) => setTyped(event.target.value)}
          />

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className="btn btn-danger"
              disabled={pending || typed.trim().toUpperCase() !== word}
              onClick={erase}
            >
              {pending ? t("common.loading") : t("danger.confirm")}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setOpen(false);
                setTyped("");
              }}
            >
              {t("danger.cancel")}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn-danger mt-6" onClick={() => setOpen(true)}>
          {t("danger.start")}
        </button>
      )}
    </section>
  );
}
