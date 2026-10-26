function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1E1919] p-6 text-[#F2ECE8]">
      <section className="w-full max-w-lg rounded-3xl border border-[#4B4344] bg-[#2A2324] p-10 shadow-2xl">
        <div className="mb-6 h-12 w-12 rounded-2xl bg-[#E06A6A]" />

        <p className="mb-2 text-sm font-medium tracking-widest text-[#E06A6A] uppercase">
          Warm Nocturne
        </p>

        <h1 className="mb-4 text-4xl font-bold tracking-tight">Focusroom</h1>

        <p className="mb-8 leading-relaxed text-[#C9BDB8]">
          Your personal space for deep work, meaningful progress, and peaceful
          productivity.
        </p>

        <div className="rounded-xl bg-[#322B2C] p-4">
          <p className="text-sm text-[#9B8F8A]">Alpha version</p>

          <p className="mt-1 font-semibold">v0.1.0 — The beginning</p>
        </div>
      </section>
    </main>
  );
}

export default App;
