export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-xl">
      <p className="text-gray-400 italic">{children}</p>
    </div>
  );
}
