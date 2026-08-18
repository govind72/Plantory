import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "@/components/reset-password-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("auth");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      {user ? (
        <ResetPasswordForm />
      ) : (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>{t("resetTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-destructive">{t("resetLinkInvalid")}</p>
            <Link href="/forgot-password" className="text-sm underline">
              {t("forgotTitle")}
            </Link>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
