import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await requireSession();
  const t = await getTranslations("dashboard");

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t("welcome", { name: session.fullName })}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          {t("comingSoon")}
        </CardContent>
      </Card>
    </div>
  );
}
