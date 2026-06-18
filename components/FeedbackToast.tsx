"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfMAApxOpVPuQ6lYrzJTZa3KXneG7ia2IfJGPYGxon1nkgIwA/viewform?usp=publish-editor";

export default function FeedbackToast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => setVisible(false);

  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="pointer-events-auto bg-white rounded-2xl shadow-xl border border-gray-100 px-6 py-5 max-w-sm w-full flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-base font-medium text-[#1A1A1A] leading-snug">
              New to Pathways? Take 5 seconds to share your feedback.
            </p>
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="shrink-0 text-[#E8007D] hover:text-[#C4006A] transition-colors mt-0.5"
            >
              <X size={18} />
            </button>
          </div>
          <a
            href={FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            className="block text-center bg-[#E8007D] hover:bg-[#C4006A] text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            Share Feedback →
          </a>
        </div>
      </div>
    </>
  );
}
