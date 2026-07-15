"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import MidoraInfoChat from "./midoraInfoChat";
import { motion, AnimatePresence } from "framer-motion";

export default function MidoraInfoChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="z-fab fixed bottom-20 md:bottom-6 right-6 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="w-[min(100%,320px)] sm:w-[360px] overflow-hidden rounded-2xl border border-border bg-surface sm:rounded-3xl shadow-xl origin-bottom-right"
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 bg-surface/95">
              <div>
                <p className="text-xs font-semibold tracking-tight">
                  Midora Online info bot
                </p>
                <p className="text-[11px] text-muted">
                  Ask about the platform & product.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-muted hover:text-foreground dm-focus rounded-full px-2 py-1"
              >
                Close
              </button>
            </div>
            <div className="p-3">
              <MidoraInfoChat />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground dm-focus hover:opacity-95 cursor-pointer shadow-md"
      >
        <span className="grid size-6 place-items-center rounded-full bg-background/15">
          <MessageCircle className="size-3.5" />
        </span>
        <span>Ask Midora Online</span>
      </motion.button>
    </div>
  );
}

