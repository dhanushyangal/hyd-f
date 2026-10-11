"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  /** When forced, the dialog cannot be dismissed until a workspace exists. */
  forced: boolean;
  name: string;
  creating: boolean;
  onNameChange: (name: string) => void;
  onCreate: () => void;
  onDismiss: () => void;
};

export function NewWorkspaceDialog({
  open,
  forced,
  name,
  creating,
  onNameChange,
  onCreate,
  onDismiss,
}: Props) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4"
      onClick={() => {
        if (creating || forced) return;
        onDismiss();
      }}
    >
      <Card
        className="w-full max-w-md rounded-[22px] border-neutral-200/60 bg-white/95 backdrop-blur-xl shadow-[0_24px_80px_-16px_rgba(0,0,0,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-6 sm:p-7">
          <h2 className="mb-1 text-[17px] font-semibold tracking-tight text-neutral-900">New workspace</h2>
          <p className="mb-5 text-sm text-neutral-500">Give your workspace a name to get started.</p>
          <Input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. My Project, Character Pack"
            className="mb-5 h-11 rounded-xl border-neutral-200 bg-neutral-50/80 shadow-none focus-visible:border-neutral-300 focus-visible:ring-neutral-900/[0.04]"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (name.trim()) onCreate();
              }
              if (e.key === "Escape") {
                if (!forced) onDismiss();
              }
            }}
            autoFocus
            disabled={creating}
          />
          <div className="flex gap-2.5 justify-end">
            {!forced && (
              <Button
                type="button"
                onClick={() => !creating && onDismiss()}
                variant="ghost"
                disabled={creating}
                className="h-10 rounded-full"
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              onClick={onCreate}
              disabled={!name.trim() || creating}
              className="h-10 rounded-full"
            >
              {creating ? "Creating…" : "Create"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
