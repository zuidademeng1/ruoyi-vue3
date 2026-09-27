<template>
  <div class="browse-container">
    <!-- 左侧：公共知识库列表 -->
    <div class="browse-sidebar">
      <div class="sidebar-header">公共知识库</div>
      <div class="kb-list">
        <div
          v-for="kb in kbList"
          :key="kb.kbId"
          class="kb-item"
          :class="{ active: kb.kbId === currentKbId }"
          @click="selectKb(kb)"
        >
          <span class="kb-name">{{ kb.kbName }}</span>
        </div>
        <el-empty v-if="!kbList.length" description="暂无公共知识库" :image-size="60" />
      </div>
    </div>

    <!-- 右侧：文件列表 -->
    <div class="browse-main">
      <el-form :inline="true" class="search-bar">
        <el-form-item>
          <el-input v-model="keyword" placeholder="搜索文件名" clearable style="width: 220px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="docList">
        <el-table-column label="文件名" prop="fileName" min-width="280" />
        <el-table-column label="类型" prop="fileExt" width="80" align="center" />
        <el-table-column label="大小" width="100" align="center">
          <template #default="scope">{{ formatSize(scope.row.fileSize) }}</template>
        </el-table-column>
        <el-table-column label="上传时间" prop="uploadTime" width="180" align="center" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="viewFile(scope.row)">查看原件</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-show="total > 0"
        :total="total"
        :current-page="queryParams.page_num"
        :page-size="queryParams.page_size"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { listKbByScope } from '@/api/ai/kb'
import { listPublicDoc } from '@/api/ai/doc'
import { getToken } from '@/utils/auth'

const loading = ref(false)
const kbList = ref([])
const currentKbId = ref('')
const docList = ref([])
const total = ref(0)
const keyword = ref('')
const queryParams = ref({ page_num: 1, page_size: 20 })

function loadKbs() {
  listKbByScope('public').then(res => {
    kbList.value = res.data || []
    if (kbList.value.length && !currentKbId.value) {
      selectKb(kbList.value[0])
    }
  }).catch(() => {})
}

function selectKb(kb) {
  currentKbId.value = kb.kbId
  queryParams.value.page_num = 1
  getList()
}

function getList() {
  if (!currentKbId.value) return
  loading.value = true
  listPublicDoc({
    kb_id: currentKbId.value,
    page_num: queryParams.value.page_num,
    page_size: queryParams.value.page_size,
    keyword: keyword.value || undefined
  }).then(res => {
    docList.value = res.rows || []
    total.value = res.total || 0
    loading.value = false
  }).catch(() => { loading.value = false })
}

function handleSearch() {
  queryParams.value.page_num = 1
  getList()
}

function viewFile(row) {
  const url = `${import.meta.env.VITE_APP_BASE_API}/doc/view/${row.docId}?token=${getToken()}`
  window.open(url, '_blank')
}

function formatSize(size) {
  if (!size && size !== 0) return '-'
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / 1024 / 1024).toFixed(1) + ' MB'
}

function handleSizeChange(val) {
  queryParams.value.page_size = val
  getList()
}

function handleCurrentChange(val) {
  queryParams.value.page_num = val
  getList()
}

loadKbs()
</script>

<style scoped>
.browse-container {
  display: flex;
  height: calc(100vh - 130px);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  overflow: hidden;
}
.browse-sidebar {
  width: 240px;
  border-right: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
}
.sidebar-header {
  padding: 12px;
  font-weight: bold;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.kb-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
.kb-item {
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 4px;
}
.kb-item:hover {
  background: var(--el-fill-color-light);
}
.kb-item.active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.kb-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.browse-main {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
}
.search-bar {
  margin-bottom: 8px;
}
</style>
