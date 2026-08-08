import { redirect } from "next/navigation";

// Guides are folded into the unified composer, where the Featured layout lives
// on as a template.
export default function GuidePage() {
  redirect("/create");
}
