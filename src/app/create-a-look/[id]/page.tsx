import { redirect } from "next/navigation";

/** Legacy edit link; kept so existing URLs still resolve. */
export default function CreateALookEditRedirect({ params }: { params: { id: string } }) {
  redirect(`/create/${params.id}`);
}
