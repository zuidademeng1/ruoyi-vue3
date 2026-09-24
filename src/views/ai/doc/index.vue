<template>
  <div class="app-container">
    <el-form :inline="true">
      <el-form-item label="知识库">
        <el-select v-model="queryParams.kb_id" placeholder="请选择知识库" clearable style="width: 200px" @change="getList">
          <el-option v-for="kb in kbOptions" :key="kb.kbId" :label="kb.kbName" :value="kb.kbId" />
        </el-select>
      </el-form-item>
      <el-form-item label="文件名">
        <el-input v-model="queryParams.keyword" placeholder="搜索文件名" clearable style="width: 200px" @keyup.enter="getList" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getList">搜索</el-button>
      </el-form-item>
      <el-form-item>
        <el-upload
          :action="uploadUrl"
          :headers="uploadHeaders"
          :data="uploadData"
          :show-file-list="false"
          :before-upload="beforeUpload"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
        >
          <el-button type="primary" :disabled="!queryParams.kb_id">上传文档</el-button>
        </el-upload>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="docList">
      <el-table-column label="文件名" prop="fileName" min-width="220" />
      <el-table-column label="类型" prop="fileExt" width="80" align="center" />
      <el-table-column label="大小" width="100" align="center">
        <template #default="scope">{{ formatSize(scope.row.fileSize) }}</template>
      </el-table-column>
      <el-table-column label="解析状态" width="110" align="center">
        <template #default="scope">
          <el-tag :type="statusTag(scope.row.chunkStatus)">{{ statusText(scope.row.chunkStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="上传时间" prop="uploadTime" width="180" align="center" />
      <el-table-column label="操作" align="center" width="200">
        <template #default="scope">
          <el-button link type="primary" @click="handleParse(scope.row)">解析</el-button>
          <el-button link type="primary" @click="handleView(scope.row)">预览</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
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
</template>

<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { listDoc, parseDoc, delDoc } from '@/api/ai/doc'
import { listKbByScope } from '@/api/ai/kb'
import { getToken } from '@/utils/auth'

const loading = ref(false)
const docList = ref([])
const total = ref(0)
const kbOptions = ref([])

const queryParams = ref({ kb_id: '', keyword: '', page_num: 1, page_size: 20 })

const uploadUrl = import.meta.env.VITE_APP_BASE_API + '/doc/upload'
const uploadHeaders = computed(() => ({ Authorization: 'Bearer ' + getToken() }))
const uploadData = computed(() => ({ kbId: queryParams.value.kb_id }))

function getKbOptions() {
  Promise.all([listKbByScope('personal'), listKbByScope('public')]).then(([p, pub]) => {
    kbOptions.value = [...(p.data || []), ...(pub.data || [])]
  }).catch(() => {})
}

function getList() {
  loading.value = true
  const params = { ...queryParams.value, keyword: queryParams.value.keyword || undefined }
  listDoc(params).then(res => {
    docList.value = res.rows || []
    total.value = res.total || 0
    loading.value = false
  }).catch(() => { loading.value = false })
}

function beforeUpload(file) {
  if (!queryParams.value.kb_id) {
    ElMessage.warning('请先选择知识库')
    return false
  }
  return true
}

function handleUploadSuccess(res) {
  if (res.code === 0) {
    ElMessage.success('上传成功')
    getList()
  } else {
    ElMessage.error(res.msg || '上传失败')
  }
}

function handleUploadError() {
  ElMessage.error('上传失败')
}

function handleParse(row) {
  ElMessageBox.confirm(`确认对「${row.fileName}」执行解析吗？`, '提示', { type: 'warning' }).then(() => {
    return parseDoc(row.docId)
  }).then(() => {
    ElMessage.success('已提交解析，后台处理中')
    getList()
  }).catch(() => {})
}

function handleView(row) {
  const url = `${import.meta.env.VITE_APP_BASE_API}/doc/view/${row.docId}?token=${getToken()}`
  window.open(url, '_blank')
}

function handleDelete(row) {
  ElMessageBox.confirm(`确认删除文档「${row.fileName}」吗？`, '提示', { type: 'warning' }).then(() => {
    return delDoc(row.docId)
  }).then(() => {
    ElMessage.success('删除成功')
    getList()
  }).catch(() => {})
}

function formatSize(size) {
  if (!size && size !== 0) return '-'
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / 1024 / 1024).toFixed(1) + ' MB'
}

function statusText(status) {
  const map = { pending: '待解析', completed: '已完成', failed: '解析失败' }
  return map[status] || (status || '未解析')
}

function statusTag(status) {
  const map = { pending: 'info', completed: 'success', failed: 'danger' }
  return map[status] || 'info'
}

function handleSizeChange(val) {
  queryParams.value.page_size = val
  getList()
}

function handleCurrentChange(val) {
  queryParams.value.page_num = val
  getList()
}

getKbOptions()
getList()
</script>
