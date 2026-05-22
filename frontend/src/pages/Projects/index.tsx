import React, { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Form, Input, Tag, Space, Row, Col, message, Popconfirm, Select } from 'antd'
import { PlusOutlined, DeleteOutlined, LinkOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { projectApi, questionApi } from '@/api'

const { TextArea } = Input

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [projectQuestions, setProjectQuestions] = useState<any[]>([])
  const [questionModalOpen, setQuestionModalOpen] = useState(false)
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [allQuestions, setAllQuestions] = useState<any[]>([])
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([])
  const [form] = Form.useForm()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const res = await projectApi.list()
      setProjects(res.data)
    } catch {
      setProjects([])
    } finally {
      setLoading(false)
    }
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
      tech_stack: record.tech_stack?.join(', '),
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    const payload = {
      ...values,
      tech_stack: values.tech_stack ? values.tech_stack.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    }

    try {
      if (editItem) {
        await projectApi.update(editItem.id, payload)
        message.success('更新成功')
      } else {
        await projectApi.create(payload)
        message.success('创建成功')
      }
      setModalOpen(false)
      loadProjects()
    } catch {
      message.error('操作失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await projectApi.delete(id)
      message.success('删除成功')
      loadProjects()
    } catch {
      message.error('删除失败')
    }
  }

  const handleViewQuestions = async (projectId: number) => {
    setCurrentProjectId(projectId)
    try {
      const res = await projectApi.getQuestions(projectId)
      setProjectQuestions(res.data)
      setQuestionModalOpen(true)
    } catch {
      message.error('加载失败')
    }
  }

  const handleAutoMatch = async (projectId: number) => {
    try {
      const res = await projectApi.autoMatch(projectId)
      message.success(res.data.message || '匹配完成')
      loadProjects()
    } catch {
      message.error('匹配失败')
    }
  }

  const handleOpenLinkModal = async (projectId: number) => {
    setCurrentProjectId(projectId)
    setSelectedQuestionIds([])
    try {
      const res = await questionApi.list({ limit: 100 })
      setAllQuestions(res.data.items || [])
      setLinkModalOpen(true)
    } catch {
      message.error('加载题目失败')
    }
  }

  const handleLinkQuestions = async () => {
    if (!currentProjectId || selectedQuestionIds.length === 0) return
    try {
      await projectApi.linkQuestions(currentProjectId, selectedQuestionIds)
      message.success('关联成功')
      setLinkModalOpen(false)
    } catch {
      message.error('关联失败')
    }
  }

  const handleUnlinkQuestion = async (questionId: number) => {
    if (!currentProjectId) return
    try {
      await projectApi.unlinkQuestion(currentProjectId, questionId)
      message.success('取消关联成功')
      const res = await projectApi.getQuestions(currentProjectId)
      setProjectQuestions(res.data)
    } catch {
      message.error('操作失败')
    }
  }

  const columns = [
    { title: '项目名称', dataIndex: 'name', width: 200, render: (t: string) => <span style={{ fontWeight: 600 }}>{t}</span> },
    { title: '描述', dataIndex: 'description', width: 250, render: (t: string) => <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t || '-'}</span> },
    {
      title: '技术栈',
      dataIndex: 'tech_stack',
      width: 200,
      render: (stacks: string[]) => (
        <Space size={4} wrap>{stacks?.map((s) => <Tag key={s} color="blue" style={{ fontSize: 11, margin: 0 }}>{s}</Tag>)}</Space>
      ),
    },
    { title: '职责', dataIndex: 'duties', width: 200, render: (t: string) => <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t || '-'}</span> },
    {
      title: '操作',
      width: 220,
      render: (_: unknown, record: any) => (
        <Space size={4}>
          <Button size="small" type="link" icon={<LinkOutlined />} onClick={() => handleViewQuestions(record.id)}>
            关联题目
          </Button>
          <Button size="small" type="link" icon={<ThunderboltOutlined />} onClick={() => handleAutoMatch(record.id)}>
            自动匹配
          </Button>
          <Button size="small" type="text" onClick={() => handleEdit(record)}>编辑</Button>
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
        <h1><LinkOutlined style={{ marginRight: 8, color: 'var(--primary)' }} />项目关联</h1>
        <p>管理项目经历，根据技术栈自动匹配相关面试/笔试问题</p>
      </div>

      <div style={{ padding: '24px 32px' }}>
        <div className="sidebar-card" style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle">
            <span style={{ fontWeight: 600 }}>共 {projects.length} 个项目</span>
            <Space>
              <Button icon={<LinkOutlined />} onClick={() => handleOpenLinkModal(0)}>
                手动关联
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                新增项目
              </Button>
            </Space>
          </Row>
        </div>

        <div className="custom-table">
          <Table columns={columns} dataSource={projects} rowKey="id" loading={loading} size="middle" />
        </div>
      </div>

      <Modal title={editItem ? '编辑项目' : '新增项目'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} width={640}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="项目名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="tech_stack" label="技术栈（逗号分隔）">
            <Input placeholder="MySQL, Redis, Spring Boot" />
          </Form.Item>
          <Form.Item name="duties" label="项目职责">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="关联的面试/笔试题目"
        open={questionModalOpen}
        onCancel={() => setQuestionModalOpen(false)}
        footer={[
          <Button key="link" type="primary" onClick={() => { setQuestionModalOpen(false); currentProjectId && handleOpenLinkModal(currentProjectId) }}>
            添加关联
          </Button>,
          <Button key="close" onClick={() => setQuestionModalOpen(false)}>关闭</Button>,
        ]}
        width={800}
      >
        {projectQuestions.length > 0 ? (
          <Table
            dataSource={projectQuestions}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { title: '题目', dataIndex: 'content', width: 400 },
              {
                title: '题型',
                dataIndex: 'question_type',
                width: 80,
                render: (t: string) => <span className={`subject-tag ${t === 'interview' ? 'ds' : 'cn'}`}>{t === 'interview' ? '面试' : '笔试'}</span>,
              },
              {
                title: '操作',
                width: 80,
                render: (_: unknown, r: any) => (
                  <Button size="small" type="text" danger onClick={() => handleUnlinkQuestion(r.id)}>取消关联</Button>
                ),
              },
            ]}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>暂无关联题目，点击"自动匹配"或"添加关联"</div>
        )}
      </Modal>

      <Modal
        title="选择题目关联"
        open={linkModalOpen}
        onOk={handleLinkQuestions}
        onCancel={() => setLinkModalOpen(false)}
        width={800}
      >
        <Select
          mode="multiple"
          placeholder="搜索并选择题目"
          style={{ width: '100%', marginBottom: 16 }}
          value={selectedQuestionIds}
          onChange={setSelectedQuestionIds}
          options={allQuestions.map((q) => ({
            label: `${q.content?.substring(0, 60)}${q.content?.length > 60 ? '...' : ''}`,
            value: q.id,
          }))}
          filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
          maxTagCount={5}
        />
      </Modal>
    </div>
  )
}

export default Projects
