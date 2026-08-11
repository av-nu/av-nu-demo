"use client";

import { EditorialRenderer } from "@/components/looks/editorial/EditorialRenderer";
import { PostToolPanel, ToolFieldLabel } from "@/components/post/tools/PostToolPanel";
import { mockProducts } from "@/data/mockProducts";
import { EDITORIAL_FORMATS, EDITORIAL_TEMPLATES, applyEditorialTemplate, type EditorialFormat, type EditorialTemplateId } from "@/lib/editorial";
import { cn } from "@/lib/utils";

/** Common preview height, in px, so tiles of differing ratios stay aligned. */
const PREVIEW_HEIGHT = 84;

/** Catalog products used to illustrate the templates before the post has any. */
const SAMPLE_PREVIEW_IDS = mockProducts.slice(0, 8).map((product) => product.id);

/**
 * Template picker. Previews are rendered from the real template output so what
 * you see is exactly what gets applied.
 */
export function LayoutsTool({
  productIds,
  title,
  activeFormat,
  onApply,
  onChangeFormat,
  onClose,
}: {
  productIds: string[];
  title: string;
  activeFormat: EditorialFormat;
  onApply: (templateId: EditorialTemplateId) => void;
  onChangeFormat: (format: EditorialFormat) => void;
  onClose: () => void;
}) {
  // A new post has no products yet, and rendering the previews from an empty
  // list makes every template look identical and blank. Fall back to catalog
  // samples purely for the thumbnails — applying still uses the post's own
  // products.
  const previewIds = productIds.length > 0 ? productIds : SAMPLE_PREVIEW_IDS;

  return (
    <PostToolPanel title="Layouts" onClose={onClose}>
      <ToolFieldLabel>Shape</ToolFieldLabel>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(Object.keys(EDITORIAL_FORMATS) as EditorialFormat[]).map((format) => (
          <button
            key={format}
            type="button"
            onClick={() => onChangeFormat(format)}
            aria-pressed={activeFormat === format}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
              activeFormat === format ? "border-navy bg-navy text-white" : "border-divider/70 text-midnight/65 hover:border-midnight/30",
            )}
          >
            {EDITORIAL_FORMATS[format].label}
          </button>
        ))}
      </div>

      <ToolFieldLabel>Start from a layout</ToolFieldLabel>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {EDITORIAL_TEMPLATES.map((template) => {
          // Size each preview to a common height so tiles and labels line up
          // regardless of the template's aspect ratio.
          const { width, height } = EDITORIAL_FORMATS[template.format];
          const previewWidth = Math.round(PREVIEW_HEIGHT * (width / height));
          return (
            <li key={template.id}>
              <button type="button" onClick={() => onApply(template.id)} className="group block w-full text-left">
                <span
                  className="flex items-center justify-center rounded-xl bg-surface/60 p-1"
                  style={{ height: PREVIEW_HEIGHT + 8 }}
                >
                  <span
                    className="pointer-events-none block max-w-full overflow-hidden rounded-lg ring-2 ring-divider/60 transition-shadow group-hover:ring-accent"
                    style={{ width: previewWidth }}
                  >
                    <EditorialRenderer design={applyEditorialTemplate(previewIds, title || "Title", template.id)} />
                  </span>
                </span>
                <span className="mt-1 block truncate text-[10px] font-semibold text-midnight/70">{template.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </PostToolPanel>
  );
}
