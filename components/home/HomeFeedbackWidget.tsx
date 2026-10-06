"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { submitFeedback } from "@/lib/api/feedback";
import FormModal from "@/components/FormModal";

export default function HomeFeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function close() {
    setOpen(false);
    setSubmitted(false);
    setText("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="dm-focus inline-flex min-h-11 w-full items-center gap-2 text-left text-sm text-muted transition-colors hover:text-accent"
      >
        <MaterialSymbol name="rate_review" className="!text-base" />
        <span>Feedback</span>
      </button>

      <AnimatePresence>
        {open ? (
          <FormModal title="Submit feedback" onClose={close} maxWidthClass="sm:max-w-md">
            {submitted ? (
              <div className="space-y-3 py-6 text-center">
                <div className="mx-auto grid size-11 place-items-center rounded-full bg-success-subtle text-success">
                  <MaterialSymbol name="check_circle" className="!text-xl" filled />
                </div>
                <h4 className="text-sm font-bold text-primary">Thank you!</h4>
                <p className="text-xs text-muted">Your feedback helps us improve Midora.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-muted">
                  Tell us what you think or report an issue — we read every message.
                </p>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="What can we do better?"
                  className="dm-textarea"
                />
                <button
                  type="button"
                  disabled={!text.trim()}
                  onClick={async () => {
                    if (!text.trim()) return;
                    const request = submitFeedback(text);
                    toast.promise(request, {
                      loading: "Sending feedback…",
                      success: "Thanks — feedback received",
                      error: "Couldn't send. Try again.",
                    });
                    try {
                      await request;
                      setSubmitted(true);
                    } catch {
                      /* handled */
                    }
                  }}
                  className="dm-btn dm-btn-primary w-full"
                >
                  Submit
                </button>
              </div>
            )}
          </FormModal>
        ) : null}
      </AnimatePresence>
    </>
  );
}
