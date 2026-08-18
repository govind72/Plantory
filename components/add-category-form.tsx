"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { createCategory, type CategoryState } from "@/app/(app)/plants/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: CategoryState = { status: "idle" };

export function AddCategoryForm() {
  const t = useTranslations("plants.cats");
  const [state, action, pending] = useActionState(createCategory, initial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "ok") ref.current?.reset();
  }, [state.status]);

  return (
    <form
      ref={ref}
      action={action}
      className="flex flex-wrap items-end gap-3"
    >
      <div className="space-y-1">
        <Label htmlFor="name_en">{t("nameEn")}</Label>
        <Input id="name_en" name="name_en" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="name_hi">{t("nameHi")}</Label>
        <Input id="name_hi" name="name_hi" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t("creating") : t("create")}
      </Button>
    </form>
  );
}
