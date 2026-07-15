import { Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { FaveList } from "@/data/faves";
import { flattenPages } from "@/data/faves";
import { encodeSharedFaves } from "@/lib/sharedFaves";

export function ExternalShareButton({ list, onToast }: { list: FaveList; onToast: (message: string) => void }) {
  const share = async () => {
    const productIds = Array.from(new Set([...list.productIds, ...flattenPages(list.pages)]));
    const token = encodeSharedFaves({ version: 1, name: list.name, productIds });
    const url = `${window.location.origin}/shared/faves/${token}`;
    const data = { title: `${list.name} on av | nu`, text: `Shop this favorites list for me: ${list.name}`, url };
    try {
      if (navigator.share && navigator.canShare?.(data)) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(url);
        onToast("Shopping link copied — no account required");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") onToast("Could not share this list");
    }
  };

  return <Button variant="surface" onClick={share} className="gap-2"><Share2 className="h-4 w-4" />Share shopping link</Button>;
}
