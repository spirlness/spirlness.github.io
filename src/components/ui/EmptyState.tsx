export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="py-12 text-center border-2 border-dashed border-gray-100 rounded-xl"
    >
      <p className="text-gray-600 italic">{children}</p>
    </div>
  );
}
