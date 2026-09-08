import type { MessageKey } from "@/i18n";

// Shared shape for every form action. It lives outside the "use server" files
// because those may only export async functions.
export interface ActionState {
  status: "idle" | "error" | "success";
  messageKey?: MessageKey;
  params?: Record<string, string | number>;
}

export const IDLE_STATE: ActionState = { status: "idle" };

export function actionError(messageKey: MessageKey, params?: ActionState["params"]): ActionState {
  return { status: "error", messageKey, params };
}

export function actionSuccess(messageKey: MessageKey, params?: ActionState["params"]): ActionState {
  return { status: "success", messageKey, params };
}
