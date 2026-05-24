import React, { useEffect, useState } from 'react'
import { Tag, Button, Divider, Spin, Empty, message } from 'antd'
import { ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { questionApi, studyApi } from '@/api'

const DIFFICULTY_MAP: Record<string, { color: string; bg: string }> = {
  '高阶': { color: '#f5222d', bg: '#fff1f0' },
  '中阶': { color: '#fa8c16', bg: '#fff7e6' },
  '初阶': { color: '#52c41a', bg: '#f6ffed' },
}

const EBBINGHAUS_LABELS = ['第1次复习(1天后)', '第2次复习(3天后)', '第3次复习(7天后)', '第4次复习(15天后)', '已掌握']

const QuestionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [question, setQuestion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [studyRecord, setStudyRecord] = useState<any>(null)
  const [showAnswer, setShowAnswer] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    questionApi.get(Number(id)).then((res) => {
      setQuestion(res.data)
    }).catch(() => {
      setQuestion(null)
    }).finally(() => setLoading(false))

    studyApi.getRecords().then((res) => {
      const record = (res.data || []).find((r: any) => r.question_id === Number(id))
      setStudyRecord(record || null)
    }).catch(() => {})
  }, [id])

  const handleStartStudy = async () => {
    try {
      await studyApi.createRecord({ question_id: Number(id) })
      message.success('已加入学习计划')
      const res = await studyApi.getRecords()
      const record = (res.data || []).find((r: any) => r.question_id === Number(id))
      setStudyRecord(record || null)
    } catch {
      message.error('请先登录')
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
  if (!question) return <div className="sidebar-card" style={{ textAlign: 'center', padding: 80 }}><Empty description="题目不存在" /></div>

  const diff = DIFFICULTY_MAP[question.difficulty] || { color: '#8c8c8c', bg: '#fafafa' }
  const companyCount = question.companies?.length || 0

  return (
    <div>
      <div className="page-header">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 8 }}>
          返回
        </Button>
        <h1>题目详情</h1>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 900, margin: '0 auto' }}>
        <div className="sidebar-card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Tag style={{ color: diff.color, background: diff.bg, border: `1px solid ${diff.color}33`, fontWeight: 600 }}>
              {question.difficulty || '未分级'}
            </Tag>
            <Tag style={{ fontWeight: 600, color: 'var(--primary)' }}>
              {question.question_type === 'interview' ? '面试题' : '笔试题'}
            </Tag>
            <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)' }}>
              🔥 {companyCount}家公司考察
            </span>
          </div>

          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {question.content}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
            {(question.tags || []).map((tag: string, i: number) => (
              <Tag key={i} style={{ borderRadius: 100 }}>{tag}</Tag>
            ))}
          </div>
        </div>

        {question.companies?.length > 0 && (
          <div className="sidebar-card" style={{ marginBottom: 24 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>考察公司</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {question.companies.map((c: any, i: number) => (
                <Tag key={i} style={{ fontSize: 13, padding: '4px 12px', borderRadius: 100, color: 'var(--primary)', background: 'var(--bg-secondary)', border: '1px solid var(--primary)' }}>
                  {c.name}{c.count > 1 ? ` (${c.count}次)` : ''}
                </Tag>
              ))}
            </div>
          </div>
        )}

        <div className="sidebar-card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>参考答案</div>
            <Button type="link" onClick={() => setShowAnswer(!showAnswer)}>
              {showAnswer ? '隐藏答案' : '显示答案'}
            </Button>
          </div>
          {showAnswer && (
            <div>
              {question.oral_answer && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>口语化回答</div>
                  <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {question.oral_answer}
                  </div>
                </div>
              )}
              {question.ref_answer && (
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>详细参考答案</div>
                  <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 8, lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {question.ref_answer}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sidebar-card">
          <div className="card-title" style={{ marginBottom: 12 }}>
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            艾宾浩斯复习计划
          </div>
          {studyRecord ? (
            <div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                {EBBINGHAUS_LABELS.map((label, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '8px 4px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      background: i < studyRecord.stage ? 'var(--success)' : i === studyRecord.stage ? 'var(--warning)' : 'var(--bg-secondary)',
                      color: i < studyRecord.stage ? '#fff' : i === studyRecord.stage ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                已复习 {studyRecord.review_count} 次 ·
                {studyRecord.is_mastered
                  ? <span style={{ color: 'var(--success)', fontWeight: 600 }}> 已掌握 ✅</span>
                  : <> 下次复习: {studyRecord.next_review_at || '今天'}</>
                }
              </div>
            </div>
          ) : (
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                按艾宾浩斯遗忘曲线安排复习：1天 → 3天 → 7天 → 15天，5次全过即掌握。
              </p>
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleStartStudy}>
                加入学习计划
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QuestionDetail
