import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Button, Tag, Progress, Empty, Spin, message } from 'antd'
import { ThunderboltOutlined, CheckCircleOutlined, CloseCircleOutlined, CalendarOutlined, BellOutlined, LoginOutlined } from '@ant-design/icons'
import { studyApi, questionApi } from '@/api'
import { useAuth } from '@/contexts/AuthContext'

const Study: React.FC = () => {
  const { user, loading: authLoading } = useAuth()
  const [progress, setProgress] = useState<any>(null)
  const [reviewList, setReviewList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<Record<number, any>>({})

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }
    loadData()
  }, [user, authLoading])

  const loadData = async () => {
    setLoading(true)
    try {
      const [progressRes, reviewRes] = await Promise.all([
        studyApi.getProgress().catch(() => ({ data: { total_studied: 0, mastered: 0, learning: 0, today_review: 0, streak: 0 } })),
        studyApi.getReviewList().catch(() => ({ data: [] })),
      ])
      setProgress(progressRes.data)
      setReviewList(reviewRes.data || [])

      const qIds = (reviewRes.data || []).map((r: any) => r.question_id)
      if (qIds.length > 0) {
        const qMap: Record<number, any> = {}
        for (const qId of qIds) {
          try {
            const res = await questionApi.get(qId)
            qMap[qId] = res.data
          } catch {}
        }
        setQuestions(qMap)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (recordId: number, correct: boolean) => {
    try {
      await studyApi.submitReview(recordId, { correct })
      message.success(correct ? '回答正确，进入下一阶段！' : '回答错误，已重置复习计划')
      loadData()
    } catch {
      message.error('操作失败')
    }
  }

  const masteredPercent = progress?.total_studied > 0
    ? Math.round((progress.mastered / progress.total_studied) * 100)
    : 0

  return (
    <div>
      <div className="page-header">
        <h1><ThunderboltOutlined style={{ marginRight: 8, color: 'var(--warning)' }} />学习巩固</h1>
        <p>基于艾宾浩斯遗忘曲线，智能安排复习计划，精准提升掌握度。</p>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {!user && !authLoading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <LoginOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
            <div style={{ fontSize: 16, color: '#8c8c8c', marginBottom: 8 }}>请先登录查看学习进度</div>
            <div style={{ fontSize: 13, color: '#bfbfbf' }}>点击右上角头像进行登录</div>
          </div>
        ) : (
        <>
        {/* 统计卡片 - 参考图1样式 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <div className="study-stat-card blue">
              <div className="stat-value">{progress?.total_studied || 0}</div>
              <div className="stat-label">已学习</div>
            </div>
          </Col>
          <Col span={6}>
            <div className="study-stat-card green">
              <div className="stat-value">{progress?.mastered || 0}</div>
              <div className="stat-label">已掌握</div>
            </div>
          </Col>
          <Col span={6}>
            <div className="study-stat-card orange">
              <div className="stat-value">{progress?.today_review || 0}</div>
              <div className="stat-label">今日待复习</div>
            </div>
          </Col>
          <Col span={6}>
            <div className="study-stat-card red">
              <div className="stat-value">{progress?.streak || 0}</div>
              <div className="stat-label">连续打卡</div>
            </div>
          </Col>
        </Row>

        {/* 今日待复习提示条 */}
        <div className="review-alert-bar">
          <div className="alert-icon">
            <BellOutlined />
          </div>
          <div className="alert-text">
            今日待复习<span className="alert-count">{reviewList.length}</span> 道题目等待复习
          </div>
        </div>

        <div className="sidebar-card" style={{ marginBottom: 24 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>掌握进度</div>
          <Progress
            percent={masteredPercent}
            strokeColor={{ from: '#1677ff', to: '#52c41a' }}
            format={() => `${progress?.mastered || 0}/${progress?.total_studied || 0}`}
          />
        </div>

        <div className="sidebar-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <div className="section-title" style={{ marginBottom: 0 }}>
              今日待复习
              <span className="subtitle">{reviewList.length} 道题目等待复习</span>
            </div>
          </div>

          <Spin spinning={loading}>
            {reviewList.length > 0 ? (
              <div style={{ padding: 16 }}>
                {reviewList.map((record: any) => {
                  const q = questions[record.question_id]
                  return (
                    <div key={record.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Tag color={record.stage >= 4 ? 'green' : record.stage >= 2 ? 'orange' : 'red'}>
                          阶段 {record.stage + 1}/5
                        </Tag>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          已复习 {record.review_count} 次
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 8 }}>
                        {q?.content?.length > 80 ? q.content.slice(0, 80) + '...' : (q?.content || `题目 #${record.question_id}`)}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                          size="small"
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          onClick={() => handleReview(record.id, true)}
                        >
                          回答正确
                        </Button>
                        <Button
                          size="small"
                          danger
                          icon={<CloseCircleOutlined />}
                          onClick={() => handleReview(record.id, false)}
                        >
                          回答错误
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <CalendarOutlined style={{ fontSize: 48, color: 'var(--border-color)', marginBottom: 16 }} />
                <div style={{ color: 'var(--text-muted)', fontSize: 16 }}>
                  {loading ? '加载中...' : '今日没有待复习题目，去首页学习新题吧！'}
                </div>
              </div>
            )}
          </Spin>
        </div>
        </>
        )}
      </div>
    </div>
  )
}

export default Study
