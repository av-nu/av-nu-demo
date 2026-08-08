import { redirect } from "next/navigation";

// The lookbook creation entry is replaced by the unified composer.
export default function CreateLookPage() {
  redirect("/create");
}
