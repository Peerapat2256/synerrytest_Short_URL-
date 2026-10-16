<template>
  <div class="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
    <!-- Navbar Layout -->
    <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
      <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-rose-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white font-black text-xl">
            S
          </div>
          <div>
            <span class="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              SYNERY Short URL
            </span>
            <span class="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-medium">
              Developer Test
            </span>
          </div>
        </div>

        <div class="flex items-center gap-4 text-xs sm:text-sm text-slate-400">
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            TiDB Cloud (MySQL)
          </span>
          <a
            href="https://github.com/Peerapat2256/synerrytest_Short_URL-"
            target="_blank"
            class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>

    <!-- เนื้อหาของแต่ละ Page จะถูกเรนเดอร์ผ่าน <slot /> -->
    <slot />
  </div>
</template>
