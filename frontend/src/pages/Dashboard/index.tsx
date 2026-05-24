import React, { useEffect, useState } from 'react'
import { Card, Table, Row, Col, Tag, Tooltip, Spin } from 'antd'
import ReactECharts from 'echarts-for-react'
import { statsApi } from '@/api'

const TECH_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  'Java': { color: '#f5222d', bg: '#fff1f0', border: '#ffa39e' },
  'Python': { color: '#1677ff', bg: '#e6f4ff', border: '#bae0ff' },
  'Go': { color: '#13c2c2', bg: '#e6fffb', border: '#87e8de' },
  'C++': { color: '#722ed1', bg: '#f9f0ff', border: '#d3adf7' },
  'JavaScript': { color: '#fa8c16', bg: '#fff7e6', border: '#ffd591' },
  'MySQL': { color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  'Redis': { color: '#eb2f96', bg: '#fff0f6', border: '#ffadd2' },
  '数据结构': { color: '#1677ff', bg: '#e6f4ff', border: '#bae0ff' },
  '操作系统': { color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  '计算机网络': { color: '#fa8c16', bg: '#fff7e6', border: '#ffd591' },
  '组成原理': { color: '#722ed1', bg: '#f9f0ff', border: '#d3adf7' },
}

const DIFFICULTY_MAP: Record<string, { label: string; color: string }> = {
  '高阶': { label: '高阶', color: '#f5222d' },
  '中阶': { label: '中阶', color: '#fa8c16' },
  '初阶': { label: '初阶', color: '#52c41a' },
}

const RankBadge: React.FC<{ rank: number }> = ({ rank }) => {
  if (rank === 1) return <span className="rank-badge gold">1</span>
  if (rank === 2) return <span className="rank-badge silver">2</span>
  if (rank === 3) return <span className="rank-badge bronze">3</span>
  return <span className="rank-badge normal">{rank}</span>
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    statsApi.dashboard().then((res) => {
      setData(res.data)
    }).catch(() => {
      setData({
        total_questions: 0, total_interview_questions: 0, total_written_questions: 0,
        total_knowledge_points: 0, total_companies: 0, knowledge_ranking: [],
        tech_stack_distribution: [], difficulty_distribution: {},
      })
    }).finally(() => setLoading(false))
  }, [])

  const columns = [
    {
      title: '排名', dataIndex: 'rank', width: 60, align: 'center' as const,
      render: (rank: number) => <RankBadge rank={rank} />,
    },
    {
      title: '知识点', dataIndex: 'name', width: 200,
      render: (name: string, record: any) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{record.tech_stack?.join(' · ')}</div>
        </div>
      ),
    },
    {
      title: '技术栈', dataIndex: 'tech_stack', width: 100,
      render: (stacks: string[]) => {
        const subject = stacks?.[0] || '其他'
        const colorCfg = TECH_COLORS[subject] || { color: '#8c8c8c', bg: '#fafafa', border: '#d9d9d9' }
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 100, fontSize: 12, fontWeight: 500, color: colorCfg.color, background: colorCfg.bg, border: `1px solid ${colorCfg.border}` }}>
            {subject}
          </span>
        )
      },
    },
    { title: '题量', dataIndex: 'question_count', width: 60, align: 'center' as const, render: (v: number) => <span style={{ fontWeight: 600 }}>{v}</span> },
    {
      title: '分级', dataIndex: 'difficulty_level', width: 70, align: 'center' as const,
      render: (level: string) => {
        const diff = DIFFICULTY_MAP[level] || { label: level || '未分级', color: '#8c8c8c' }
        return <span style={{ color: diff.color, fontWeight: 600, fontSize: 12 }}>{diff.label}</span>
      },
    },
    {
      title: '次数', dataIndex: 'company_count', width: 70, align: 'center' as const,
      render: (v: number) => <span style={{ fontWeight: 600, color: 'var(--danger)' }}>{v}次</span>,
    },
    {
      title: '考察公司分布', dataIndex: 'company_distribution', width: 300,
      render: (companies: string[]) => {
        if (!companies || companies.length === 0) return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>暂无数据</span>
        const maxShow = 8
        const shown = companies.slice(0, maxShow)
        const rest = companies.length - maxShow
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {shown.map((company: string, idx: number) => (
              <Tooltip key={idx} title={company}>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {company}
                </span>
              </Tooltip>
            ))}
            {rest > 0 && (
              <Tooltip title={companies.slice(maxShow).join('、')}>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: 'var(--primary)', background: 'var(--bg-secondary)', border: '1px solid var(--primary)' }}>+{rest}</span>
              </Tooltip>
            )}
          </div>
        )
      },
    },
  ]

  const techChartOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}题 ({d}%)' },
    series: [{
      type: 'pie', radius: ['45%', '75%'], center: ['50%', '50%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 12 },
      data: data?.tech_stack_distribution?.map((item: any) => ({ name: item.name, value: item.count })) || [],
    }],
  }

  const diffChartOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}题 ({d}%)' },
    series: [{
      type: 'pie', radius: ['45%', '75%'], center: ['50%', '50%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 12 },
      data: Object.entries(data?.difficulty_distribution || {}).map(([key, value]: [string, any]) => ({
        name: key, value,
        itemStyle: { color: key === '高阶' ? '#f5222d' : key === '中阶' ? '#fa8c16' : key === '初阶' ? '#52c41a' : '#8c8c8c' },
      })),
    }],
  }

  return (
    <div>
      <div className="page-header">
        <h1>真题大盘 · 面试题库系统</h1>
        <p>按知识点维度沉淀的命题规律。</p>
      </div>
      <div style={{ padding: '24px 32px' }}>
        {/* 统计卡片 - 参考图1样式 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <div className="stat-card blue">
              <div className="stat-value">{data?.total_questions || 0}</div>
              <div className="stat-label">真题总量</div>
              <div className="stat-desc">{data?.total_companies || 0}个公司</div>
            </div>
          </Col>
          <Col span={8}>
            <div className="stat-card green">
              <div className="stat-value">{data?.total_knowledge_points || 0}</div>
              <div className="stat-label">收录知识点</div>
              <div className="stat-desc">面试{data?.total_interview_questions || 0} · 笔试{data?.total_written_questions || 0}</div>
            </div>
          </Col>
          <Col span={8}>
            <div className="stat-card red">
              <div className="stat-value">{data?.knowledge_ranking?.filter((k: any) => k.company_count >= 3).length || 0}</div>
              <div className="stat-label">高频考点</div>
              <div className="stat-desc">考察公司{data?.total_companies || 0}家</div>
            </div>
          </Col>
        </Row>
        <Row gutter={24}>
          <Col span={18}>
            <div className="custom-table">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
                <div className="section-title" style={{ marginBottom: 0 }}>
                  面试高频知识点
                  <span className="subtitle">按公司提问次数排序 · {data?.total_companies || 0}家公司累加</span>
                </div>
              </div>
              <Table columns={columns} dataSource={data?.knowledge_ranking || []} rowKey="rank" loading={loading} pagination={false} size="middle" scroll={{ x: 'max-content' }} />
            </div>
          </Col>
          <Col span={6}>
            <div className="sidebar-card">
              <div className="card-title">技术栈分布</div>
              <ReactECharts option={techChartOption} style={{ height: 260 }} />
            </div>
            <div className="sidebar-card">
              <div className="card-title">难度分级</div>
              <ReactECharts option={diffChartOption} style={{ height: 260 }} />
            </div>
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default Dashboard
