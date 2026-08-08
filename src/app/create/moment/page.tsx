import { redirect } from "next/navigation";

// Moments are no longer a separate creation path — the unified composer handles
// photo and video posts.
export default function MomentPage() {
  redirect("/create");
}
