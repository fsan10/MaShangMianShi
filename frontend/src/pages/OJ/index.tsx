import React, { useEffect, useState, useRef } from 'react'
import { Card, Button, Table, Row, Col, Tag, Space, message, Input, Tabs } from 'antd'
import { PlayCircleOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import { ojApi } from '@/api'

const { TextArea } = Input

const OJPage: React.FC = () => {
  const [problems, setProblems] = useState<any[]>([])
  const [currentProblem, setCurrentProblem] = useState<any>(null)
  const [sqlCode, setSqlCode] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const dbRef = useRef<any>(null)

  useEffect(() => {
    ojApi.listProblems().then((res) => setProblems(res.data))
  }, [])

  const handleSelectProblem = async (id: number) => {
    const res = await ojApi.getProblem(id)
    setCurrentProblem(res.data)
    setSqlCode('')
    setResult(null)
    setError('')
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

  const problemColumns = [
    { title: '题目', dataIndex: 'title', key: 'title' },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (d: string) => {
        const color = d === '简单' ? 'green' : d === '中等' ? 'orange' : 'red'
        return <Tag color={color}>{d}</Tag>
      },
    },
    {
      title: '通过率',
      key: 'rate',
      render: (_: unknown, r: any) =>
        r.submit_count > 0 ? `${Math.round((r.accept_count / r.submit_count) * 100)}%` : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, r: any) => (
        <Button size="small" type="link" onClick={() => handleSelectProblem(r.id)}>
          做题
        </Button>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={16}>
        <Col span={8}>
          <Card title="题目列表" style={{ height: 'calc(100vh - 112px)', overflow: 'auto' }}>
            <Table
              columns={problemColumns}
              dataSource={problems}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 20 }}
            />
          </Card>
        </Col>
        <Col span={16}>
          {currentProblem ? (
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <Card title={currentProblem.title}>
                <Space>
                  <Tag color={currentProblem.difficulty === '简单' ? 'green' : currentProblem.difficulty === '中等' ? 'orange' : 'red'}>
                    {currentProblem.difficulty}
                  </Tag>
                  <span>提交 {currentProblem.submit_count} 次</span>
                </Space>
                <div style={{ marginTop: 12 }}>
                  <strong>题目描述：</strong>
                  <p>{currentProblem.description}</p>
                </div>
                {currentProblem.init_sql && (
                  <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                    <strong>表结构：</strong>
                    <pre style={{ margin: 0, fontSize: 12 }}>{currentProblem.init_sql}</pre>
                  </div>
                )}
                {currentProblem.hints?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <strong>提示：</strong>
                    <ul>
                      {currentProblem.hints.map((h: string, i: number) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>

              <Card title="SQL 编辑器">
                <TextArea
                  value={sqlCode}
                  onChange={(e) => setSqlCode(e.target.value)}
                  placeholder="输入 SQL 查询..."
                  rows={8}
                  style={{ fontFamily: 'monospace', fontSize: 14 }}
                />
                <Space style={{ marginTop: 12 }}>
                  <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleExecute}>
                    运行
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleReset}>
                    重置
                  </Button>
                  <Button icon={<EyeOutlined />} onClick={handleViewAnswer}>
                    查看答案
                  </Button>
                </Space>
              </Card>

              {(result || error) && (
                <Card title="执行结果">
                  {error && <div style={{ color: '#f5222d' }}>❌ {error}</div>}
                  {result && (
                    <div>
                      <Tag color={result.status === 'accepted' ? 'green' : 'orange'}>
                        {result.status === 'accepted' ? '✅ 通过' : '⚠️ 未通过'}
                      </Tag>
                      {result.execution_time_ms && <span>耗时 {result.execution_time_ms}ms</span>}
                    </div>
                  )}
                </Card>
              )}
            </Space>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
                请从左侧选择一道题目开始练习
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  )
}

export default OJPage
