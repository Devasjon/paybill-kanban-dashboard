import { useRef, useState } from "react";
import { Camera, FileText, FolderOpen, Loader2, ScanLine, X } from "lucide-react";
import type { ScanConfig, ScannedReceipt } from "@/types";
import { useI18n } from "@/lib/i18n";
import { scanReceipt } from "@/lib/receiptScan";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const ACCEPTED_TYPES = "image/*,application/pdf";
const MAX_BYTES = 8 * 1024 * 1024; // matches the backend's 8MB limit

export function ScanReceiptModal({
  open,
  onOpenChange,
  scanConfig,
  token,
  onScanned,
  onGoToSettings,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanConfig: ScanConfig;
  token: string;
  onScanned: (result: ScannedReceipt) => void;
  onGoToSettings: () => void;
}) {
  const { t } = useI18n();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configured = scanConfig.enabled && !!scanConfig.url && !!token;
  const isPdf = file?.type === "application/pdf";

  function reset() {
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setScanning(false);
    setError(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.size > MAX_BYTES) {
      setError(t("scanFileTooLarge"));
      return;
    }

    setError(null);
    setFile(f);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return f.type === "application/pdf" ? null : URL.createObjectURL(f);
    });
  }

  async function handleScan() {
    if (!file) return;
    setScanning(true);
    setError(null);
    try {
      const result = await scanReceipt(file, scanConfig, token);
      onScanned(result);
      handleClose(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("scanFailedGeneric"));
    } finally {
      setScanning(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        <div className="p-6">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground">{t("modalEyebrow")}</p>
          <h2 className="text-lg font-semibold mt-1">{t("scanReceiptTitle")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("scanReceiptSubtitle")}</p>

          {!configured ? (
            <div className="mt-5 rounded-xl border border-dashed border-black/10 p-5 text-center">
              <p className="text-sm text-muted-foreground">{t("scanNotConfigured")}</p>
              <Button
                variant="outline"
                className="mt-3 rounded-full h-9 text-xs"
                onClick={() => {
                  handleClose(false);
                  onGoToSettings();
                }}
              >
                {t("scanGoToSettings")}
              </Button>
            </div>
          ) : (
            <div className="mt-5 space-y-3.5">
              {file ? (
                <div className="relative rounded-xl overflow-hidden border border-black/10">
                  {isPdf ? (
                    <div className="flex items-center gap-3 p-4 bg-black/5">
                      <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate">{file.name}</span>
                    </div>
                  ) : (
                    <img src={previewUrl ?? undefined} alt="" className="w-full max-h-64 object-contain bg-black/5" />
                  )}
                  <button
                    type="button"
                    onClick={reset}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/75"
                    aria-label={t("cancel")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="rounded-xl border border-dashed border-black/15 p-5 flex flex-col items-center gap-2 text-muted-foreground hover:bg-black/[0.02] hover:border-black/25 transition-colors"
                  >
                    <Camera className="h-6 w-6" />
                    <span className="text-xs font-medium text-center">{t("scanTakePhoto")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl border border-dashed border-black/15 p-5 flex flex-col items-center gap-2 text-muted-foreground hover:bg-black/[0.02] hover:border-black/25 transition-colors"
                  >
                    <FolderOpen className="h-6 w-6" />
                    <span className="text-xs font-medium text-center">{t("scanChooseFile")}</span>
                  </button>
                  <p className="col-span-2 text-center text-xs text-muted-foreground">{t("scanChoosePhotoHint")}</p>
                </div>
              )}

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                className="hidden"
                onChange={handleFileChange}
              />

              {error && <p className="text-xs text-red-600">{error}</p>}

              <Button
                onClick={handleScan}
                disabled={!file || scanning}
                className="w-full rounded-full h-11 bg-[#17171d] hover:bg-[#26262f] gap-2"
              >
                {scanning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("scanning")}
                  </>
                ) : (
                  <>
                    <ScanLine className="h-4 w-4" />
                    {t("scanNow")}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
