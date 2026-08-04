import { createFileRoute } from "@tanstack/react-router";

import { CollectionView } from "@/components/CollectionView";
import { ComingSoon } from "@/components/ComingSoon";
import { CATALOGUE_LIVE, validateCollectionSearch } from "@/lib/catalog";

export const Route = createFileRoute("/collection/")({
  validateSearch: validateCollectionSearch,
  head: () => ({
    meta: [
      { title: "The Collection — Stanton Kingdom" },
      {
        name: "description",
        content:
          "Every piece in the house: engagement rings, necklaces, bracelets and earrings, drawn and set by a single bench.",
      },
    ],
  }),
  component: Everything,
});

function Everything() {
  const { style } = Route.useSearch();
  if (!CATALOGUE_LIVE) return <ComingSoon />;
  return <CollectionView category={null} type={null} style={style ?? null} />;
}
