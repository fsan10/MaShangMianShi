import React, { useState } from 'react'
import { Card, Upload, Button, Steps, Table, Tag, Space, message, Select, Row, Col, Tabs } from 'antd'
import { InboxOutlined, RobotOutlined, CheckCircleOutlined, SaveOutlined } from '@ant-design/icons'
import { aiApi, questionApi } from '@/api'

const { Dragger } = Upload

const AIRecognize: React.FC = () => {
  const [activeTab, setActiveTab] = useState('interview')
  const [step, setStep] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [recognizing, setRecognizing] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined)

  React.useEffect(() => {
    questionApi.categories().then((res) => setCategories(res.data || [])).catch(() => {})
  }, [])

  const handleUpload = async (f: File) => {
    setFile(f)
    setStep(1)
    setRecognizing(true)
    setResults([])

    try {
      let res
      if (activeTab === 'interview') {
        res = await aiApi.recognizeInterview(f, selectedCategory)
      } else if (activeTab === 'written') {
        res = await aiApi.recognizeWritten(f, selectedCategory)
      } else {
        res = await aiApi.recognizeProject(f)
      }
      setResults(res.data.items || [])
      setStep(2)
      message.success(`识别到 ${res.data.count} 条内容`)
    } catch (e: any) {
      message.error('识别失败: ' + (e.response?.data?.detail || e.message || '未知错误'))
      setStep(0)
    } finally {
      setRecognizing(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (activeTab === 'project') {
        const { projectApi } = await import('@/api')
        for (const item of results) {
          await projectApi.create(item)
        }
        message.success(`成功入库 ${results.length} 个项目`)
      } else {
        await aiApi.saveImport(results)
        message.success(`成功入库 ${results.length} 条题目`)
      }
      setStep(3)
    } catch {
      message.error('入库失败')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setStep(0)
    setFile(null)
    setResults([])
  }

  const questionColumns = [
    { title: '题目内容', dataIndex: 'content', width: 300, render: (t: string) => <span style={{ fontSize: 13 }}>{t}</span> },
    {
      title: '题型',
      dataIndex: 'question_type',
      width: 80,
      render: (t: string) => <span className={`subject-tag ${t === 'interview' ? 'ds' : 'cn'}`}>{t === 'interview' ? '面试' : '笔试'}</span>,
    },
    { title: '难度', dataIndex: 'difficulty', width: 70, render: (d: string) => d || '-' },
    { title: '来源', dataIndex: 'source', width: 100, render: (s: string) => s || '-' },
    {
      title: '标签',
      dataIndex: 'tags',
      width: 150,
      render: (tags: string[]) => (
        <Space size={4} wrap>{tags?.map((t) => <Tag key={t} style={{ fontSize: 11, margin: 0 }}>{t}</Tag>)}</Space>
      ),
    },
  ]

  const projectColumns = [
    { title: '项目名称', dataIndex: 'name', width: 200, render: (t: string) => <span style={{ fontWeight: 600 }}>{t}</span> },
    { title: '描述', dataIndex: 'description', width: 250, render: (t: string) => <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t || '-'}</span> },
    {
      title: '技术栈',
      dataIndex: 'tech_stack',
      width: 200,
      render: (stacks: string[]) => (
        <Space size={4} wrap>{stacks?.map((s) => <Tag key={s} color="blue" style={{ fontSize: 11, margin: 0 }}>{s}</Tag>)}</Space>
      ),
    },
    { title: '职责', dataIndex: 'duties', width: 200, render: (t: string) => <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t || '-'}</span> },
  ]

  const tabItems = [
    { key: 'interview', label: 'AI 识别面试题' },
    { key: 'written', label: 'AI 识别笔试题' },
    { key: 'project', label: 'AI 识别项目' },
  ]

  return (
    <div>
      <div className="page-header">
        <h1><RobotOutlined style={{ marginRight: 8, color: 'var(--primary)' }} />AI 智能识别</h1>
        <p>上传文件，AI 自动识别面试题、笔试题或项目经历，一键批量入库</p>
      </div>

      <div style={{ padding: '24px 32px' }}>
        <Tabs activeKey={activeTab} onChange={(k) => { setActiveTab(k); handleReset() }} items={tabItems} />

        <div className="sidebar-card" style={{ marginBottom: 24 }}>
          <Steps
            current={step}
            style={{ marginBottom: 24 }}
            items={[
              { title: '上传文件' },
              { title: 'AI 识别中', description: recognizing ? '处理中...' : '' },
              { title: '确认结果' },
              { title: '入库完成' },
            ]}
          />

          {step === 0 && (
            <div>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginRight: 8 }}>分类：</span>
                  <Select
                    placeholder="选择分类（可选）"
                    allowClear
                    style={{ width: 200 }}
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    options={categories.map((c) => ({ label: c.name, value: c.id }))}
                  />
                </Col>
              </Row>
              <Dragger
                beforeUpload={(f) => { handleUpload(f); return false }}
                showUploadList={false}
                accept=".pdf,.docx,.doc,.xlsx,.xls,.txt,.md"
                height={200}
              >
                <p className="ant-upload-drag-icon"><InboxOutlined style={{ fontSize: 48, color: 'var(--primary)' }} /></p>
                <p style={{ fontSize: 16, fontWeight: 500 }}>点击或拖拽文件到此处上传</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>支持 PDF、Word、Excel、TXT、Markdown 格式</p>
              </Dragger>
            </div>
          )}

          {step === 1 && (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <RobotOutlined spin style={{ fontSize: 48, color: 'var(--primary)', marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 500 }}>AI 正在识别中...</div>
              <div style={{ color: 'var(--text-muted)', marginTop: 8 }}>文件：{file?.name}</div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>
                  识别结果（{results.length} 条）
                </span>
                <Space>
                  <Button onClick={handleReset}>重新上传</Button>
                  <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
                    确认入库
                  </Button>
                </Space>
              </div>
              <div className="custom-table">
                <Table
                  columns={activeTab === 'project' ? projectColumns : questionColumns}
                  dataSource={results}
                  rowKey={(_, i) => String(i)}
                  pagination={false}
                  size="middle"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <CheckCircleOutlined style={{ fontSize: 48, color: 'var(--success)', marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 500 }}>入库完成！</div>
              <div style={{ color: 'var(--text-muted)', marginTop: 8 }}>共入库 {results.length} 条</div>
              <Button type="primary" style={{ marginTop: 16 }} onClick={handleReset}>继续上传</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIRecognize
