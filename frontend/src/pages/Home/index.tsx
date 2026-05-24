import React, { useEffect, useState } from 'react'
import { Row, Col, Tag, Tabs, Select, Input, Pagination, Empty, Spin } from 'antd'
import { SearchOutlined, FireOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { questionApi } from '@/api'

const DIFFICULTY_MAP: Record<string, { color: string; bg: string; accent: string }> = {
  '高阶': { color: '#f5222d', bg: '#fff1f0', accent: 'red' },
  '中阶': { color: '#fa8c16', bg: '#fff7e6', accent: 'orange' },
  '初阶': { color: '#52c41a', bg: '#f6ffed', accent: 'green' },
}

const Home: React.FC = () => {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [type, setType] = useState('interview')
  const [difficulty, setDifficulty] = useState<string | undefined>()
  const [keyword, setKeyword] = useState('')
  const [company, setCompany] = useState('')

  useEffect(() => {
    setLoading(true)
    questionApi.list({
      question_type: type,
      difficulty,
      keyword: keyword || undefined,
      company: company || undefined,
      skip: (page - 1) * 20,
      limit: 20,
    }).then((res) => {
      setQuestions(res.data?.items || [])
      setTotal(res.data?.total || 0)
    }).catch(() => {
      setQuestions([])
      setTotal(0)
    }).finally(() => setLoading(false))
  }, [page, type, difficulty, keyword, company])

  return (
    <div>
      <div className="page-header">
        <h1><FireOutlined style={{ marginRight: 8, color: 'var(--danger)' }} />面试题库</h1>
        <p>涵盖面试题与笔试题，按公司考察频次排序，精准定位高频考点。</p>
      </div>

      <div style={{ padding: '24px 32px' }}>
        <div className="filter-bar">
          <div className="filter-bar-left">
            <Tabs
              activeKey={type}
              onChange={(v) => { setType(v); setPage(1) }}
              size="middle"
              items={[
                { key: 'interview', label: <span style={{ fontWeight: 600 }}>面试题</span> },
                { key: 'written', label: <span style={{ fontWeight: 600 }}>笔试题</span> },
              ]}
            />
          </div>
          <div className="filter-bar-right">
            <Input
              placeholder="搜索题目关键词..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              allowClear
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
              className="filter-input"
            />
            <Input
              placeholder="按公司筛选"
              allowClear
              value={company}
              onChange={(e) => { setCompany(e.target.value); setPage(1) }}
              className="filter-input-short"
            />
            <Select
              placeholder="难度"
              allowClear
              value={difficulty}
              onChange={(v) => { setDifficulty(v); setPage(1) }}
              className="filter-select"
              options={[
                { value: '初阶', label: '🌱 初阶' },
                { value: '中阶', label: '🔥 中阶' },
                { value: '高阶', label: '💎 高阶' },
              ]}
            />
          </div>
        </div>

        <Spin spinning={loading}>
          {questions.length > 0 ? (
            <Row gutter={[16, 16]}>
              {questions.map((q: any) => {
                const diff = DIFFICULTY_MAP[q.difficulty] || { color: '#8c8c8c', bg: '#fafafa', accent: 'gray' }
                const companyCount = q.companies?.length || 0
                return (
                  <Col span={12} key={q.id}>
                    <div
                      className={`question-card ${diff.accent}`}
                      onClick={() => navigate(`/question/${q.id}`)}
                    >
                      <div className="question-card-header">
                        <div className="question-card-badges">
                          <span
                            className="question-diff-badge"
                            style={{ color: diff.color, background: diff.bg, borderColor: `${diff.color}22` }}
                          >
                            {q.difficulty || '未分级'}
                          </span>
                          <span className="question-type-badge">
                            {q.question_type === 'interview' ? '面试' : '笔试'}
                          </span>
                        </div>
                        {companyCount > 0 && (
                          <span className="question-company-count">
                            <FireOutlined style={{ fontSize: 11, color: '#fa8c16' }} />
                            <span>{companyCount}家公司考察</span>
                          </span>
                        )}
                      </div>
                      <div className="question-card-content">
                        {q.content?.length > 100 ? q.content.slice(0, 100) + '...' : q.content}
                      </div>
                      <div className="question-card-footer">
                        <div className="question-card-tags">
                          {(q.tags || []).slice(0, 4).map((tag: string, i: number) => (
                            <span key={i} className="question-tag">{tag}</span>
                          ))}
                          {(q.companies || []).slice(0, 3).map((c: any, i: number) => (
                            <span key={`c${i}`} className="question-company-tag">{c.name}</span>
                          ))}
                          {companyCount > 3 && (
                            <span className="question-more-tag">+{companyCount - 3}</span>
                          )}
                        </div>
                        <RightOutlined className="question-card-arrow" />
                      </div>
                    </div>
                  </Col>
                )
              })}
            </Row>
          ) : (
            <div className="empty-state-card">
              <Empty description="暂无题目数据" />
            </div>
          )}
        </Spin>

        {total > 20 && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Pagination
              current={page}
              total={total}
              pageSize={20}
              onChange={(p) => setPage(p)}
              showSizeChanger={false}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
