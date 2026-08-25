import { useState } from "react";
import { Bell } from "lucide-react";
import type { NotificationLogEntry } from "@/types";
import { useI18n } from "@/lib/i18n";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<string, string> = {
  sent: "bg-[#DCFCE7] text-[#15803D]",
  failed: "bg-[#FEE2E2] text-[#DC2626]",
  skipped_no_backend: "bg-[#F3F4F6] text-[#374151]",
};

export function NotificationBell({ notificationLog }: { notificationLog: NotificationLogEntry[] }) {
  const { t } = useI18n();
  const [seenCount, setSeenCount] = useState(notificationLog.length);
  const unseen = Math.max(0, notificationLog.length - seenCount);
  const recent = notificationLog.slice().reverse().slice(0, 8);

  return (
    <Popover onOpenChange={(open) => open && setSeenCount(notificationLog.length)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative h-9 w-9 flex items-center justify-center rounded-full hover:bg-black/5"
          aria-label={t("notificationLogTitle")}
        >
          <Bell className="h-[18px] w-[18px]" />
          {unseen > 0 && (
            <span className="absolute top-1 right-1 h-4 min-w-4 px-0.5 rounded-full bg-[#dc2626] text-white text-[9px] font-semibold flex items-center justify-center ring-2 ring-background">
              {unseen > 9 ? "9+" : unseen}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-4 border-b border-black/5">
          <p className="text-sm font-semibold">{t("notificationLogTitle")}</p>
        </div>
        {recent.length === 0 ? (
          <p className="text-xs text-muted-foreground p-4">{t("notificationLogEmpty")}</p>
        ) : (
          <div className="max-h-80 overflow-y-auto divide-y divide-black/5">
            {recent.map((entry) => (
              <div key={entry.id} className="p-3.5 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{entry.billName}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{entry.to || "—"}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                </div>
                <Badge className={cn("text-[10px] font-medium border-none shrink-0", STATUS_BADGE[entry.status])}>
                  {entry.status === "sent"
                    ? t("notifStatusSent")
                    : entry.status === "failed"
                    ? t("notifStatusFailed")
                    : t("notifStatusSkipped")}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
