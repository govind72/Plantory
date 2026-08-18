"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { requestPasswordReset, type ForgotState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState: ForgotState = { sent: false };

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle>{t("forgotTitle")}</CardTitle>
          <CardDescription>{t("forgotSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {state.sent ? (
            <div className="space-y-4">
              <p className="text-sm">{t("resetLinkSent")}</p>
              <Link href="/login" className="text-sm underline">
                {t("backToLogin")}
              </Link>
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? t("sending") : t("sendResetLink")}
              </Button>
              <Link
                href="/login"
                className="block text-center text-sm text-muted-foreground underline"
              >
                {t("backToLogin")}
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
