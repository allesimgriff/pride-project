export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6 p-1">
      <div className="h-9 w-64 rounded-md bg-gray-200" />
      <div className="h-4 max-w-xl rounded bg-gray-100" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card h-24 bg-gray-100" />
        <div className="card h-24 bg-gray-100" />
        <div className="card h-24 bg-gray-100" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card h-72 bg-gray-100" />
        <div className="card h-72 bg-gray-100" />
        <div className="card h-72 bg-gray-100" />
      </div>
    </div>
  );
}
