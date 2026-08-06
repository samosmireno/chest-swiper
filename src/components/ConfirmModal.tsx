import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Esc cancels; autofocus Cancel (safe default); restore focus on close.
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop — non-dismissing (Esc / Cancel only) */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden />

          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-message"
            className="bg-panel/95 border-purple-accent/40 relative flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl border px-7 py-8 text-center backdrop-blur-lg"
            style={{
              boxShadow:
                "0 8px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
            }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <h2
              id="confirm-modal-title"
              className="font-display text-2xl font-black tracking-wide text-white uppercase"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}
            >
              {title}
            </h2>
            <p
              id="confirm-modal-message"
              className="text-sm leading-snug text-white/75"
            >
              {message}
            </p>

            <div className="mt-1 flex w-full flex-col gap-3 sm:flex-row-reverse">
              <button
                type="button"
                onClick={onConfirm}
                className="font-display flex-1 cursor-pointer rounded-full px-6 py-3 text-sm font-black tracking-[0.18em] text-white uppercase transition-transform active:scale-95"
                style={
                  destructive
                    ? {
                        background:
                          "linear-gradient(to bottom, #ef4444, #b91c1c)",
                        boxShadow:
                          "0 0 20px rgba(239,68,68,0.4), 0 4px 12px rgba(0,0,0,0.4)",
                      }
                    : {
                        background: "var(--gradient-btn-gold)",
                        boxShadow:
                          "0 0 20px rgba(245,200,66,0.4), 0 4px 12px rgba(0,0,0,0.4)",
                      }
                }
              >
                {confirmLabel}
              </button>
              <button
                ref={cancelRef}
                type="button"
                onClick={onCancel}
                className="border-purple-accent/55 font-display flex-1 cursor-pointer rounded-full border bg-white/5 px-6 py-3 text-sm font-black tracking-[0.18em] text-white uppercase transition-colors duration-150 outline-none hover:bg-white/10 focus-visible:border-purple-300"
              >
                {cancelLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
