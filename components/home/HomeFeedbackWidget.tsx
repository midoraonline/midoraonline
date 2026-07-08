"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { submitFeedback } from "@/lib/api/feedback";
import FormModal, { formTextareaClass } from "@/components/FormModal";

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
      <motion.button
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.96 }}
        type="button"
        onClick={() => setOpen(true)}
        className="dm-btn-accent fixed right-0 top-1/2 z-40 flex -translate-y-1/2 cursor-pointer select-none items-center gap-1 rounded-l-2xl px-2.5 py-3.5 text-[10px] font-bold uppercase tracking-wider [writing-mode:vertical-lr] dm-focus"
      >
        <MaterialSymbol name="rate_review" className="!text-sm mb-1" />
        <span>Feedback</span>
      </motion.button>

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
                  className={formTextareaClass}
                />
                <button
                  type="button"
                  disabled={!text.trim()}
                  onClick={async () => {
                    if (!text.trim()) return;
                    try {
                      await submitFeedback(text);
                      setSubmitted(true);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="dm-btn-accent dm-focus w-full rounded-xl py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
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
