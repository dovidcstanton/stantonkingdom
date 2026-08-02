import { createFileRoute, notFound } from "@tanstack/react-router";

import { CollectionView } from "@/components/CollectionView";
import { categoryFromSlug, validateCollectionSearch } from "@/lib/catalog";

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
  return <CollectionView category={category} type={null} style={style ?? null} />;
}
