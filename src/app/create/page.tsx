import { Suspense } from "react";

import { PostComposer } from "@/components/post/PostComposer";

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="flex h-[100dvh] items-center justify-center bg-bg text-sm text-midnight/55">Loading composer…</div>}>
      <PostComposer />
    </Suspense>
  );
}
