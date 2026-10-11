export function SearchSkeleton() {
  return (
    <div className="search-skeleton-list" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <div className="search-skeleton" key={index}>
          <span className="skeleton-line skeleton-line--title" />
          <span className="skeleton-line skeleton-line--description" />
          <span className="skeleton-line skeleton-line--metadata" />
        </div>
      ))}
    </div>
  );
}
