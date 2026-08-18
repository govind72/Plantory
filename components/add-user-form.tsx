"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { provisionUser, type ProvisionState } from "@/app/(app)/users/actions";
import { appLanguages } from "@/lib/validation/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Outlet = { id: string; name: string };
const initial: ProvisionState = { status: "idle" };

export function AddUserForm({
  outlets,
  canCreatePrivileged,
}: {
  outlets: Outlet[];
  canCreatePrivileged: boolean;
}) {
  const t = useTranslations("users");
  const tRoles = useTranslations("roles");
  const tCommon = useTranslations("common");
  const [state, action, pending] = useActionState(provisionUser, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const [role, setRole] = useState<string>("staff");
  const [lang, setLang] = useState<string>("en");

  useEffect(() => {
    // Clear the text inputs after a successful create so the next member can be
    // added quickly. Role/language keep their last value (usually the same for
    // consecutive staff). This is a DOM reset only — no state updates here.
    if (state.status === "ok") formRef.current?.reset();
  }, [state.status]);

  const roleOptions = canCreatePrivileged
    ? (["owner", "admin", "outlet_manager", "staff"] as const)
    : (["outlet_manager", "staff"] as const);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("addTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={action} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">{t("fullName")}</Label>
              <Input id="full_name" name="full_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">{t("mobile")}</Label>
              <Input id="mobile" name="mobile" inputMode="tel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                name="password"
                type="text"
                minLength={8}
                required
              />
              <p className="text-xs text-muted-foreground">
                {t("passwordHint")}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{t("role")}</Label>
              <Select
                name="role"
                value={role}
                onValueChange={(v) => {
                  if (v) setRole(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue>{tRoles(role)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {tRoles(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("language")}</Label>
              <Select
                name="preferred_language"
                value={lang}
                onValueChange={(v) => {
                  if (v) setLang(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue>{tCommon(lang)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {appLanguages.map((l) => (
                    <SelectItem key={l} value={l}>
                      {tCommon(l)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t("outlets")}</legend>
            <p className="text-xs text-muted-foreground">{t("outletsHint")}</p>
            <div className="flex flex-wrap gap-3 pt-1">
              {outlets.map((o) => (
                <label
                  key={o.id}
                  className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
                >
                  <input
                    type="checkbox"
                    name="outlet_ids"
                    value={o.id}
                    className="size-4 accent-[var(--primary)]"
                  />
                  {o.name}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? t("creating") : t("create")}
            </Button>
            {state.status === "ok" && (
              <span className="text-sm text-green-600">{t("created")}</span>
            )}
            {state.status === "emailInUse" && (
              <span className="text-sm text-destructive">{t("emailInUse")}</span>
            )}
            {state.status === "roleForbidden" && (
              <span className="text-sm text-destructive">
                {t("roleForbidden")}
              </span>
            )}
            {(state.status === "error" || state.status === "forbidden") && (
              <span className="text-sm text-destructive">
                {t(state.status === "forbidden" ? "forbidden" : "error")}
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
