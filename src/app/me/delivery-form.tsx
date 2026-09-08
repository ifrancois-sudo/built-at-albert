"use client";

import { useRef, useState, type FormEvent } from "react";
import { useT } from "@/i18n/provider";
import { FormMessage } from "@/components/form-message";
import { submitProject, uploadScreenshot } from "@/lib/api/projects";
import { errorMessageKey } from "@/lib/errors";
import { isHttpUrl } from "@/lib/format";
import type { MessageKey } from "@/i18n";

const MAX_SCREENSHOTS = 3;

export function DeliveryForm({
  claimId,
  userId,
  onDelivered,
}: {
  claimId: string;
  userId: string;
  onDelivered: () => Promise<void>;
}) {
  const t = useT();
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const [done, setDone] = useState(false);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  // Files go straight from the browser to Storage, into a folder named after
  // the user id, which is the only path the storage policy accepts.
  async function upload(files: FileList) {
    setUploading(true);
    setError(null);

    const room = MAX_SCREENSHOTS - screenshots.length;
    const uploaded: string[] = [];

    for (const file of Array.from(files).slice(0, room)) {
      const url = await uploadScreenshot(userId, file);
      if (!url) {
        setError("common.genericError");
        break;
      }
      uploaded.push(url);
    }

    setScreenshots((current) => [...current, ...uploaded].slice(0, MAX_SCREENSHOTS));
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const url = String(form.get("url") ?? "").trim();
    const repoUrl = String(form.get("repo_url") ?? "").trim();

    if (!isHttpUrl(url)) return setError("delivery.errorUrl");
    if (repoUrl.length > 0 && !isHttpUrl(repoUrl)) return setError("delivery.errorUrl");
    if (screenshots.length < 1 || screenshots.length > MAX_SCREENSHOTS) {
      return setError("delivery.errorScreenshots");
    }

    setPending(true);
    setError(null);

    const { error: submitError } = await submitProject({
      claimId,
      url,
      repoUrl,
      description: String(form.get("description") ?? "").trim(),
      screenshots,
    });

    setPending(false);
    if (submitError) return setError(errorMessageKey(submitError));

    setDone(true);
    await onDelivered();
  }

  if (done) {
    return (
      <div className="mt-5">
        <FormMessage tone="success" messageKey="delivery.done" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4 border-t border-rule pt-5">
      <div>
        <h3 className="text-lg">{t("delivery.title")}</h3>
        <p className="prose-body mt-1 text-sm">{t("delivery.subtitle")}</p>
      </div>

      {error ? <FormMessage tone="error" messageKey={error} /> : null}

      <div>
        <label className="field-label" htmlFor={`url-${claimId}`}>
          {t("delivery.fieldUrl")}
        </label>
        <input id={`url-${claimId}`} name="url" type="url" required className="input" placeholder="https://" />
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
                <img src={url} alt="" className="h-20 w-32 rounded-lg border border-rule object-cover" />
                <button
                  type="button"
                  className="btn btn-secondary absolute -right-2 -top-2 h-7 min-h-0 w-7 rounded-full p-0 text-xs"
                  aria-label={t("common.close")}
                  onClick={() => setScreenshots((current) => current.filter((item) => item !== url))}
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
