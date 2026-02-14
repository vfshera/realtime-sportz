export default function HomeSkeleton() {
  return (
    <main className="mx-auto w-full max-w-300 animate-pulse pt-8">
      {/* Header */}
      <header className="rounded-2xl border-3 border-b-4 border-black bg-yellow-300 px-5 py-7 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-2 h-8 w-40 rounded bg-yellow-200" />
            <div className="h-4 w-60 rounded bg-yellow-200" />
          </div>
          <div className="h-10 w-28 rounded-full bg-yellow-200" />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 py-8 min-[1200px]:grid-cols-[1fr_420px]">
        {/* Left Column - Matches */}
        <div>
          <div className="mb-5 flex items-center justify-between">
            <div className="h-7 w-56 rounded bg-gray-200" />
            <div className="h-6 w-14 rounded-full bg-gray-200" />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border-3 border-black bg-white p-5 shadow-[8px_8px_0_rgba(0,0,0,0.1)] md:p-6"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="h-5 w-20 rounded-full bg-gray-200" />
                  <div className="h-4 w-16 rounded bg-gray-200" />
                </div>

                <div className="mb-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-32 rounded bg-gray-200" />
                    <div className="h-10 w-16 rounded-xl bg-gray-200" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-28 rounded bg-gray-200" />
                    <div className="h-10 w-16 rounded-xl bg-gray-200" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="h-4 w-12 rounded bg-gray-200" />
                  <div className="h-8 w-28 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Commentary Panel */}
        <div className="rounded-2xl border-3 border-dotted border-black p-6">
          <div className="flex h-full flex-col items-center justify-center">
            <div className="mb-6 h-16 w-16 rounded-full bg-gray-200" />
            <div className="mb-3 h-6 w-48 rounded bg-gray-200" />
            <div className="h-4 w-72 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </main>
  );
}
