"use client";

import { useActionState, useRef, useState } from "react";
import { submitProjectAction } from "@/app/actions/projects";
import { IDLE_STATE } from "@/lib/action-state";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/provider";
import { FormMessage } from "@/components/form-message";
import type { MessageKey } from "@/i18n";

const MAX_SCREENSHOTS = 3;

export function DeliveryForm({ claimId }: { claimId: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(submitProjectAction, IDLE_STATE);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<MessageKey | null>(null);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  // Files go straight from the browser to Storage under a folder named after
  // the user id, which is the only path the storage policy accepts. The action
  // then only ever receives public URLs.
  async function upload(files: FileList) {
    setUploading(true);
    setUploadError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUploadError("common.genericError");
      setUploading(false);
      return;
    }

    const uploaded: string[] = [];

    for (const file of Array.from(files).slice(0, MAX_SCREENSHOTS - screenshots.length)) {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("screenshots").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

      if (error) {
        setUploadError("common.genericError");
        break;
      }

      uploaded.push(supabase.storage.from("screenshots").getPublicUrl(path).data.publicUrl);
    }

    setScreenshots((current) => [...current, ...uploaded].slice(0, MAX_SCREENSHOTS));
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  if (state.status === "success" && state.messageKey) {
    return (
      <div className="mt-5">
        <FormMessage tone="success" messageKey={state.messageKey} />
      </div>
    );
  }

  return (
    <form action={action} className="mt-5 flex flex-col gap-4 border-t border-rule pt-5">
      <div>
        <h3 className="text-lg">{t("delivery.title")}</h3>
        <p className="prose-body mt-1 text-sm">{t("delivery.subtitle")}</p>
      </div>

      {state.status === "error" && state.messageKey ? (
        <FormMessage tone="error" messageKey={state.messageKey} params={state.params} />
      ) : null}
      {uploadError ? <FormMessage tone="error" messageKey={uploadError} /> : null}

      <input type="hidden" name="claim_id" value={claimId} />

      <div>
        <label className="field-label" htmlFor={`url-${claimId}`}>
          {t("delivery.fieldUrl")}
        </label>
        <input
          id={`url-${claimId}`}
          name="url"
          type="url"
          required
          className="input"
          placeholder="https://"
        />
        <p className="field-hint">{t("delivery.fieldUrlHint")}</p>
      </div>

      <div>
        <label className="field-label" htmlFor={`repo-${claimId}`}>
          {t("delivery.fieldRepo")}{" "}
          <span className="font-normal text-ink-faint">({t("common.optional")})</span>
        </label>
        <input id={`repo-${claimId}`} name="repo_url" type="url" className="input" placeholder="https://" />
      </div>

      <div>
        <label className="field-label" htmlFor={`description-${claimId}`}>
          {t("delivery.fieldDescription")}
        </label>
        <textarea id={`description-${claimId}`} name="description" rows={3} className="input" />
      </div>

      <div>
        <label className="field-label" htmlFor={`files-${claimId}`}>
          {t("delivery.fieldScreenshots")}
        </label>
        <input
          id={`files-${claimId}`}
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="input py-2"
          disabled={uploading || screenshots.length >= MAX_SCREENSHOTS}
          onChange={(event) => {
            if (event.target.files?.length) void upload(event.target.files);
          }}
        />
        <p className="field-hint">{t("delivery.fieldScreenshotsHint")}</p>

        {screenshots.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-3">
            {screenshots.map((url) => (
              <li key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="h-20 w-32 rounded-lg border border-rule object-cover"
                />
                <input type="hidden" name="screenshots" value={url} />
                <button
                  type="button"
                  className="btn btn-secondary absolute -right-2 -top-2 h-7 min-h-0 w-7 rounded-full p-0 text-xs"
                  onClick={() => setScreenshots((current) => current.filter((item) => item !== url))}
                  aria-label={t("common.close")}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <button
        type="submit"
        className="btn btn-primary self-start"
        disabled={pending || uploading || screenshots.length === 0}
      >
        {pending || uploading ? t("common.loading") : t("delivery.submit")}
      </button>
    </form>
  );
}
