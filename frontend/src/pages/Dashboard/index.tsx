import React, { useEffect, useState } from 'react'
import { Card, Table, Row, Col, Tag, Tooltip, Space, Spin } from 'antd'
import ReactECharts from 'echarts-for-react'
import { statsApi } from '@/api'

const SUBJECT_MAP: Record<string, { name: string; cls: string }> = {
  '数据结构': { name: '数据结构', cls: 'ds' },
  '操作系统': { name: '操作系统', cls: 'os' },
  '计算机网络': { name: '计算机网络', cls: 'cn' },
  '组成原理': { name: '组成原理', cls: 'co' },
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
        total_questions: 0,
        total_knowledge_points: 0,
        total_companies: 0,
        knowledge_ranking: [],
        tech_stack_distribution: [],
        difficulty_distribution: {},
      })
    }).finally(() => setLoading(false))
  }, [])

  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      width: 60,
      align: 'center' as const,
      render: (rank: number) => <RankBadge rank={rank} />,
    },
    {
      title: '知识点',
      dataIndex: 'name',
      width: 200,
      render: (name: string, record: any) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {record.tech_stack?.join(' · ')}
          </div>
        </div>
      ),
    },
    {
      title: '学科',
      dataIndex: 'tech_stack',
      width: 100,
      render: (stacks: string[]) => {
        const subject = stacks?.[0] || '其他'
        const map = SUBJECT_MAP[subject] || { name: subject, cls: 'ds' }
        return <span className={`subject-tag ${map.cls}`}>{map.name}</span>
      },
    },
    {
      title: '题量',
      dataIndex: 'question_count',
      width: 60,
      align: 'center' as const,
      render: (v: number) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: '分值',
      width: 80,
      render: (_: unknown, record: any) => (
        <span style={{ fontWeight: 600, color: 'var(--danger)' }}>
          {Math.round((record.question_count || 0) * 1.5)}分
        </span>
      ),
    },
    {
      title: '分级',
      dataIndex: 'difficulty_level',
      width: 70,
      align: 'center' as const,
      render: (level: string) => {
        const diff = DIFFICULTY_MAP[level] || { label: level || '未分级', color: '#8c8c8c' }
        return <span style={{ color: diff.color, fontWeight: 600, fontSize: 12 }}>{diff.label}</span>
      },
    },
    {
      title: '考察年份分布',
      dataIndex: 'company_distribution',
      width: 300,
      render: (companies: string[]) => {
        const years = ['09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26']
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {years.map((y) => (
              <span
                key={y}
                className={companies?.some((c) => c.includes(y)) ? 'year-block' : 'year-block missing'}
              >
                {y}
              </span>
            ))}
          </div>
        )
      },
    },
    {
      title: '资源',
      width: 100,
      align: 'center' as const,
      render: (_: unknown, record: any) => (
        <Space size={8}>
          {record.has_explanation && (
            <span className="action-btn primary" style={{ padding: '2px 8px', fontSize: 12 }}>
              讲解
            </span>
          )}
          {record.has_oj_practice && (
            <span className="action-btn" style={{ padding: '2px 8px', fontSize: 12, color: 'var(--success)', borderColor: 'var(--success)' }}>
              OJ
            </span>
          )}
        </Space>
      ),
    },
  ]

  const techChartOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}题 ({d}%)' },
    legend: { show: false },
    series: [
      {
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          fontSize: 12,
          color: 'var(--text-secondary)',
        },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' },
        },
        data: data?.tech_stack_distribution?.map((item: any) => ({
          name: item.name,
          value: item.count,
        })) || [],
      },
    ],
  }

  const diffChartOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}题 ({d}%)' },
    legend: { show: false },
    series: [
      {
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['50%', '50%'],
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          fontSize: 12,
        },
        data: Object.entries(data?.difficulty_distribution || {}).map(([key, value]: [string, any]) => ({
          name: key,
          value,
          itemStyle: {
            color: key === '高阶' ? '#f5222d' : key === '中阶' ? '#fa8c16' : key === '初阶' ? '#52c41a' : '#8c8c8c',
          },
        })),
      },
    ],
  }

  return (
    <div>
      <div className="page-header">
        <h1>真题大盘 · 面试题库系统</h1>
        <p>按知识点维度沉淀的命题规律。点击任一知识点可跳转可视化演示与视频讲解。</p>
      </div>

      <div style={{ padding: '24px 32px' }}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <div className="stat-card blue">
              <div className="stat-value">{data?.total_questions || 0}</div>
              <div className="stat-label">真题总量</div>
              <div className="stat-desc">2009 - 2026 年 18 年</div>
            </div>
          </Col>
          <Col span={8}>
            <div className="stat-card green">
              <div className="stat-value">{data?.total_knowledge_points || 0}</div>
              <div className="stat-label">收录知识点</div>
              <div className="stat-desc">实际考察 165 个</div>
            </div>
          </Col>
          <Col span={8}>
            <div className="stat-card red">
              <div className="stat-value">
                {data?.knowledge_ranking?.filter((k: any) => k.question_count >= 10).length || 0}
              </div>
              <div className="stat-label">高频考点</div>
              <div className="stat-desc">考察 ≥ 10 年</div>
            </div>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={18}>
            <div className="custom-table">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
                <div className="section-title" style={{ marginBottom: 0 }}>
                  高频知识点 TOP 15
                  <span className="subtitle">按累计分值排序 · 18 年累加</span>
                </div>
              </div>
              <Table
                columns={columns}
                dataSource={data?.knowledge_ranking || []}
                rowKey="rank"
                loading={loading}
                pagination={false}
                size="middle"
                scroll={{ x: 'max-content' }}
              />
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
