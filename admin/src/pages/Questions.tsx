import React, { useEffect, useState } from 'react'
import { Table, Button, Tag, Space, Modal, message, Input, Select, Form, Divider, Upload, Steps, Spin } from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined,
  SaveOutlined, RobotOutlined, UploadOutlined, CheckCircleOutlined,
  FileTextOutlined, RedoOutlined, CloseOutlined,
} from '@ant-design/icons'
import { adminApi } from '@/api'

const QuestionList: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()
  const [companies, setCompanies] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [aiOpen, setAiOpen] = useState(false)
  const [aiStep, setAiStep] = useState(0)
  const [aiFile, setAiFile] = useState<File | null>(null)
  const [aiResult, setAiResult] = useState<any[]>([])
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { loadQuestions() }, [])

  const loadQuestions = async () => {
    setLoading(true)
    try {
      const res = await adminApi.listQuestions({ question_type: typeFilter })
      setQuestions(res.data || [])
    } catch {
      message.error('请先登录管理员账号')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后不可恢复，确认删除该题目？',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await adminApi.deleteQuestion(id)
        message.success('已删除')
        loadQuestions()
      },
    })
  }

  const openForm = (id?: number) => {
    setEditingId(id || null)
    setCompanies('')
    form.resetFields()
    if (id) {
      adminApi.getQuestion(id).then((res) => {
        form.setFieldsValue({
          content: res.data.content,
          question_type: res.data.question_type,
          difficulty: res.data.difficulty,
          oral_answer: res.data.oral_answer,
          ref_answer: res.data.ref_answer,
          tags: (res.data.tags || []).join(', '),
        })
        setCompanies((res.data.companies || []).map((c: any) => `${c.name}:${c.count}`).join('\n'))
      })
    } else {
      form.setFieldsValue({ question_type: 'interview' })
    }
    setFormOpen(true)
  }

  const handleFormSubmit = async (values: any) => {
    setSubmitting(true)
    try {
      const companyList = companies
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => {
          const [name, count] = l.split(':')
          return { name: name.trim(), count: parseInt(count) || 1 }
        })
      const data = {
        ...values,
        tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        companies: companyList,
      }
      if (editingId) {
        await adminApi.updateQuestion(editingId, data)
        message.success('更新成功')
      } else {
        await adminApi.createQuestion(data)
        message.success('创建成功')
      }
      setFormOpen(false)
      loadQuestions()
    } catch {
      message.error('操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const openAiImport = () => {
    setAiStep(0)
    setAiFile(null)
    setAiResult([])
    setAiOpen(true)
  }

  const handleAiUpload = async () => {
    if (!aiFile) return
    setAiLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', aiFile)
      const res = await adminApi.aiParse(formData)
      setAiResult(res.data?.questions || [])
      setAiStep(1)
    } catch {
      message.error('AI 识别失败')
    } finally {
      setAiLoading(false)
    }
  }

  const handleAiImport = async () => {
    setAiLoading(true)
    try {
      await adminApi.aiImport({ questions: aiResult })
      message.success(`成功导入 ${aiResult.length} 道题目`)
      setAiStep(2)
      loadQuestions()
    } catch {
      message.error('导入失败')
    } finally {
      setAiLoading(false)
    }
  }

  const filteredQuestions = questions.filter((q) => {
    if (!searchText) return true
    const lower = searchText.toLowerCase()
    return (
      q.content?.toLowerCase().includes(lower) ||
      q.question_type?.toLowerCase().includes(lower) ||
      q.difficulty?.toLowerCase().includes(lower) ||
      q.tags?.some((t: string) => t.toLowerCase().includes(lower))
    )
  })

  const columns = [
    {
      title: '#',
      width: 50,
      align: 'center' as const,
      render: (_: unknown, __: unknown, index: number) => (
        <span style={{ fontWeight: 600, color: '#8c8c8c' }}>{index + 1}</span>
      ),
    },
    {
      title: '题目内容',
      dataIndex: 'content',
      render: (v: string) => (
        <span style={{ fontSize: 13, lineHeight: 1.6 }}>
          {v?.length > 80 ? v.slice(0, 80) + '...' : v}
        </span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'question_type',
      width: 80,
      align: 'center' as const,
      render: (v: string) => (
        <Tag color={v === 'interview' ? '#1677ff' : '#52c41a'} style={{ borderRadius: 4, margin: 0 }}>
          {v === 'interview' ? '面试' : '笔试'}
        </Tag>
      ),
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      width: 80,
      align: 'center' as const,
      render: (v: string) => {
        const cfg: Record<string, { color: string; bg: string }> = {
          '高阶': { color: '#f5222d', bg: '#fff1f0' },
          '中阶': { color: '#fa8c16', bg: '#fff7e6' },
          '初阶': { color: '#52c41a', bg: '#f6ffed' },
        }
        const c = cfg[v] || { color: '#8c8c8c', bg: '#fafafa' }
        return (
          <span style={{
            display: 'inline-flex', padding: '2px 10px', borderRadius: 4,
            fontSize: 12, fontWeight: 600, color: c.color, background: c.bg,
          }}>
            {v || '未分级'}
          </span>
        )
      },
    },
    {
      title: '操作',
      width: 100,
      align: 'center' as const,
      render: (_: unknown, record: any) => (
        <Space size={4}>
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openForm(record.id)} style={{ color: '#1677ff' }} />
          <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ]

  const aiColumns = [
    {
      title: '#', width: 50, align: 'center' as const,
      render: (_: unknown, __: unknown, i: number) => <span style={{ fontWeight: 600, color: '#8c8c8c' }}>{i + 1}</span>,
    },
    { title: '题目内容', dataIndex: 'content', render: (v: string) => <span style={{ fontSize: 13 }}>{v?.length > 60 ? v.slice(0, 60) + '...' : v}</span> },
    { title: '类型', dataIndex: 'question_type', width: 80, align: 'center' as const, render: (v: string) => <Tag color={v === 'interview' ? '#1677ff' : '#52c41a'}>{v === 'interview' ? '面试' : '笔试'}</Tag> },
    { title: '难度', dataIndex: 'difficulty', width: 80, align: 'center' as const, render: (v: string) => <span style={{ fontSize: 12, fontWeight: 600, color: '#8c8c8c' }}>{v || '未分级'}</span> },
  ]

  return (
    <div>
      <div className="page-header">
        <h1>题目管理</h1>
        <p>管理面试题库，新增、编辑或删除题目。</p>
      </div>
      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Input placeholder="搜索题目内容、标签..." prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: 260 }} allowClear />
            <Select placeholder="题目类型" value={typeFilter} onChange={(v) => { setTypeFilter(v); setTimeout(loadQuestions, 0) }} allowClear style={{ width: 120 }} options={[{ value: 'interview', label: '面试题' }, { value: 'written', label: '笔试题' }]} />
            <Button icon={<ReloadOutlined />} onClick={loadQuestions}>刷新</Button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button icon={<RobotOutlined />} onClick={openAiImport}>AI 批量导入</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>新增题目</Button>
          </div>
        </div>
        <div className="custom-table">
          <Table columns={columns} dataSource={filteredQuestions} rowKey="id" loading={loading} pagination={{ pageSize: 20, showTotal: (total) => `共 ${total} 道题目` }} size="middle" />
        </div>
      </div>

      <Modal
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        footer={null}
        width={720}
        centered
        closable={false}
        styles={{ body: { padding: 0 } }}
        maskStyle={{ background: 'rgba(0,0,0,0.45)' }}
      >
        <div style={{ padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#1f1f1f' }}>{editingId ? '编辑题目' : '新增题目'}</span>
            <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setFormOpen(false)} style={{ color: '#8c8c8c' }} />
          </div>
        </div>
        <div style={{ padding: '0 24px 20px', maxHeight: 'calc(80vh - 80px)', overflowY: 'auto' }}>
          <Form form={form} layout="vertical" onFinish={handleFormSubmit} size="middle">
            <div className="card-title" style={{ marginBottom: 16 }}>基本信息</div>
            <Form.Item name="content" label="题目内容" rules={[{ required: true, message: '请输入题目内容' }]}>
              <Input.TextArea rows={3} placeholder="输入面试/笔试题目内容..." />
            </Form.Item>
            <div style={{ display: 'flex', gap: 16 }}>
              <Form.Item name="question_type" label="题目类型" rules={[{ required: true }]} initialValue="interview" style={{ flex: 1 }}>
                <Select options={[{ value: 'interview', label: '面试题' }, { value: 'written', label: '笔试题' }]} />
              </Form.Item>
              <Form.Item name="difficulty" label="难度等级" style={{ flex: 1 }}>
                <Select allowClear placeholder="选择难度" options={[{ value: '初阶' }, { value: '中阶' }, { value: '高阶' }]} />
              </Form.Item>
            </div>
            <Form.Item name="tags" label="标签（逗号分隔）">
              <Input placeholder="Java, HashMap, 集合框架" />
            </Form.Item>

            <Divider style={{ margin: '16px 0' }} />

            <div className="card-title" style={{ marginBottom: 16 }}>答案信息</div>
            <Form.Item name="oral_answer" label="口语化回答">
              <Input.TextArea rows={2} placeholder="面试时口述版本的回答..." />
            </Form.Item>
            <Form.Item name="ref_answer" label="参考答案">
              <Input.TextArea rows={4} placeholder="详细的参考答案..." />
            </Form.Item>

            <Divider style={{ margin: '16px 0' }} />

            <div className="card-title" style={{ marginBottom: 16 }}>考察公司</div>
            <Form.Item label="公司列表（每行一个，格式：公司名:出现次数）">
              <Input.TextArea rows={3} value={companies} onChange={(e) => setCompanies(e.target.value)} placeholder={"阿里巴巴:2\n字节跳动:1\n美团:1"} />
            </Form.Item>

            <Divider style={{ margin: '16px 0 8px' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingBottom: 4 }}>
              <Button onClick={() => setFormOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting}>
                {editingId ? '保存修改' : '创建题目'}
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      <Modal
        open={aiOpen}
        onCancel={() => setAiOpen(false)}
        footer={null}
        width={800}
        centered
        closable={false}
        styles={{ body: { padding: 0 } }}
        maskStyle={{ background: 'rgba(0,0,0,0.45)' }}
      >
        <div style={{ padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#1f1f1f' }}>
              <RobotOutlined style={{ marginRight: 8, color: '#722ed1' }} />AI 批量导入
            </span>
            <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setAiOpen(false)} style={{ color: '#8c8c8c' }} />
          </div>
          <Steps
            current={aiStep}
            size="small"
            items={[
              { title: '上传文件', icon: <UploadOutlined /> },
              { title: 'AI 识别', icon: <RobotOutlined /> },
              { title: '确认入库', icon: <CheckCircleOutlined /> },
            ]}
          />
        </div>
        <div style={{ padding: '20px 24px', maxHeight: 'calc(80vh - 140px)', overflowY: 'auto' }}>
          <Spin spinning={aiLoading}>
            {aiStep === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <FileTextOutlined style={{ fontSize: 40, color: '#bfbfbf', marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>上传面试题文件</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>支持 PDF、Word、Excel、TXT 格式</div>
                <Upload beforeUpload={(f) => { setAiFile(f); return false }} maxCount={1} accept=".pdf,.docx,.xlsx,.txt" showUploadList={false}>
                  <Button icon={<UploadOutlined />} size="large" style={{ marginRight: 12 }}>选择文件</Button>
                </Upload>
                {aiFile && (
                  <div style={{ marginTop: 12, padding: '8px 14px', borderRadius: 8, background: '#f6ffed', border: '1px solid #b7eb8f', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <FileTextOutlined style={{ color: '#52c41a' }} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{aiFile.name}</span>
                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>({(aiFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
                <div style={{ marginTop: 20 }}>
                  <Button type="primary" size="large" onClick={handleAiUpload} disabled={!aiFile} icon={<RobotOutlined />}>开始 AI 识别</Button>
                </div>
              </div>
            )}

            {aiStep === 1 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div className="section-title" style={{ marginBottom: 0 }}>
                    识别结果 <span className="subtitle">共 {aiResult.length} 道题目</span>
                  </div>
                  <Button size="small" icon={<RedoOutlined />} onClick={() => setAiStep(0)}>重新上传</Button>
                </div>
                <Table columns={aiColumns} dataSource={aiResult} rowKey={(_, i) => String(i)} pagination={false} size="small" style={{ marginBottom: 16 }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Button onClick={() => setAiStep(0)}>重新上传</Button>
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleAiImport}>确认入库 ({aiResult.length} 题)</Button>
                </div>
              </div>
            )}

            {aiStep === 2 && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 12 }} />
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>导入完成</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
                  成功导入 <span style={{ fontWeight: 700, color: '#52c41a' }}>{aiResult.length}</span> 道题目
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                  <Button onClick={() => { setAiStep(0); setAiResult([]); setAiFile(null) }} icon={<UploadOutlined />}>继续导入</Button>
                  <Button type="primary" onClick={() => setAiOpen(false)}>完成</Button>
                </div>
              </div>
            )}
          </Spin>
        </div>
      </Modal>
    </div>
  )
}

export default QuestionList
