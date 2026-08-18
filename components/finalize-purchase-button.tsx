"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  finalizePurchase,
  type FinalizeState,
} from "@/app/(app)/purchases/actions";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const initial: FinalizeState = { status: "idle" };

export function FinalizePurchaseButton({
  purchaseId,
  disabled,
}: {
  purchaseId: string;
  disabled?: boolean;
}) {
  const t = useTranslations("purchases.finalize");
  const [state, action, pending] = useActionState(finalizePurchase, initial);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="purchase_id" value={purchaseId} />
      <Button type="submit" disabled={pending || disabled}>
        <CheckCircle2 className="size-4" />
        {pending ? t("finalizing") : t("button")}
      </Button>
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
      {state.status === "error" && (
        <p className="text-sm text-destructive">{t("error")}</p>
      )}
    </form>
  );
}
