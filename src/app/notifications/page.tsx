"use client";

import { motion } from "framer-motion";

import { useToast } from "@/components/ui/Toast";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationList } from "@/components/social/NotificationList";

export default function NotificationsPage() {
  const { unread, markAllRead, isHydrated } = useNotifications();
  const { showToast, ToastContainer } = useToast();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mx-auto max-w-2xl space-y-6 pb-8"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl tracking-tight text-text">Notifications</h1>
          <p className="mt-1 text-sm text-text/50">
            {isHydrated && unread > 0 ? `${unread} unread` : "Activity on your posts and circle"}
          </p>
        </div>
        {isHydrated && unread > 0 && (
          <button
            type="button"
            onClick={() => {
              markAllRead();
              showToast("All caught up");
            }}
            className="text-sm font-medium text-accent hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      <NotificationList onToast={showToast} />
      <ToastContainer />
    </motion.div>
  );
}
