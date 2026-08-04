import { createFileRoute, notFound } from "@tanstack/react-router";

import { CollectionView } from "@/components/CollectionView";
import { ComingSoon } from "@/components/ComingSoon";
import {
  CATALOGUE_LIVE,
  categoryFromSlug,
  typeFromSlug,
  validateCollectionSearch,
} from "@/lib/catalog";

export const Route = createFileRoute("/collection/$category/$type")({
  validateSearch: validateCollectionSearch,
  // The type is resolved within its category, because "Statement & Link" and
  // "Tennis" each belong to two of them — a global lookup would silently
  // resolve /collection/bracelets/statement-link against Necklaces.
  loader: ({ params }) => {
    const category = categoryFromSlug(params.category);
    if (!category) throw notFound();
    const type = typeFromSlug(category, params.type);
    if (!type) throw notFound();
    return { category, type };
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.type} ${loaderData.category} — Stanton Kingdom` },
            {
              name: "description",
              content: `${loaderData.type} ${loaderData.category.toLowerCase()} by Stanton Kingdom — each piece drawn, set and finished by a single bench.`,
            },
          ],
        }
      : {},
  component: CategoryType,
});

function CategoryType() {
  const { category, type } = Route.useLoaderData();
  const { style } = Route.useSearch();
  if (!CATALOGUE_LIVE) return <ComingSoon />;
  return <CollectionView category={category} type={type} style={style ?? null} />;
}
