export default function EmptyState() {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-12 text-center">
      <div className="text-6xl mb-4">📭</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        データがありません
      </h2>
      <p className="text-gray-600">
        まだデモ返信が生成されていません
      </p>
    </div>
  );
}
