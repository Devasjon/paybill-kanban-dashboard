import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import type { CalendarNote } from "@/types";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function NoteFormModal({
  open,
  onOpenChange,
  onSave,
  onDelete,
  initial,
  defaultDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (note: CalendarNote) => void;
  onDelete: (note: CalendarNote) => void;
  initial: CalendarNote | null;
  defaultDate?: string;
}) {
  const { t } = useI18n();
  const [date, setDate] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) {
      setDate(initial?.date ?? defaultDate ?? new Date().toISOString().slice(0, 10));
      setText(initial?.text ?? "");
    }
  }, [open, initial, defaultDate]);

  function handleSave() {
    if (!text.trim() || !date) return;
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      date,
      text: text.trim(),
    });
    onOpenChange(false);
  }

  function handleDelete() {
    if (!initial) return;
    onDelete(initial);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        <div className="p-6">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground">{t("modalEyebrow")}</p>
          <h2 className="text-lg font-semibold mt-1">{initial ? t("editNoteTitle") : t("addNoteTitle")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("addNoteSubtitle")}</p>

          <div className="grid gap-3.5 mt-5">
            <div className="grid gap-1.5">
              <Label htmlFor="note-date">{t("fieldNoteDate")}</Label>
              <Input id="note-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="note-text">{t("fieldNoteText")}</Label>
              <Textarea
                id="note-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("fieldNoteTextPlaceholder")}
                rows={4}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-6">
            {initial && (
              <Button
                variant="outline"
                onClick={handleDelete}
                className="rounded-full h-11 w-11 shrink-0 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                aria-label={t("delete")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button onClick={handleSave} className="flex-1 rounded-full h-11 bg-[#17171d] hover:bg-[#26262f]">
              {t("saveNote")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
