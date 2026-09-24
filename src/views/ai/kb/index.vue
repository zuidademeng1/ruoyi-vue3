<template>
  <div class="app-container">
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="个人知识库" name="personal" />
      <el-tab-pane label="公共知识库" name="public" />
    </el-tabs>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" @click="handleAdd">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" :disabled="multiple" @click="handleBatchDelete">批量删除</el-button>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="kbList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="名称" prop="kbName" min-width="160" />
      <el-table-column label="描述" prop="kbDesc" :show-overflow-tooltip="true" min-width="220" />
      <el-table-column label="类型" align="center" width="90">
        <template #default="scope">
          <el-tag :type="scope.row.publicFlag === '1' ? 'warning' : 'info'">
            {{ scope.row.publicFlag === '1' ? '公共' : '个人' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180" />
      <el-table-column label="操作" align="center" width="120">
        <template #default="scope">
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

    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="kbRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="名称" prop="kbName">
          <el-input v-model="form.kbName" placeholder="请输入知识库名称" />
        </el-form-item>
        <el-form-item label="描述" prop="kbDesc">
          <el-input v-model="form.kbDesc" type="textarea" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="公开状态" prop="publicFlag">
          <el-radio-group v-model="form.publicFlag">
            <el-radio value="0">个人</el-radio>
            <el-radio value="1">公开</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="open = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { listPersonalKb, listPublicKb, addKb, delKb, batchDelKb } from '@/api/ai/kb'

const { proxy } = getCurrentInstance()

const loading = ref(false)
const kbList = ref([])
const total = ref(0)
const activeTab = ref('personal')
const multiple = ref(true)
const ids = ref([])

const queryParams = ref({ page_num: 1, page_size: 10 })

const open = ref(false)
const title = ref('')
const form = ref({ kbName: '', kbDesc: '', publicFlag: '0' })
const rules = {
  kbName: [{ required: true, message: '请输入知识库名称', trigger: 'blur' }]
}

function getList() {
  loading.value = true
  const api = activeTab.value === 'personal' ? listPersonalKb : listPublicKb
  api(queryParams.value).then(res => {
    kbList.value = res.rows || []
    total.value = res.total || 0
    loading.value = false
  }).catch(() => { loading.value = false })
}

function handleTabChange() {
  queryParams.value.page_num = 1
  getList()
}

function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.kbId)
  multiple.value = !selection.length
}

function reset() {
  form.value = { kbName: '', kbDesc: '', publicFlag: '0' }
  proxy.$refs['kbRef'] && proxy.$refs['kbRef'].resetFields()
}

function handleAdd() {
  reset()
  title.value = '新增知识库'
  open.value = true
}

function submitForm() {
  proxy.$refs['kbRef'].validate(valid => {
    if (valid) {
      addKb(form.value).then(() => {
        ElMessage.success('新增成功')
        open.value = false
        getList()
      })
    }
  })
}

function handleDelete(row) {
  ElMessageBox.confirm(`确认删除知识库「${row.kbName}」吗？`, '提示', { type: 'warning' }).then(() => {
    return delKb(row.kbId)
  }).then(() => {
    ElMessage.success('删除成功')
    getList()
  }).catch(() => {})
}

function handleBatchDelete() {
  if (!ids.value.length) return
  ElMessageBox.confirm(`确认删除选中的 ${ids.value.length} 个知识库吗？`, '提示', { type: 'warning' }).then(() => {
    return batchDelKb(ids.value)
  }).then(() => {
    ElMessage.success('删除成功')
    getList()
  }).catch(() => {})
}

function handleSizeChange(val) {
  queryParams.value.page_size = val
  getList()
}

function handleCurrentChange(val) {
  queryParams.value.page_num = val
  getList()
}

getList()
</script>
