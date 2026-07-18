import { CreateLookWorkspace } from "@/components/looks/CreateLookWorkspace";

export default function SavedGuidePage({ params }: { params: { id: string } }) {
  return <CreateLookWorkspace savedLookId={params.id} />;
}
