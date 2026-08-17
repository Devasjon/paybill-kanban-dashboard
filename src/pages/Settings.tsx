import { useEffect, useRef, useState } from "react";
import type { AppData, Lang, WhatsAppConfig } from "@/types";
import { useI18n } from "@/lib/i18n";
import { exportData, importData } from "@/lib/storage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Download, Upload, Globe } from "lucide-react";

export function Settings({
  data,
  onSaveWhatsapp,
  onSetLang,
  onImport,
}: {
  data: AppData;
  onSaveWhatsapp: (config: WhatsAppConfig) => void;
  onSetLang: (lang: Lang) => void;
  onImport: (data: AppData) => void;
}) {
  const { t, lang } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [backendUrl, setBackendUrl] = useState(data.whatsapp.backendUrl);
  const [defaultNumber, setDefaultNumber] = useState(data.whatsapp.defaultNumber);
  const [enabled, setEnabled] = useState(data.whatsapp.enabled);

  useEffect(() => {
    setBackendUrl(data.whatsapp.backendUrl);
    setDefaultNumber(data.whatsapp.defaultNumber);
    setEnabled(data.whatsapp.enabled);
  }, [data.whatsapp]);

  function handleSave() {
    onSaveWhatsapp({ backendUrl: backendUrl.trim(), defaultNumber: defaultNumber.trim(), enabled });
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await importData(file);
      onImport(parsed);
    } catch {
      // handled by caller via toast; keep this component decoupled
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const statusBadgeVariant: Record<string, string> = {
    sent: "bg-[#DCFCE7] text-[#15803D]",
    failed: "bg-[#FEE2E2] text-[#DC2626]",
    skipped_no_backend: "bg-[#F3F4F6] text-[#374151]",
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">{t("settingsTitle")}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t("settingsSubtitle")}</p>
      </div>

      <Card className="rounded-2xl border-black/5 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">{t("settingsLanguage")}</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{t("settingsLanguageDesc")}</p>
          <div className="flex items-center rounded-full border border-black/10 bg-white p-0.5 mt-3 w-fit">
            {(["en", "ms"] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onSetLang(l)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-medium transition-colors",
                  lang === l ? "bg-[#17171d] text-white" : "text-muted-foreground hover:bg-black/5"
                )}
              >
                {l === "en" ? "English" : "Bahasa Melayu"}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-black/5 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-semibold text-sm">{t("settingsWhatsapp")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-md">{t("settingsWhatsappDesc")}</p>
            </div>
            <label className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-medium">{t("enableWhatsapp")}</span>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-3.5 mt-4">
            <div className="grid gap-1.5">
              <Label htmlFor="wa-backend">{t("fieldBackendUrl")}</Label>
              <Input
                id="wa-backend"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder={t("fieldBackendUrlPlaceholder")}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="wa-number">{t("fieldDefaultNumber")}</Label>
              <Input
                id="wa-number"
                value={defaultNumber}
                onChange={(e) => setDefaultNumber(e.target.value)}
                placeholder={t("fieldDefaultNumberPlaceholder")}
              />
            </div>
          </div>

          <Button onClick={handleSave} className="mt-4 rounded-full h-10 px-5 bg-[#17171d] hover:bg-[#26262f]">
            {t("saveSettings")}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-black/5 shadow-sm">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm">{t("settingsData")}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t("settingsDataDesc")}</p>
          <div className="flex flex-wrap gap-2 mt-3.5">
            <Button
              variant="outline"
              className="rounded-full h-9 text-xs gap-1.5"
              onClick={() => exportData(data)}
            >
              <Download className="h-3.5 w-3.5" />
              {t("exportData")}
            </Button>
            <Button
              variant="outline"
              className="rounded-full h-9 text-xs gap-1.5"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              {t("importData")}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-black/5 shadow-sm">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm">{t("notificationLogTitle")}</h3>
          {data.notificationLog.length === 0 ? (
            <p className="text-xs text-muted-foreground mt-3">{t("notificationLogEmpty")}</p>
          ) : (
            <div className="mt-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Bill</TableHead>
                    <TableHead className="text-xs">To</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.notificationLog
                    .slice()
                    .reverse()
                    .slice(0, 20)
                    .map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-xs font-medium">{entry.billName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{entry.to || "—"}</TableCell>
                        <TableCell>
                          <Badge
                            className={cn("text-[10px] font-medium border-none", statusBadgeVariant[entry.status])}
                          >
                            {entry.status === "sent"
                              ? t("notifStatusSent")
                              : entry.status === "failed"
                              ? t("notifStatusFailed")
                              : t("notifStatusSkipped")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
