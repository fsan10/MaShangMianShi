import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Progress, Button, Tag, Tabs, Modal, List, Empty } from 'antd'
import { ArrowRightOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { localStore } from '@/utils/localStore'
import { statsApi } from '@/api'

const ReviewPage: React.FC = () => {
  const [knowledgePoints, setKnowledgePoints] = useState<any[]>([])
  const [masteries, setMasteries] = useState(localStore.getMasteries())
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    loadKnowledgePoints()
  }, [])

  const loadKnowledgePoints = async () => {
    try {
      const res = await statsApi.knowledgeRanking({ limit: 100 })
      setKnowledgePoints(res.data)
    } catch {
      setKnowledgePoints([])
    }
  }

  const getMastery = (kpId: number) => {
    return masteries.find((m) => m.knowledgePointId === kpId)
  }

  const handleStart = (kpId: number, kpName: string) => {
    const existing = getMastery(kpId)
    if (!existing) {
      localStore.updateMastery(kpId, {
        knowledgePointName: kpName,
        status: 'learning',
        correctCount: 0,
        totalCount: 0,
        lastStudyAt: new Date().toISOString(),
      })
    }
    setMasteries(localStore.getMasteries())
  }

  const totalQuestions = knowledgePoints.reduce((sum, kp) => sum + (kp.question_count || 0), 0)
  const masteredCount = masteries.filter((m) => m.status === 'mastered').length

  const filteredKPs = activeTab === 'all'
    ? knowledgePoints
    : knowledgePoints.filter((kp) => {
        const stacks = kp.tech_stack || []
        const tabMap: Record<string, string> = { ds: '数据结构', os: '操作系统', cn: '计算机网络', co: '组成原理' }
        return stacks.some((s: string) => s.includes(tabMap[activeTab] || ''))
      })

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{totalQuestions}</div>
            <div style={{ color: '#999' }}>总题数</div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{masteredCount}</div>
            <div style={{ color: '#999' }}>已掌握</div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Button type="primary" icon={<ThunderboltOutlined />} block style={{ marginBottom: 8 }}>
              查看薄弱项
            </Button>
            <Button icon={<ArrowRightOutlined />} block>
              开始智能推荐
            </Button>
          </Card>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'all', label: '全部' },
          { key: 'ds', label: '数据结构' },
          { key: 'os', label: '操作系统' },
          { key: 'cn', label: '计算机网络' },
          { key: 'co', label: '组成原理' },
        ]}
      />

      {filteredKPs.length > 0 ? (
        <Row gutter={[16, 16]}>
          {filteredKPs.map((kp: any) => {
            const mastery = getMastery(kp.id || kp.rank)
            const percentage = mastery && mastery.totalCount > 0
              ? Math.round((mastery.correctCount / mastery.totalCount) * 100)
              : 0
            return (
              <Col span={8} key={kp.id || kp.rank}>
                <Card hoverable>
                  <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>{kp.name}</div>
                  <div style={{ marginBottom: 8 }}>
                    {kp.tech_stack?.map((ts: string) => (
                      <Tag key={ts} style={{ marginBottom: 4 }}>{ts}</Tag>
                    ))}
                  </div>
                  <div style={{ color: '#666', marginBottom: 4 }}>
                    {kp.question_count} 真题 · {mastery?.correctCount || 0} 做题
                  </div>
                  <Progress percent={percentage} size="small" />
                  <Button
                    type="primary"
                    block
                    style={{ marginTop: 12 }}
                    onClick={() => handleStart(kp.id || kp.rank, kp.name)}
                  >
                    开始巩固 →
                  </Button>
                </Card>
              </Col>
            )
          })}
        </Row>
      ) : (
        <Empty description="暂无知识点数据" />
      )}
    </div>
  )
}

export default ReviewPage
