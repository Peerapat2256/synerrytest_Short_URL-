<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ShortUrlItem, ClickLogItem } from '~/model/url.model'

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

const selectedLogUrlItem = ref<ShortUrlItem | null>(null)
const clickLogs = ref<ClickLogItem[]>([])
const isFetchingLogs = ref(false)

const fetchHistory = async () => {
  try {
    isFetchingHistory.value = true
    const res = await $fetch<{ success: boolean; data: ShortUrlItem[] }>('/api/urls')
    if (res.success) {
      historyList.value = res.data
    }
  } catch (err) {
    console.error(err)
  } finally {
    isFetchingHistory.value = false
  }
}

const openClickLogs = async (item: ShortUrlItem) => {
  selectedLogUrlItem.value = item
  clickLogs.value = []
  try {
    isFetchingLogs.value = true
    const res = await $fetch<{ success: boolean; data: ClickLogItem[] }>(`/api/urls/${item.id}/logs`)
    if (res.success) {
      clickLogs.value = res.data
    }
  } catch (err) {
    console.error(err)
  } finally {
    isFetchingLogs.value = false
  }
}

const handleShorten = async () => {
  if (!originalUrl.value.trim()) {
    errorMessage.value = 'กรุณากรอก URL ที่ต้องการย่อ'
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
      await fetchHistory()
    }
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || err.message || 'ไม่สามารถสร้าง Short URL ได้'
  } finally {
    isLoading.value = false
  }
}

const copyToClipboard = async (text: string, id: number) => {
  try {
    await navigator.clipboard.writeText(text)
    copiedId.value = id
    setTimeout(() => {
      copiedId.value = null
    }, 2000)
  } catch (err) {
    console.error(err)
  }
}

const deleteUrl = async (id: number) => {
  if (!confirm('ต้องการลบรายการนี้ใช่หรือไม่?')) return
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

const downloadQr = (dataUrl: string, code: string) => {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = `qr-${code}.png`
  link.click()
}

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
  <main class="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
    <!-- Top Section: Form -->
    <section class="bg-white border border-zinc-200 p-6 sm:p-8 shadow-2xs">
      <div class="mb-6 border-b border-zinc-100 pb-4">
        <h1 class="text-xl font-semibold text-zinc-900 tracking-tight">
          สร้างลิงก์สั้น (Short URL)
        </h1>
        <p class="text-xs text-zinc-500 mt-1">
          วางลิงก์ต้นฉบับเพื่อสร้าง URL ขนาดสั้นและ QR Code สำหรับนำไปใช้งาน
        </p>
      </div>

      <form @submit.prevent="handleShorten" class="space-y-5">
        <div>
          <label class="block text-xs font-medium text-zinc-700 mb-1.5">
            Destination URL <span class="text-red-600">*</span>
          </label>
          <input
            v-model="originalUrl"
            type="text"
            placeholder="https://www.synerry.com"
            class="w-full px-3.5 py-2.5 bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 text-sm transition"
            :disabled="isLoading"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-zinc-700 mb-1.5">
              Custom Alias (ไม่บังคับ)
            </label>
            <div class="flex items-center border border-zinc-300 bg-white focus-within:border-zinc-900 transition">
              <span class="px-3 py-2.5 bg-zinc-50 border-r border-zinc-200 text-zinc-400 text-xs font-mono select-none">
                /
              </span>
              <input
                v-model="customAlias"
                type="text"
                placeholder="custom-slug"
                class="w-full bg-transparent px-3 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none text-sm"
                :disabled="isLoading"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-zinc-700 mb-1.5">
              วันหมดอายุ (ไม่บังคับ)
            </label>
            <select
              v-model="expiresInDays"
              class="w-full bg-white border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition"
              :disabled="isLoading"
            >
              <option value="">ไม่มีวันหมดอายุ</option>
              <option :value="1">1 วัน</option>
              <option :value="7">7 วัน</option>
              <option :value="30">30 วัน</option>
            </select>
          </div>
        </div>

        <div v-if="errorMessage" class="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {{ errorMessage }}
        </div>

        <div class="pt-1 flex justify-end">
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full sm:w-auto px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
          >
            {{ isLoading ? 'กำลังประมวลผล...' : 'สร้าง Short URL' }}
          </button>
        </div>
      </form>
    </section>

    <!-- Result Box -->
    <section v-if="successResult" class="bg-white border-2 border-zinc-900 p-6">
      <div class="flex items-center justify-between border-b border-zinc-200 pb-3 mb-5">
        <span class="text-xs font-bold uppercase tracking-wider text-zinc-900">
          ผลลัพธ์การสร้าง Short URL
        </span>
        <button
          @click="successResult = null"
          class="text-xs text-zinc-400 hover:text-zinc-900"
        >
          ปิด [X]
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        <div class="flex flex-col items-center border border-zinc-200 p-3 bg-zinc-50">
          <img :src="successResult.qr_code" alt="QR Code" class="w-36 h-36 object-contain bg-white border border-zinc-200 p-1" />
          <button
            @click="downloadQr(successResult.qr_code, successResult.short_code)"
            class="mt-2.5 w-full py-1.5 bg-white border border-zinc-300 hover:border-zinc-900 text-zinc-900 text-xs font-medium transition cursor-pointer"
          >
            ดาวน์โหลด PNG
          </button>
        </div>

        <div class="md:col-span-3 space-y-4">
          <div>
            <label class="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Short URL
            </label>
            <div class="flex items-center border border-zinc-300 bg-zinc-50">
              <a
                :href="successResult.short_url"
                target="_blank"
                class="px-3.5 py-2.5 text-sm font-mono font-semibold text-zinc-900 hover:underline break-all flex-1"
              >
                {{ successResult.short_url }}
              </a>
              <button
                @click="copyToClipboard(successResult.short_url, successResult.id)"
                class="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition shrink-0 cursor-pointer"
              >
                {{ copiedId === successResult.id ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์' }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Original URL
            </label>
            <p class="text-xs text-zinc-600 break-all font-mono">
              {{ successResult.original_url }}
            </p>
          </div>

          <div class="flex flex-wrap gap-6 pt-2 border-t border-zinc-100 text-xs text-zinc-500">
            <span>Code: <strong class="font-mono text-zinc-900">{{ successResult.short_code }}</strong></span>
            <span>หมดอายุ: <strong class="text-zinc-900">{{ formatDate(successResult.expires_at || '') }}</strong></span>
          </div>
        </div>
      </div>
    </section>

    <!-- History & Analytics Section -->
    <section class="bg-white border border-zinc-200">
      <div class="p-5 border-b border-zinc-200 flex items-center justify-between">
        <div>
          <h2 class="text-base font-semibold text-zinc-900">
            ประวัติการสร้างและสถิติการคลิก ({{ historyList.length }})
          </h2>
          <p class="text-xs text-zinc-500 mt-0.5">
            สามารถคลิกที่ตัวเลขจำนวนคลิกเพื่อตรวจสอบข้อมูล IP และ Browser จากตาราง click_logs
          </p>
        </div>

        <button
          @click="fetchHistory"
          :disabled="isFetchingHistory"
          class="px-3.5 py-1.5 border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-medium transition cursor-pointer"
        >
          {{ isFetchingHistory ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล' }}
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider text-[11px]">
              <th class="py-3 px-4 font-semibold">Short URL</th>
              <th class="py-3 px-4 font-semibold">Original URL</th>
              <th class="py-3 px-4 font-semibold text-center">Clicks</th>
              <th class="py-3 px-4 font-semibold text-center">QR Code</th>
              <th class="py-3 px-4 font-semibold">Created</th>
              <th class="py-3 px-4 font-semibold text-center">Status</th>
              <th class="py-3 px-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-200 text-zinc-700">
            <tr v-if="historyList.length === 0">
              <td colspan="7" class="py-10 text-center text-zinc-400">
                ยังไม่มีข้อมูลประวัติการสร้าง Short URL
              </td>
            </tr>

            <tr
              v-for="item in historyList"
              :key="item.id"
              class="hover:bg-zinc-50/80 transition"
            >
              <td class="py-3.5 px-4 font-mono font-semibold text-zinc-900 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <a :href="item.short_url" target="_blank" class="hover:underline">
                    /{{ item.short_code }}
                  </a>
                  <button
                    @click="copyToClipboard(item.short_url, item.id)"
                    class="px-1.5 py-0.5 border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-[10px] font-sans font-normal text-zinc-600 transition cursor-pointer"
                  >
                    {{ copiedId === item.id ? 'Copied' : 'Copy' }}
                  </button>
                </div>
              </td>

              <td class="py-3.5 px-4 max-w-xs truncate font-mono text-zinc-500" :title="item.original_url">
                <a :href="item.original_url" target="_blank" class="hover:text-zinc-900 hover:underline">
                  {{ item.original_url }}
                </a>
              </td>

              <td class="py-3.5 px-4 text-center whitespace-nowrap">
                <button
                  @click="openClickLogs(item)"
                  class="px-2.5 py-1 border border-zinc-300 bg-zinc-50 hover:border-zinc-900 hover:bg-white text-zinc-900 font-mono font-semibold text-xs transition cursor-pointer"
                  title="ดูรายละเอียดการคลิก"
                >
                  {{ item.click_count }} คลิก
                </button>
              </td>

              <td class="py-3.5 px-4 text-center whitespace-nowrap">
                <button
                  @click="selectedQrItem = item"
                  class="px-2.5 py-1 border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition cursor-pointer"
                >
                  QR Code
                </button>
              </td>

              <td class="py-3.5 px-4 text-zinc-500 whitespace-nowrap">
                {{ formatDate(item.created_at) }}
              </td>

              <td class="py-3.5 px-4 text-center whitespace-nowrap">
                <span
                  v-if="item.is_expired"
                  class="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 text-[10px] font-semibold uppercase"
                >
                  Expired
                </span>
                <span
                  v-else
                  class="px-2 py-0.5 bg-zinc-100 text-zinc-800 border border-zinc-300 text-[10px] font-semibold uppercase"
                >
                  Active
                </span>
              </td>

              <td class="py-3.5 px-4 text-right whitespace-nowrap">
                <button
                  @click="deleteUrl(item.id)"
                  class="text-zinc-400 hover:text-red-600 font-medium transition cursor-pointer"
                >
                  ลบ
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- QR Code Modal -->
    <div
      v-if="selectedQrItem"
      class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      @click.self="selectedQrItem = null"
    >
      <div class="bg-white border border-zinc-300 p-6 max-w-sm w-full space-y-4 shadow-lg text-center">
        <div class="flex items-center justify-between border-b border-zinc-200 pb-3">
          <h3 class="font-semibold text-sm text-zinc-900 uppercase tracking-wider">QR Code</h3>
          <button @click="selectedQrItem = null" class="text-xs text-zinc-400 hover:text-zinc-900 cursor-pointer">
            [X]
          </button>
        </div>

        <p class="text-xs text-zinc-600 break-all font-mono bg-zinc-50 p-2 border border-zinc-200">
          {{ selectedQrItem.short_url }}
        </p>

        <div class="p-3 bg-white border border-zinc-200 inline-block mx-auto">
          <img :src="selectedQrItem.qr_code" alt="QR Code" class="w-48 h-48 object-contain" />
        </div>

        <div class="flex gap-2 pt-2">
          <button
            @click="downloadQr(selectedQrItem.qr_code, selectedQrItem.short_code)"
            class="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
          >
            ดาวน์โหลด PNG
          </button>
          <button
            @click="selectedQrItem = null"
            class="px-4 py-2 border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>

    <!-- Click Logs Modal -->
    <div
      v-if="selectedLogUrlItem"
      class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      @click.self="selectedLogUrlItem = null"
    >
      <div class="bg-white border border-zinc-300 p-6 max-w-2xl w-full space-y-4 shadow-lg">
        <div class="flex items-center justify-between border-b border-zinc-200 pb-3">
          <div>
            <h3 class="font-semibold text-sm text-zinc-900">
              ประวัติการคลิก (Click Logs)
            </h3>
            <p class="text-xs text-zinc-500 font-mono mt-0.5">
              /{{ selectedLogUrlItem.short_code }} — รวม {{ selectedLogUrlItem.click_count }} คลิก
            </p>
          </div>
          <button
            @click="selectedLogUrlItem = null"
            class="px-3 py-1 border border-zinc-300 hover:border-zinc-900 text-zinc-700 text-xs cursor-pointer"
          >
            ปิด
          </button>
        </div>

        <div v-if="isFetchingLogs" class="py-10 text-center text-zinc-400 text-xs">
          กำลังโหลดข้อมูล...
        </div>

        <div v-else-if="clickLogs.length === 0" class="py-10 text-center text-zinc-400 text-xs">
          ยังไม่มีข้อมูลการคลิกสำหรับรายการนี้
        </div>

        <div v-else class="max-h-80 overflow-y-auto border border-zinc-200">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase text-[10px]">
              <tr>
                <th class="py-2 px-3">เวลาที่คลิก</th>
                <th class="py-2 px-3">IP Address</th>
                <th class="py-2 px-3">Referer</th>
                <th class="py-2 px-3">User Agent</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-200 text-zinc-700">
              <tr v-for="log in clickLogs" :key="log.id" class="hover:bg-zinc-50">
                <td class="py-2.5 px-3 whitespace-nowrap text-zinc-500">{{ formatDate(log.clicked_at) }}</td>
                <td class="py-2.5 px-3 font-mono text-zinc-900 whitespace-nowrap">{{ log.ip_address }}</td>
                <td class="py-2.5 px-3 text-zinc-500 whitespace-nowrap">{{ log.referer }}</td>
                <td class="py-2.5 px-3 text-zinc-500 max-w-xs truncate" :title="log.user_agent">{{ log.user_agent }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </main>
</template>
