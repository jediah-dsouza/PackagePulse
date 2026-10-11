export function PackageDetailSkeleton() {
  return (
    <section
      className="package-detail-skeleton"
      role="status"
      aria-label="Loading package details"
      aria-busy="true"
    >
      <h1 className="visually-hidden">Loading package details</h1>
      <span className="skeleton-line skeleton-line--title" />
      <span className="skeleton-line skeleton-line--description" />
      <span className="skeleton-line skeleton-line--metadata" />
      <span className="skeleton-line skeleton-line--metadata" />
      <span className="skeleton-line skeleton-line--description" />
    </section>
  );
}
