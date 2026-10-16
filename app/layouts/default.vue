<template>
  <div class="min-h-screen bg-[#fafafa] text-zinc-900 font-sans antialiased selection:bg-zinc-900 selection:text-white">
    <header class="bg-white border-b border-zinc-200 sticky top-0 z-30">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-7 h-7 bg-zinc-900 text-white flex items-center justify-center font-bold text-sm tracking-tight">
            S
          </div>
          <span class="font-semibold text-sm tracking-tight text-zinc-900">
            SYNERY URL SHORTENER
          </span>
        </div>

        <div class="flex items-center gap-4 text-xs text-zinc-500">
          <a
            href="https://github.com/Peerapat2256/synerrytest_Short_URL-"
            target="_blank"
            class="px-3 py-1.5 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-medium transition"
          >
            GitHub Repository
          </a>
        </div>
      </div>
    </header>

    <slot />
  </div>
</template>
