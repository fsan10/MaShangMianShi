import React, { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, Tag, Space, Row, Col, message, Popconfirm, Upload } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, SearchOutlined } from '@ant-design/icons'
import { questionApi } from '@/api'

const { TextArea } = Input

const QuestionManage: React.FC = () => {
  const [data, setData] = useState<{ total: number; items: any[] }>({ total: 0, items: [] })
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [sources, setSources] = useState<string[]>([])
  const [difficulties, setDifficulties] = useState<string[]>([])
  const [filters, setFilters] = useState<Record<string, unknown>>({})
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
    loadFilters()
  }, [])

  const loadData = async (params?: Record<string, unknown>) => {
    setLoading(true)
    try {
      const res = await questionApi.list({ ...filters, ...params, skip: 0, limit: 50 })
      setData(res.data)
    } catch {
      setData({ total: 0, items: [] })
    } finally {
      setLoading(false)
    }
  }

  const loadFilters = async () => {
    try {
      const [catRes, srcRes, diffRes] = await Promise.all([
        questionApi.categories(),
        questionApi.sources(),
        questionApi.difficulties(),
      ])
      setCategories(catRes.data || [])
      setSources(srcRes.data || [])
      setDifficulties(diffRes.data || [])
    } catch {}
  }

  const handleCreate = () => {
    setEditItem(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleEdit = (record: any) => {
    setEditItem(record)
    form.setFieldsValue({
      ...record,
      tags: record.tags?.join(', '),
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    const payload = {
      ...values,
      tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    }

    try {
      if (editItem) {
        await questionApi.update(editItem.id, payload)
        message.success('更新成功')
      } else {
        await questionApi.create(payload)
        message.success('创建成功')
      }
      setModalOpen(false)
      loadData()
    } catch {
      message.error('操作失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await questionApi.delete(id)
      message.success('删除成功')
      loadData()
    } catch {
      message.error('删除失败')
    }
  }

  const handleFilterChange = (key: string, value: unknown) => {
    const newFilters = { ...filters, [key]: value || undefined }
    setFilters(newFilters)
    loadData(newFilters)
  }

  const handleBatchImport = async (file: File) => {
    try {
      const text = await file.text()
      const questions = JSON.parse(text)
      if (!Array.isArray(questions)) {
        message.error('文件格式错误，需要JSON数组')
        return
      }
      await questionApi.batchImport(questions)
      message.success(`成功导入 ${questions.length} 条`)
      loadData()
    } catch (e: any) {
      message.error('导入失败: ' + (e.message || '格式错误'))
    }
    return false
  }

  const columns = [
    {
      title: '题目内容',
      dataIndex: 'content',
      width: 300,
      render: (text: string) => (
        <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {text}
        </div>
      ),
    },
    {
      title: '题型',
      dataIndex: 'question_type',
      width: 80,
      render: (type: string) => (
        <span className={`subject-tag ${type === 'interview' ? 'ds' : 'cn'}`}>
          {type === 'interview' ? '面试题' : '笔试题'}
        </span>
      ),
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      width: 70,
      render: (d: string) => {
        const color = d === '高阶' ? '#f5222d' : d === '中阶' ? '#fa8c16' : '#52c41a'
        return <span style={{ color, fontWeight: 600, fontSize: 12 }}>{d || '-'}</span>
      },
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 100,
      render: (s: string) => <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{s || '-'}</span>,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      width: 150,
      render: (tags: string[]) => (
        <Space size={4} wrap>
          {tags?.map((t) => (
            <Tag key={t} style={{ fontSize: 11, margin: 0 }}>{t}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '操作',
      width: 120,
      render: (_: unknown, record: any) => (
        <Space>
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1>问题管理</h1>
        <p>面试题、笔试题的增删改查和批量导入</p>
      </div>

      <div style={{ padding: '24px 32px' }}>
        <div className="sidebar-card" style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col>
              <Select
                placeholder="题型"
                allowClear
                style={{ width: 120 }}
                onChange={(v) => handleFilterChange('question_type', v)}
                options={[
                  { label: '面试题', value: 'interview' },
                  { label: '笔试题', value: 'written' },
                ]}
              />
            </Col>
            <Col>
              <Select
                placeholder="难度"
                allowClear
                style={{ width: 120 }}
                onChange={(v) => handleFilterChange('difficulty', v)}
                options={difficulties.map((d) => ({ label: d, value: d }))}
              />
            </Col>
            <Col>
              <Select
                placeholder="来源"
                allowClear
                style={{ width: 120 }}
                onChange={(v) => handleFilterChange('source', v)}
                options={sources.map((s) => ({ label: s, value: s }))}
              />
            </Col>
            <Col>
              <Input
                placeholder="关键词搜索"
                allowClear
                style={{ width: 200 }}
                prefix={<SearchOutlined />}
                onPressEnter={(e) => handleFilterChange('keyword', (e.target as HTMLInputElement).value)}
              />
            </Col>
            <Col style={{ marginLeft: 'auto' }}>
              <Space>
                <Upload beforeUpload={handleBatchImport} showUploadList={false} accept=".json">
                  <Button icon={<UploadOutlined />}>批量导入</Button>
                </Upload>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  新增题目
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <div className="custom-table">
          <Table
            columns={columns}
            dataSource={data.items}
            rowKey="id"
            loading={loading}
            pagination={{
              total: data.total,
              pageSize: 50,
              showTotal: (t) => `共 ${t} 条`,
            }}
            size="middle"
          />
        </div>
      </div>

      <Modal
        title={editItem ? '编辑题目' : '新增题目'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="content" label="题目内容" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="question_type" label="题型" initialValue="interview">
                <Select options={[{ label: '面试题', value: 'interview' }, { label: '笔试题', value: 'written' }]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="difficulty" label="难度">
                <Select allowClear options={[{ label: '初阶', value: '初阶' }, { label: '中阶', value: '中阶' }, { label: '高阶', value: '高阶' }]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="source" label="来源">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="oral_answer" label="口述答案">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="ref_answer" label="参考答案">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="tags" label="标签（逗号分隔）">
            <Input placeholder="MySQL, 数据结构, 408" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default QuestionManage
