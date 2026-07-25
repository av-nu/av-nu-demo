"use client";

import { useRouter } from "next/navigation";

import { VideoReviewUploadDialog } from "@/components/social/VideoReviewUploadDialog";

export default function MomentPage() {
  const router = useRouter();
  return <VideoReviewUploadDialog onClose={() => router.push("/create")} onPublished={() => router.push("/moments")} />;
}
