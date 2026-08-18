"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updatePassword, type ResetState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState: ResetState = { status: "idle" };

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const [state, formAction, isPending] = useActionState(
    updatePassword,
    initialState,
  );

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{t("resetTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t("newPassword")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              autoFocus
            />
          </div>
          {state.status === "tooShort" && (
            <p className="text-sm text-destructive">{t("passwordTooShort")}</p>
          )}
          {state.status === "error" && (
            <p className="text-sm text-destructive">{t("resetError")}</p>
          )}
          {state.status === "noSession" && (
            <p className="text-sm text-destructive">{t("resetLinkInvalid")}</p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? t("updating") : t("updatePassword")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
