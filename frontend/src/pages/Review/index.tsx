import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Progress, Button, Tag, Tabs, Empty } from 'antd'
import { ArrowRightOutlined, ThunderboltOutlined, BookOutlined } from '@ant-design/icons'
import { localStore } from '@/utils/localStore'
import { statsApi } from '@/api'

const SUBJECT_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  '数据结构': { color: '#1677ff', bg: '#e6f4ff', border: '#bae0ff' },
  '操作系统': { color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  '计算机网络': { color: '#fa8c16', bg: '#fff7e6', border: '#ffd591' },
  '组成原理': { color: '#722ed1', bg: '#f9f0ff', border: '#d3adf7' },
}

const ReviewPage: React.FC = () => {
  const [knowledgePoints, setKnowledgePoints] = useState<any[]>([])
  const [masteries, setMasteries] = useState(localStore.getMasteries())
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    statsApi.knowledgeRanking({ limit: 100 }).then((res) => {
      setKnowledgePoints(res.data)
    }).catch(() => {
      setKnowledgePoints([])
    }).finally(() => setLoading(false))
  }, [])

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
    <div>
      <div className="page-header">
        <h1><ThunderboltOutlined style={{ marginRight: 8, color: 'var(--warning)' }} />巩固功能</h1>
        <p>针对薄弱知识点进行专项巩固练习。智能推荐，精准提升。</p>
      </div>

      <div style={{ padding: '24px 32px' }}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <div className="stat-card blue">
              <div className="stat-value">{totalQuestions}</div>
              <div className="stat-label">总题数</div>
              <div className="stat-desc">涵盖所有知识点</div>
            </div>
          </Col>
          <Col span={8}>
            <div className="stat-card green">
              <div className="stat-value">{masteredCount}</div>
              <div className="stat-label">已掌握</div>
              <div className="stat-desc">个知识点</div>
            </div>
          </Col>
          <Col span={8}>
            <div className="stat-card orange">
              <div className="stat-value">{masteries.filter((m) => m.status === 'learning').length}</div>
              <div className="stat-label">学习中</div>
              <div className="stat-desc">继续巩固</div>
            </div>
          </Col>
        </Row>

        <div className="sidebar-card" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <div className="section-title" style={{ marginBottom: 0 }}>
              知识点巩固
              <span className="subtitle">选择知识点开始专项练习</span>
            </div>
          </div>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="middle"
            style={{ padding: '0 20px' }}
            items={[
              { key: 'all', label: '全部' },
              { key: 'ds', label: '数据结构' },
              { key: 'os', label: '操作系统' },
              { key: 'cn', label: '计算机网络' },
              { key: 'co', label: '组成原理' },
            ]}
          />
        </div>

        {filteredKPs.length > 0 ? (
          <Row gutter={[16, 16]}>
            {filteredKPs.map((kp: any) => {
              const mastery = getMastery(kp.id || kp.rank)
              const percentage = mastery && mastery.totalCount > 0
                ? Math.round((mastery.correctCount / mastery.totalCount) * 100)
                : 0
              const subject = kp.tech_stack?.[0] || '其他'
              const colorCfg = SUBJECT_COLORS[subject] || SUBJECT_COLORS['数据结构']

              return (
                <Col span={8} key={kp.id || kp.rank}>
                  <div className="sidebar-card" style={{ transition: 'all 0.3s', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '2px 10px',
                          borderRadius: 100,
                          fontSize: 12,
                          fontWeight: 500,
                          color: colorCfg.color,
                          background: colorCfg.bg,
                          border: `1px solid ${colorCfg.border}`,
                        }}
                      >
                        {subject}
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
                        {kp.question_count} 真题
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: 'var(--text-primary)' }}>
                      {kp.name}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {mastery?.correctCount || 0} / {mastery?.totalCount || 0} 正确
                        </span>
                        <span style={{ color: percentage >= 80 ? 'var(--success)' : percentage >= 50 ? 'var(--warning)' : 'var(--danger)', fontWeight: 600 }}>
                          {percentage}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${percentage}%`,
                            background: percentage >= 80
                              ? 'linear-gradient(90deg, #52c41a, #95de64)'
                              : percentage >= 50
                                ? 'linear-gradient(90deg, #fa8c16, #ffc53d)'
                                : 'linear-gradient(90deg, #f5222d, #ff7875)',
                          }}
                        />
                      </div>
                    </div>
                    <Button
                      type="primary"
                      block
                      icon={<ArrowRightOutlined />}
                      onClick={() => handleStart(kp.id || kp.rank, kp.name)}
                    >
                      开始巩固
                    </Button>
                  </div>
                </Col>
              )
            })}
          </Row>
        ) : (
          <div className="sidebar-card" style={{ textAlign: 'center', padding: 80 }}>
            <BookOutlined style={{ fontSize: 48, color: 'var(--border-color)', marginBottom: 16 }} />
            <div style={{ color: 'var(--text-muted)', fontSize: 16 }}>暂无知识点数据</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReviewPage
