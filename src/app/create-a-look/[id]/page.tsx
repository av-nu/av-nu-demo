import { redirect } from "next/navigation";

/** Legacy edit link; kept so existing URLs still resolve. */
export default async function CreateALookEditRedirect({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/create/${id}`);
}
