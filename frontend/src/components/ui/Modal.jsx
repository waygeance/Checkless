import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

/**
 * Accessible modal dialog.
 *
 * @param {boolean}  open
 * @param {Function} onClose
 * @param {string}   title
 * @param {ReactNode} children
 * @param {ReactNode} [footer]
 */
export function Modal({ open, onClose, title, children, footer }) {
  const dialogRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />
      {/* Panel */}
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-md rounded-2xl border border-cream/[0.09] bg-walnut p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="modal-title" className="font-display text-xl font-semibold text-cream">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-cream-muted hover:bg-white/10 hover:text-cream transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
        {footer && <div className="mt-5 flex gap-3">{footer}</div>}
      </div>
    </div>
  );
}

/**
 * Reason input modal — used by admin suspend/restore actions.
 *
 * @param {boolean}  open
 * @param {Function} onClose
 * @param {string}   title
 * @param {string}   reason
 * @param {Function} onReasonChange
 * @param {Function} onConfirm
 * @param {boolean}  [loading]
 * @param {string}   [confirmLabel]
 * @param {string}   [confirmVariant]
 */
export function ReasonModal({
  open,
  onClose,
  title,
  reason,
  onReasonChange,
  onConfirm,
  loading = false,
  confirmLabel = "Confirm",
  confirmVariant = "primary"
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" size="small" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            size="small"
            className="flex-1"
            onClick={onConfirm}
            disabled={loading || reason.trim().length < 3}
          >
            {loading ? "Working…" : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-cream-muted mb-3">
        A reason is required and will be recorded in the audit log.
      </p>
      <textarea
        value={reason}
        onChange={(e) => onReasonChange(e.target.value)}
        placeholder="Enter reason (min 3 characters)…"
        rows={3}
        className="min-h-20 w-full resize-y rounded-xl border border-cream/10 bg-roasted/70 px-4 py-3 text-sm text-cream outline-none transition placeholder:text-cream-muted/40 focus:border-lime/55 focus:ring-2 focus:ring-lime/10"
      />
    </Modal>
  );
}
