import { redirect } from "next/navigation";

/** Legacy entry point; the composer is now the single place a post is made. */
export default function CreateALookRedirect() {
  redirect("/create");
}
