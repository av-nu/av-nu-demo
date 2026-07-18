"use client";

import { useRouter } from "next/navigation";

import { CreateListDialog } from "@/components/faves/CreateListDialog";

export default function ListPage() {
  const router = useRouter();
  return <CreateListDialog onClose={() => router.push("/create")} onCreated={() => router.push("/favorites")} />;
}
