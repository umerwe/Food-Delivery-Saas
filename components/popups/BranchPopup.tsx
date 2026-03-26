"use client";

export default function BranchPopup({
  show,
  onClose,
  branches,
  loading,
  onSelect,
}: any) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Select Branch</h2>
            <p className="text-xs text-gray-500">
              Choose a branch to continue your order
            </p>
          </div>

          <button onClick={onClose}>×</button>
        </div>

        {/* CONTENT */}
        <div className="max-h-[400px] overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <div className="text-center py-10 text-sm text-gray-400">
              Loading branches...
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-400">
              No active branches found
            </div>
          ) : (
            branches.map((branch: any) => (
              <div
                key={branch.id}
                onClick={() => onSelect(branch)}
                className="p-4 border rounded-xl cursor-pointer hover:border-primary"
              >
                <p className="font-semibold">{branch.name}</p>
                <p className="text-xs text-gray-500">
                  {branch.address?.area}, {branch.address?.city}
                </p>
              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        <div className="px-5 py-3 border-t text-center">
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}