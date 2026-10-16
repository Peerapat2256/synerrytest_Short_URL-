<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface ShortUrlItem {
  id: number
  original_url: string
  short_code: string
  short_url: string
  qr_code: string
  click_count: number
  created_at: string
  expires_at: string | null
  is_expired: boolean
}

const originalUrl = ref('')
const customAlias = ref('')
const expiresInDays = ref<number | ''>('')
const isLoading = ref(false)
const errorMessage = ref('')
const successResult = ref<ShortUrlItem | null>(null)

const historyList = ref<ShortUrlItem[]>([])
const isFetchingHistory = ref(false)
const copiedId = ref<number | null>(null)
const selectedQrItem = ref<ShortUrlItem | null>(null)

// ฟังก์ชันดึงประวัติ URL ทั้งหมด
const fetchHistory = async () => {
  try {
    isFetchingHistory.value = true
    const res = await $fetch<{ success: boolean; data: ShortUrlItem[] }>('/api/urls')
    if (res.success) {
      historyList.value = res.data
    }
  } catch (err: any) {
    console.error('Fetch history error:', err)
  } finally {
    isFetchingHistory.value = false
  }
}

// ฟังก์ชันสร้าง Short URL
const handleShorten = async () => {
  if (!originalUrl.value.trim()) {
    errorMessage.value = 'กรุณากรอก Full URL ที่ต้องการย่อ'
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''
    successResult.value = null

    const res = await $fetch<{ success: boolean; data: ShortUrlItem }>('/api/shorten', {
      method: 'POST',
      body: {
        original_url: originalUrl.value.trim(),
        custom_alias: customAlias.value.trim() || undefined,
        expires_in_days: expiresInDays.value ? Number(expiresInDays.value) : undefined
      }
    })

    if (res.success) {
      successResult.value = res.data
      originalUrl.value = ''
      customAlias.value = ''
      expiresInDays.value = ''
      // รีเฟรชประวัติ
      await fetchHistory()
    }
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || err.message || 'เกิดข้อผิดพลาดในการสร้าง Short URL'
  } finally {
    isLoading.value = false
  }
}

// คัดลอกลิงก์
const copyToClipboard = async (text: string, id: number) => {
  try {
    await navigator.clipboard.writeText(text)
    copiedId.value = id
    setTimeout(() => {
      copiedId.value = null
    }, 2000)
  } catch (err) {
    console.error('Copy failed:', err)
  }
}

// ลบลิงก์
const deleteUrl = async (id: number) => {
  if (!confirm('ยืนยันที่จะลบ Short URL นี้?')) return
  try {
    await $fetch(`/api/urls/${id}`, { method: 'DELETE' })
    if (successResult.value?.id === id) {
      successResult.value = null
    }
    await fetchHistory()
  } catch (err: any) {
    alert(err.data?.statusMessage || 'เกิดข้อผิดพลาดในการลบ')
  }
}

// ดาวน์โหลด QR Code
const downloadQr = (dataUrl: string, code: string) => {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = `qrcode-${code}.png`
  link.click()
}

// จัด Format วันที่
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchHistory()
})
</script>

<template>
  <div class="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
    <!-- Navbar -->
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

    <main class="max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-12">
      <!-- Hero / Input Section -->
      <section class="text-center max-w-3xl mx-auto space-y-4">
        <h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-sky-300 to-rose-400 bg-clip-text text-transparent">
          สร้าง Short URL & QR Code ในไม่กี่วินาที
        </h1>
        <p class="text-slate-400 text-sm sm:text-base">
          ระบบแปลง URL ขนาดยาวให้สั้นกระชับ สแกนผ่าน QR Code ได้ทันที พร้อมระบบเก็บประวัติและติดตามสถิติการคลิก
        </p>

        <!-- Form Card -->
        <div class="mt-8 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl text-left">
          <form @submit.prevent="handleShorten" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Full URL ต้นฉบับ <span class="text-rose-400">*</span>
              </label>
              <div class="relative">
                <input
                  v-model="originalUrl"
                  type="text"
                  placeholder="https://www.synerry.com หรือแปะลิงก์ยาวๆ ที่นี่..."
                  class="w-full px-4 py-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base transition"
                  :disabled="isLoading"
                />
              </div>
            </div>

            <!-- Optional Features (Custom Alias & Expiry) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">
                  Custom Alias (ระบุชื่อเอง - ไม่บังคับ)
                </label>
                <div class="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-indigo-500">
                  <span class="text-slate-500 select-none text-xs">/</span>
                  <input
                    v-model="customAlias"
                    type="text"
                    placeholder="my-custom-link"
                    class="w-full bg-transparent border-0 text-white placeholder-slate-500 focus:outline-none px-1 text-sm"
                    :disabled="isLoading"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">
                  วันหมดอายุ (Expiry Days - ไม่บังคับ)
                </label>
                <select
                  v-model="expiresInDays"
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  :disabled="isLoading"
                >
                  <option value="">ไม่มีวันหมดอายุ (Never)</option>
                  <option :value="1">1 วัน</option>
                  <option :value="7">7 วัน</option>
                  <option :value="30">30 วัน</option>
                </select>
              </div>
            </div>

            <!-- Error Notification -->
            <div v-if="errorMessage" class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm">
              {{ errorMessage }}
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span v-if="isLoading">กำลังสร้าง...</span>
              <span v-else>ย่อลิงก์ (Shorten URL)</span>
            </button>
          </form>
        </div>
      </section>

      <!-- Success Result Box (เมื่อสร้างสำเร็จ) -->
      <section v-if="successResult" class="max-w-3xl mx-auto">
        <div class="bg-gradient-to-b from-indigo-950/40 to-slate-800/80 border border-indigo-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div class="flex items-center gap-2 text-indigo-400 text-sm font-semibold mb-4">
            <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
            สร้าง Short URL เรียบร้อยแล้ว!
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <!-- QR Code Preview -->
            <div class="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-inner text-slate-900">
              <img :src="successResult.qr_code" alt="QR Code" class="w-44 h-44 object-contain" />
              <button
                @click="downloadQr(successResult.qr_code, successResult.short_code)"
                class="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition"
              >
                ดาวน์โหลด QR Code
              </button>
            </div>

            <!-- URL Details & Actions -->
            <div class="md:col-span-2 space-y-4">
              <div>
                <span class="text-xs text-slate-400 uppercase tracking-wider block mb-1">Short URL ของคุณ</span>
                <div class="flex items-center gap-2 bg-slate-900/90 border border-slate-700 p-2.5 rounded-xl">
                  <a
                    :href="successResult.short_url"
                    target="_blank"
                    class="text-indigo-400 hover:text-indigo-300 font-medium text-sm sm:text-base break-all flex-1 underline underline-offset-4"
                  >
                    {{ successResult.short_url }}
                  </a>
                  <button
                    @click="copyToClipboard(successResult.short_url, successResult.id)"
                    class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shrink-0"
                  >
                    {{ copiedId === successResult.id ? 'คัดลอกแล้ว!' : 'Copy' }}
                  </button>
                </div>
              </div>

              <div>
                <span class="text-xs text-slate-400 uppercase tracking-wider block mb-1">URL ปลายทาง (Original URL)</span>
                <p class="text-slate-300 text-xs sm:text-sm break-all line-clamp-2">
                  {{ successResult.original_url }}
                </p>
              </div>

              <div class="flex flex-wrap gap-4 pt-2 text-xs text-slate-400 border-t border-slate-700/60">
                <span>รหัสสั้น: <strong class="text-slate-200">{{ successResult.short_code }}</strong></span>
                <span>หมดอายุ: <strong class="text-slate-200">{{ formatDate(successResult.expires_at || '') }}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- History & Analytics Table Section -->
      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              ประวัติ & สถิติการใช้งาน
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {{ historyList.length }} ลิงก์
              </span>
            </h2>
            <p class="text-xs sm:text-sm text-slate-400">รายการ URL ที่สร้างทั้งหมด และจำนวนครั้งที่มีผู้คลิกเปิดลิงก์</p>
          </div>

          <button
            @click="fetchHistory"
            :disabled="isFetchingHistory"
            class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            {{ isFetchingHistory ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล' }}
          </button>
        </div>

        <!-- Table Container -->
        <div class="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-slate-900/80 text-slate-400 uppercase text-[11px] tracking-wider border-b border-slate-700">
                <tr>
                  <th class="py-3.5 px-4">Short URL</th>
                  <th class="py-3.5 px-4">Full URL ปลายทาง</th>
                  <th class="py-3.5 px-4 text-center">สถิติคลิก</th>
                  <th class="py-3.5 px-4 text-center">QR Code</th>
                  <th class="py-3.5 px-4">วันที่สร้าง</th>
                  <th class="py-3.5 px-4 text-center">สถานะ</th>
                  <th class="py-3.5 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-700/60 text-slate-300">
                <tr v-if="historyList.length === 0">
                  <td colspan="7" class="py-8 text-center text-slate-500">
                    ยังไม่มีข้อมูลประวัติ Short URL ในระบบ เริ่มสร้างได้ที่กล่องด้านบนเลย!
                  </td>
                </tr>

                <tr
                  v-for="item in historyList"
                  :key="item.id"
                  class="hover:bg-slate-700/30 transition"
                >
                  <!-- Short URL -->
                  <td class="py-3.5 px-4 font-mono font-medium text-indigo-400">
                    <div class="flex items-center gap-1.5">
                      <a :href="item.short_url" target="_blank" class="hover:underline">
                        /{{ item.short_code }}
                      </a>
                      <button
                        @click="copyToClipboard(item.short_url, item.id)"
                        class="p-1 hover:text-white transition text-slate-500"
                        title="Copy link"
                      >
                        {{ copiedId === item.id ? '✓' : '📋' }}
                      </button>
                    </div>
                  </td>

                  <!-- Original URL -->
                  <td class="py-3.5 px-4 max-w-xs truncate" :title="item.original_url">
                    <a :href="item.original_url" target="_blank" class="hover:text-white hover:underline text-slate-400">
                      {{ item.original_url }}
                    </a>
                  </td>

                  <!-- Clicks Count -->
                  <td class="py-3.5 px-4 text-center">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {{ item.click_count }} ครั้ง
                    </span>
                  </td>

                  <!-- QR Code Preview Button -->
                  <td class="py-3.5 px-4 text-center">
                    <button
                      @click="selectedQrItem = item"
                      class="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 transition"
                    >
                      ดู QR
                    </button>
                  </td>

                  <!-- Created At -->
                  <td class="py-3.5 px-4 text-slate-400 text-xs">
                    {{ formatDate(item.created_at) }}
                  </td>

                  <!-- Status -->
                  <td class="py-3.5 px-4 text-center">
                    <span
                      v-if="item.is_expired"
                      class="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    >
                      หมดอายุ
                    </span>
                    <span
                      v-else
                      class="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    >
                      ปกติ
                    </span>
                  </td>

                  <!-- Delete Button -->
                  <td class="py-3.5 px-4 text-center">
                    <button
                      @click="deleteUrl(item.id)"
                      class="text-slate-500 hover:text-rose-400 transition text-xs p-1"
                      title="ลบ"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>

    <!-- Modal ดู QR Code ขนาดใหญ่ -->
    <div
      v-if="selectedQrItem"
      class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      @click.self="selectedQrItem = null"
    >
      <div class="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
        <h3 class="font-bold text-lg text-white">QR Code</h3>
        <p class="text-xs text-slate-400 break-all font-mono">
          {{ selectedQrItem.short_url }}
        </p>

        <div class="p-4 bg-white rounded-xl inline-block shadow-inner mx-auto">
          <img :src="selectedQrItem.qr_code" alt="QR Code" class="w-52 h-52 object-contain" />
        </div>

        <div class="flex gap-2 justify-center pt-2">
          <button
            @click="downloadQr(selectedQrItem.qr_code, selectedQrItem.short_code)"
            class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
          >
            ดาวน์โหลดภาพ
          </button>
          <button
            @click="selectedQrItem = null"
            class="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
