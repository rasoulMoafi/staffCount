<script setup lang="ts">
import type { StaffEntry } from '~/composables/useStaffStorage'
import type { StaffFileItem } from '~/utils/staffFile'
import { downloadStaffFile, parseStaffFromText } from '~/utils/staffFile'

useHead({
  title: 'شمارش اجناس',
  htmlAttrs: {
    lang: 'fa',
    dir: 'rtl',
  },
})

const { staff, isReady, addStaff, updateStaff, removeStaff, replaceStaff, totalWarehouse, totalCar } = useStaffStorage()

const name = ref('')
const warehouse = ref<number | null>(null)
const car = ref<number | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const pendingImportItems = ref<StaffFileItem[]>([])

const editDialogRef = ref<HTMLDialogElement | null>(null)
const deleteDialogRef = ref<HTMLDialogElement | null>(null)
const exportDialogRef = ref<HTMLDialogElement | null>(null)
const importDialogRef = ref<HTMLDialogElement | null>(null)
const importErrorDialogRef = ref<HTMLDialogElement | null>(null)
const importErrorMessage = ref('')
const exportFileName = ref('')
const editingEntry = ref<StaffEntry | null>(null)
const deletingEntry = ref<StaffEntry | null>(null)
const editName = ref('')
const editWarehouse = ref<number | null>(null)
const editCar = ref<number | null>(null)

function parseCount(value: number | null) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function handleAdd() {
  const success = addStaff(
    name.value,
    parseCount(warehouse.value),
    parseCount(car.value),
  )

  if (success) {
    name.value = ''
    warehouse.value = null
    car.value = null
  }
}

function defaultExportFileName() {
  const date = new Date().toISOString().slice(0, 10)
  return `شمارش-اجناس-${date}`
}

function openExportDialog() {
  if (!staff.value.length) {
    return
  }

  exportFileName.value = defaultExportFileName()
  exportDialogRef.value?.showModal()
}

function closeExportDialog() {
  exportDialogRef.value?.close()
  exportFileName.value = ''
}

function confirmExport() {
  if (!exportFileName.value.trim()) {
    return
  }

  downloadStaffFile(staff.value, exportFileName.value)
  closeExportDialog()
}

function triggerImport() {
  fileInputRef.value?.click()
}

async function handleImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  try {
    const text = await file.text()
    const items = parseStaffFromText(text)

    if (!items.length) {
      importErrorMessage.value = 'فایل معتبری برای وارد کردن پیدا نشد.'
      importErrorDialogRef.value?.showModal()
      return
    }

    if (staff.value.length === 0) {
      replaceStaff(items)
      return
    }

    pendingImportItems.value = items
    importDialogRef.value?.showModal()
  }
  catch {
    importErrorMessage.value = 'خواندن فایل با خطا مواجه شد.'
    importErrorDialogRef.value?.showModal()
  }
  finally {
    input.value = ''
  }
}

function closeImportConfirm() {
  importDialogRef.value?.close()
  pendingImportItems.value = []
}

function confirmImport() {
  replaceStaff(pendingImportItems.value)
  closeImportConfirm()
}

function closeImportError() {
  importErrorDialogRef.value?.close()
  importErrorMessage.value = ''
}

function openEdit(entry: StaffEntry) {
  editingEntry.value = entry
  editName.value = entry.name
  editWarehouse.value = entry.warehouse
  editCar.value = entry.car
  editDialogRef.value?.showModal()
}

function closeEdit() {
  editDialogRef.value?.close()
  editingEntry.value = null
  editName.value = ''
  editWarehouse.value = null
  editCar.value = null
}

function handleEditSave() {
  if (!editingEntry.value) {
    return
  }

  const success = updateStaff(
    editingEntry.value.id,
    editName.value,
    parseCount(editWarehouse.value),
    parseCount(editCar.value),
  )

  if (success) {
    closeEdit()
  }
}

function openDeleteConfirm(entry: StaffEntry) {
  deletingEntry.value = entry
  deleteDialogRef.value?.showModal()
}

function closeDeleteConfirm() {
  deleteDialogRef.value?.close()
  deletingEntry.value = null
}

function confirmDelete() {
  if (deletingEntry.value) {
    removeStaff(deletingEntry.value.id)
  }
  closeDeleteConfirm()
}
</script>

<template>
  <div class="mx-auto min-h-screen w-full max-w-md px-4 py-6 pb-8">
    <header class="mb-6 text-center">
      <h1 class="text-2xl font-bold text-base-content">
        شمارش اجناس
      </h1>
      <p class="mt-2 text-sm leading-7 text-base-content/70">
        نام اجناس و تعداد انبار و ماشین را ثبت کنید. اطلاعات به‌صورت خودکار در مرورگر شما ذخیره می‌شود.
      </p>
    </header>

    <section class="card mb-5 bg-base-100 shadow-md">
      <div class="card-body gap-4 p-4">
        <h2 class="text-lg font-semibold">
          افزودن اجناس
        </h2>

        <label class="form-control w-full">
          <span class="label pb-1">
            <span class="label-text font-medium">نام اجناس</span>
          </span>
          <input
            v-model="name"
            type="text"
            class="input input-bordered w-full"
            placeholder="مثلاً وینستون"
            @keyup.enter="handleAdd"
          >
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="form-control w-full">
            <span class="label pb-1">
              <span class="label-text font-medium">انبار</span>
            </span>
            <input
              v-model.number="warehouse"
              type="number"
              min="0"
              inputmode="numeric"
              class="input input-bordered w-full"
              placeholder="۰"
              @keyup.enter="handleAdd"
            >
          </label>

          <label class="form-control w-full">
            <span class="label pb-1">
              <span class="label-text font-medium">ماشین</span>
            </span>
            <input
              v-model.number="car"
              type="number"
              min="0"
              inputmode="numeric"
              class="input input-bordered w-full"
              placeholder="۰"
              @keyup.enter="handleAdd"
            >
          </label>
        </div>

        <button
          type="button"
          class="btn btn-primary btn-block mt-1"
          :disabled="!name.trim()"
          @click="handleAdd"
        >
          افزودن به لیست
        </button>
      </div>
    </section>

    <section class="card bg-base-100 shadow-md">
      <div class="card-body gap-4 p-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">
            لیست اجناس
          </h2>
          <div class="flex gap-2">
            <span class="badge badge-neutral badge-lg">
              انبار: {{ totalWarehouse }}
            </span>
            <span class="badge badge-neutral badge-lg">
              ماشین: {{ totalCar }}
            </span>
          </div>
        </div>

        <div v-if="!isReady" class="py-8 text-center text-sm text-base-content/60">
          در حال بارگذاری...
        </div>

        <div
          v-else-if="staff.length === 0"
          class="rounded-box border border-dashed border-base-300 py-10 text-center text-sm text-base-content/60"
        >
          هنوز اجناسی ثبت نشده است
        </div>

        <ul v-else class="flex flex-col gap-3">
          <li class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 px-1 text-xs font-medium text-base-content/60">
            <span class="text-right">نام</span>
            <span class="w-8" />
            <span class="w-14 text-center">انبار</span>
            <span class="w-14 text-center">ماشین</span>
          </li>

          <li
            v-for="entry in staff"
            :key="entry.id"
            class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 rounded-box border border-base-300 bg-base-200/50 p-3"
          >
            <div class="min-w-0 text-right">
              <p class="truncate font-medium">
                {{ entry.name }}
              </p>
            </div>

            <div class="flex shrink-0 items-center gap-1">
              <button
                type="button"
                class="btn btn-ghost btn-sm btn-square"
                aria-label="ویرایش"
                @click="openEdit(entry)"
              >
                ✎
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-sm btn-square text-error"
                aria-label="حذف"
                @click="openDeleteConfirm(entry)"
              >
                ✕
              </button>
            </div>

            <div class="badge badge-neutral badge-lg w-14 shrink-0 justify-center">
              {{ entry.warehouse }}
            </div>

            <div class="badge badge-neutral badge-lg w-14 shrink-0 justify-center">
              {{ entry.car }}
            </div>
          </li>
        </ul>

        <div
          v-if="isReady && staff.length > 0"
          class="divider my-0"
        />

        <div
          v-if="isReady && staff.length > 0"
          class="grid grid-cols-2 gap-3"
        >
          <div class="flex items-center justify-between rounded-box bg-primary/10 px-4 py-3">
            <span class="font-medium">جمع انبار</span>
            <span class="text-lg font-bold text-primary">{{ totalWarehouse }}</span>
          </div>
          <div class="flex items-center justify-between rounded-box bg-primary/10 px-4 py-3">
            <span class="font-medium">جمع ماشین</span>
            <span class="text-lg font-bold text-primary">{{ totalCar }}</span>
          </div>
        </div>

        <div v-if="isReady" class="flex gap-2">
          <button
            type="button"
            class="btn btn-outline flex-1"
            :disabled="staff.length === 0"
            @click="openExportDialog"
          >
            خروجی
          </button>
          <button
            type="button"
            class="btn btn-outline flex-1"
            @click="triggerImport"
          >
            ورودی
          </button>
          <input
            ref="fileInputRef"
            type="file"
            accept=".txt,text/plain"
            class="hidden"
            @change="handleImport"
          >
        </div>
      </div>
    </section>

    <dialog ref="exportDialogRef" class="modal">
      <div class="modal-box w-11/12 max-w-md">
        <h3 class="text-lg font-bold">
          خروجی گرفتن
        </h3>

        <div class="mt-4">
          <label class="form-control w-full">
            <span class="label pb-1">
              <span class="label-text font-medium">نام فایل</span>
            </span>
            <input
              v-model="exportFileName"
              type="text"
              class="input input-bordered w-full"
              placeholder="مثلاً لیست-اجناس"
              @keyup.enter="confirmExport"
            >
          </label>
          <p class="mt-2 text-xs text-base-content/60">
            پسوند .txt به‌صورت خودکار اضافه می‌شود.
          </p>
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="closeExportDialog">
            انصراف
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!exportFileName.trim()"
            @click="confirmExport"
          >
            ذخیره فایل
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="button" @click="closeExportDialog">
          بستن
        </button>
      </form>
    </dialog>

    <dialog ref="editDialogRef" class="modal">
      <div class="modal-box w-11/12 max-w-md">
        <h3 class="text-lg font-bold">
          ویرایش اجناس
        </h3>

        <div class="mt-4 flex flex-col gap-4">
          <label class="form-control w-full">
            <span class="label pb-1">
              <span class="label-text font-medium">نام اجناس</span>
            </span>
            <input
              v-model="editName"
              type="text"
              class="input input-bordered w-full"
              placeholder="مثلاً وینستون"
              @keyup.enter="handleEditSave"
            >
          </label>

          <div class="grid grid-cols-2 gap-3">
            <label class="form-control w-full">
              <span class="label pb-1">
                <span class="label-text font-medium">انبار</span>
              </span>
              <input
                v-model.number="editWarehouse"
                type="number"
                min="0"
                inputmode="numeric"
                class="input input-bordered w-full"
                placeholder="۰"
                @keyup.enter="handleEditSave"
              >
            </label>

            <label class="form-control w-full">
              <span class="label pb-1">
                <span class="label-text font-medium">ماشین</span>
              </span>
              <input
                v-model.number="editCar"
                type="number"
                min="0"
                inputmode="numeric"
                class="input input-bordered w-full"
                placeholder="۰"
                @keyup.enter="handleEditSave"
              >
            </label>
          </div>
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="closeEdit">
            انصراف
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!editName.trim()"
            @click="handleEditSave"
          >
            ذخیره تغییرات
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="button" @click="closeEdit">
          بستن
        </button>
      </form>
    </dialog>

    <dialog ref="importDialogRef" class="modal">
      <div class="modal-box w-11/12 max-w-md">
        <h3 class="text-lg font-bold">
          جایگزینی داده‌ها
        </h3>
        <p class="py-4 text-sm leading-7 text-base-content/80">
          با وارد کردن فایل، تمام اجناس موجود
          <span class="font-semibold">({{ staff.length }} مورد)</span>
          حذف شده و با داده‌های فایل جایگزین می‌شوند. آیا ادامه می‌دهید؟
        </p>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="closeImportConfirm">
            انصراف
          </button>
          <button type="button" class="btn btn-warning" @click="confirmImport">
            جایگزینی
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="button" @click="closeImportConfirm">
          بستن
        </button>
      </form>
    </dialog>

    <dialog ref="importErrorDialogRef" class="modal">
      <div class="modal-box w-11/12 max-w-md">
        <h3 class="text-lg font-bold">
          خطا در ورودی
        </h3>
        <p class="py-4 text-sm leading-7 text-base-content/80">
          {{ importErrorMessage }}
        </p>

        <div class="modal-action">
          <button type="button" class="btn btn-primary" @click="closeImportError">
            متوجه شدم
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="button" @click="closeImportError">
          بستن
        </button>
      </form>
    </dialog>

    <dialog ref="deleteDialogRef" class="modal">
      <div class="modal-box w-11/12 max-w-md">
        <h3 class="text-lg font-bold">
          حذف اجناس
        </h3>
        <p class="py-4 text-sm leading-7 text-base-content/80">
          آیا از حذف
          <span class="font-semibold">{{ deletingEntry?.name }}</span>
          با انبار
          <span class="font-semibold">{{ deletingEntry?.warehouse }}</span>
          و ماشین
          <span class="font-semibold">{{ deletingEntry?.car }}</span>
          مطمئن هستید؟
        </p>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="closeDeleteConfirm">
            انصراف
          </button>
          <button type="button" class="btn btn-error" @click="confirmDelete">
            حذف
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="button" @click="closeDeleteConfirm">
          بستن
        </button>
      </form>
    </dialog>
  </div>
</template>
