import { CreateLookWorkspace } from "@/components/looks/CreateLookWorkspace";

export default function SavedLookPage({ params }: { params: { id: string } }) {
  return <CreateLookWorkspace savedLookId={params.id} />;
}
