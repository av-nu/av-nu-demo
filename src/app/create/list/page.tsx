import { redirect } from "next/navigation";

// Lists are a Faves feature now, not a social post type.
export default function ListPage() {
  redirect("/favorites");
}
