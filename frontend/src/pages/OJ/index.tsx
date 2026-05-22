import React, { useEffect, useState } from 'react'
import { Card, Button, Table, Row, Col, Tag, Space, message, Input, Tabs, Empty } from 'antd'
import { PlayCircleOutlined, ReloadOutlined, EyeOutlined, TrophyOutlined, FireOutlined } from '@ant-design/icons'
import { ojApi } from '@/api'

const { TextArea } = Input

const DIFFICULTY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  '简单': { color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  '中等': { color: '#fa8c16', bg: '#fff7e6', border: '#ffd591' },
  '困难': { color: '#f5222d', bg: '#fff1f0', border: '#ffa39e' },
}

const OJPage: React.FC = () => {
  const [problems, setProblems] = useState<any[]>([])
  const [currentProblem, setCurrentProblem] = useState<any>(null)
  const [sqlCode, setSqlCode] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    ojApi.listProblems().then((res) => setProblems(res.data)).catch(() => setProblems([]))
  }, [])

  const handleSelectProblem = async (id: number) => {
    try {
      const res = await ojApi.getProblem(id)
      setCurrentProblem(res.data)
      setSqlCode('')
      setResult(null)
      setError('')
    } catch {
      message.error('加载题目失败')
    }
  }

  const handleExecute = async () => {
    if (!currentProblem || !sqlCode.trim()) return
    try {
      const res = await ojApi.submit(currentProblem.id, sqlCode)
      setResult(res.data)
      setError('')
      message.success('提交成功')
    } catch (err: any) {
      setError(err.response?.data?.detail || '执行失败')
      setResult(null)
    }
  }

  const handleReset = () => {
    setSqlCode('')
    setResult(null)
    setError('')
  }

  const handleViewAnswer = () => {
    if (currentProblem?.reference_solution) {
      setSqlCode(currentProblem.reference_solution)
    }
  }

  const filteredProblems = activeTab === 'all'
    ? problems
    : problems.filter((p) => p.difficulty === activeTab)

  const problemColumns = [
    {
      title: '状态',
      width: 60,
      render: (_: unknown, r: any) => (
        <span style={{ color: '#52c41a', fontSize: 16 }}>
          {r.accept_count > 0 ? '✓' : ''}
        </span>
      ),
    },
    { title: '题目', dataIndex: 'title', key: 'title', render: (t: string) => <span style={{ fontWeight: 500 }}>{t}</span> },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 80,
      render: (d: string) => {
        const cfg = DIFFICULTY_CONFIG[d] || DIFFICULTY_CONFIG['中等']
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 10px',
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 500,
              color: cfg.color,
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
            }}
          >
            {d}
          </span>
        )
      },
    },
    {
      title: '通过率',
      key: 'rate',
      width: 80,
      render: (_: unknown, r: any) => (
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          {r.submit_count > 0 ? `${Math.round((r.accept_count / r.submit_count) * 100)}%` : '-'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, r: any) => (
        <span className="action-btn primary" style={{ padding: '2px 10px', fontSize: 12 }} onClick={() => handleSelectProblem(r.id)}>
          做题
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1><TrophyOutlined style={{ marginRight: 8, color: 'var(--warning)' }} />在线 SQL 练习</h1>
        <p>选择题目，编写 SQL 查询，实时验证结果。支持查看参考答案和提交记录。</p>
      </div>

      <div style={{ padding: '24px 32px' }}>
        <Row gutter={24}>
          <Col span={7}>
            <div className="sidebar-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
                <div className="section-title" style={{ marginBottom: 0 }}>
                  题目列表
                  <span className="subtitle">共 {problems.length} 题</span>
                </div>
              </div>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                size="small"
                style={{ padding: '0 16px' }}
                items={[
                  { key: 'all', label: '全部' },
                  { key: '简单', label: '简单' },
                  { key: '中等', label: '中等' },
                  { key: '困难', label: '困难' },
                ]}
              />
              <Table
                columns={problemColumns}
                dataSource={filteredProblems}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 15, size: 'small' }}
                showHeader={false}
              />
            </div>
          </Col>
          <Col span={17}>
            {currentProblem ? (
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <div className="sidebar-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{currentProblem.title}</h2>
                    {(() => {
                      const cfg = DIFFICULTY_CONFIG[currentProblem.difficulty] || DIFFICULTY_CONFIG['中等']
                      return (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 10px',
                            borderRadius: 100,
                            fontSize: 12,
                            fontWeight: 500,
                            color: cfg.color,
                            background: cfg.bg,
                            border: `1px solid ${cfg.border}`,
                          }}
                        >
                          {currentProblem.difficulty}
                        </span>
                      )
                    })()}
                    <span style={{ color: 'var(--text-muted)', fontSize: 13, marginLeft: 'auto' }}>
                      <FireOutlined style={{ marginRight: 4 }} />
                      提交 {currentProblem.submit_count} 次
                    </span>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: 'var(--text-primary)' }}>题目描述</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8 }}>
                      {currentProblem.description || '暂无描述'}
                    </div>
                  </div>

                  {currentProblem.init_sql && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: 'var(--text-primary)' }}>表结构</div>
                      <pre
                        style={{
                          margin: 0,
                          padding: 16,
                          background: '#f8f9fa',
                          borderRadius: 8,
                          fontSize: 13,
                          fontFamily: 'monospace',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                          overflow: 'auto',
                        }}
                      >
                        {currentProblem.init_sql}
                      </pre>
                    </div>
                  )}

                  {currentProblem.hints?.length > 0 && (
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: 'var(--text-primary)' }}>提示</div>
                      <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', fontSize: 13 }}>
                        {currentProblem.hints.map((h: string, i: number) => (
                          <li key={i} style={{ marginBottom: 4 }}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="sidebar-card">
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: 'var(--text-primary)' }}>SQL 编辑器</div>
                  <TextArea
                    value={sqlCode}
                    onChange={(e) => setSqlCode(e.target.value)}
                    placeholder="输入 SQL 查询..."
                    rows={8}
                    style={{
                      fontFamily: '"Fira Code", "SF Mono", Monaco, monospace',
                      fontSize: 14,
                      borderRadius: 8,
                      background: '#f8f9fa',
                      border: '1px solid var(--border-color)',
                    }}
                  />
                  <Space style={{ marginTop: 16 }}>
                    <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleExecute} size="middle">
                      运行
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={handleReset} size="middle">
                      重置
                    </Button>
                    <Button icon={<EyeOutlined />} onClick={handleViewAnswer} size="middle">
                      查看答案
                    </Button>
                  </Space>
                </div>

                {(result || error) && (
                  <div className="sidebar-card">
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: 'var(--text-primary)' }}>执行结果</div>
                    {error && (
                      <div style={{ color: 'var(--danger)', padding: 12, background: 'var(--danger-light)', borderRadius: 8, fontSize: 13 }}>
                        ❌ {error}
                      </div>
                    )}
                    {result && (
                      <div>
                        <Tag
                          color={result.status === 'accepted' ? 'success' : 'warning'}
                          style={{ fontSize: 13, padding: '2px 12px' }}
                        >
                          {result.status === 'accepted' ? '✅ 通过' : '⚠️ 未通过'}
                        </Tag>
                        {result.execution_time_ms && (
                          <span style={{ marginLeft: 12, color: 'var(--text-muted)', fontSize: 13 }}>
                            耗时 {result.execution_time_ms}ms
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Space>
            ) : (
              <div className="sidebar-card" style={{ textAlign: 'center', padding: 80 }}>
                <TrophyOutlined style={{ fontSize: 48, color: 'var(--border-color)', marginBottom: 16 }} />
                <div style={{ color: 'var(--text-muted)', fontSize: 16 }}>请从左侧选择一道题目开始练习</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>支持在线编写 SQL 并实时验证</div>
              </div>
            )}
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default OJPage
