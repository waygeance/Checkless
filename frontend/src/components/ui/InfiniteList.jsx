import { Button } from "./Button";
import { Spinner } from "./Spinner";

/**
 * Wraps a list of items with cursor-based pagination.
 *
 * @param {ReactNode[]} children  — rendered list items
 * @param {boolean}     loading   — initial load in progress
 * @param {boolean}     loadingMore — loading next page
 * @param {string|null} nextCursor  — cursor for next page; null = end of list
 * @param {Function}    onLoadMore  — called when user requests next page
 * @param {ReactNode}   [empty]     — empty state to show when no items
 * @param {string}      [className]
 */
export function InfiniteList({
  children,
  loading,
  loadingMore,
  nextCursor,
  onLoadMore,
  empty,
  className = ""
}) {
  const hasContent =
    Array.isArray(children) ? children.filter(Boolean).length > 0 : Boolean(children);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Spinner size="md" />
      </div>
    );
  }

  if (!hasContent && empty) {
    return <div className={className}>{empty}</div>;
  }

  return (
    <div className={className}>
      {children}
      {nextCursor && (
        <div className="mt-5 flex justify-center">
          <Button
            variant="outline"
            size="small"
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" /> Loading…
              </span>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
