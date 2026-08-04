import { createFileRoute, notFound } from "@tanstack/react-router";

import { CollectionView } from "@/components/CollectionView";
import { ComingSoon } from "@/components/ComingSoon";
import { CATALOGUE_LIVE, categoryFromSlug, validateCollectionSearch } from "@/lib/catalog";

export const Route = createFileRoute("/collection/$category/")({
  validateSearch: validateCollectionSearch,
  // Resolved in the loader, not the component: a slug that names nothing the
  // house sells is a 404, not a collection page that happens to be empty.
  loader: ({ params }) => {
    const category = categoryFromSlug(params.category);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.category} — Stanton Kingdom` },
            {
              name: "description",
              content: `${loaderData.category} by Stanton Kingdom — each piece drawn, set and finished by a single bench.`,
            },
          ],
        }
      : {},
  component: Category,
});

function Category() {
  const { category } = Route.useLoaderData();
  const { style } = Route.useSearch();
  // The loader above still runs, so a slug that names nothing is still a 404
  // rather than a holding page — an unfinished collection and a collection that
  // does not exist are different things and should stay different.
  if (!CATALOGUE_LIVE) return <ComingSoon />;
  return <CollectionView category={category} type={null} style={style ?? null} />;
}
