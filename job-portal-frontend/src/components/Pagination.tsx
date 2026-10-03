interface Props {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}

// Uses the shared .pagination styles from styles/utilities.css
export default function Pagination({ page, pages, onChange }: Props) {
  if (pages <= 1) return null;
  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}>← Previous</button>
      <span>Page {page} of {pages}</span>
      <button disabled={page >= pages} onClick={() => onChange(page + 1)}>Next →</button>
    </div>
  );
}
