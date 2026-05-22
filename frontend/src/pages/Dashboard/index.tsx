import React, { useEffect, useState } from 'react'
import { Card, Table, Row, Col, Statistic, Tag, Tooltip, Space } from 'antd'
import {
  BookOutlined,
  CodeOutlined,
  FireOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { statsApi } from '@/api'

const TECH_STACK_COLORS: Record<string, string> = {
  MySQL: '#1677ff',
  Hive: '#fa8c16',
  Oracle: '#f5222d',
  Hadoop: '#722ed1',
  操作系统: '#52c41a',
  数据结构: '#1677ff',
  组成原理: '#faad14',
  银行业务: '#8c8c8c',
  数据仓库: '#8b4513',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  高阶: '#f5222d',
  中阶: '#fa8c16',
  初阶: '#52c41a',
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    statsApi.dashboard().then((res) => {
      setData(res.data)
    }).finally(() => setLoading(false))
  }, [])

  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      width: 60,
      render: (rank: number) => {
        if (rank === 1) return <span style={{ color: '#ffd700', fontWeight: 'bold' }}>🥇 1</span>
        if (rank === 2) return <span style={{ color: '#c0c0c0', fontWeight: 'bold' }}>🥈 2</span>
        if (rank === 3) return <span style={{ color: '#cd7f32', fontWeight: 'bold' }}>🥉 3</span>
        return rank
      },
    },
    {
      title: '知识点',
      dataIndex: 'name',
      width: 180,
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      title: '技术栈',
      dataIndex: 'tech_stack',
      width: 120,
      render: (stacks: string[]) =>
        stacks?.map((s) => (
          <Tag key={s} color={TECH_STACK_COLORS[s] || '#default'} style={{ marginBottom: 2 }}>
            {s}
          </Tag>
        )),
    },
    {
      title: '题量',
      dataIndex: 'question_count',
      width: 60,
    },
    {
      title: '分级',
      dataIndex: 'difficulty_level',
      width: 70,
      render: (level: string) => (
        <Tag color={DIFFICULTY_COLORS[level] || '#default'}>{level}</Tag>
      ),
    },
    {
      title: '考察公司',
      dataIndex: 'company_distribution',
      width: 160,
      render: (companies: string[]) => (
        <Tooltip title={companies?.join('、')}>
          <Space size={2}>
            {companies?.slice(0, 5).map((c, i) => (
              <div
                key={c}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  background: `hsl(210, 70%, ${30 + i * 12}%)`,
                  display: 'inline-block',
                }}
              />
            ))}
            {companies?.length > 5 && <Text type="secondary">+{companies.length - 5}</Text>}
          </Space>
        </Tooltip>
      ),
    },
    {
      title: '资源',
      width: 100,
      render: (_: unknown, record: any) => (
        <Space>
          <Tooltip title="讲解">
            <BookOutlined style={{ color: record.has_explanation ? '#1677ff' : '#d9d9d9', fontSize: 16 }} />
          </Tooltip>
          <Tooltip title="OJ实操">
            <CodeOutlined style={{ color: record.has_oj_practice ? '#52c41a' : '#d9d9d9', fontSize: 16 }} />
          </Tooltip>
        </Space>
      ),
    },
  ]

  const techChartOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}题 ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        data: data?.tech_stack_distribution?.map((item: any) => ({
          name: item.name,
          value: item.count,
          itemStyle: { color: TECH_STACK_COLORS[item.name] },
        })) || [],
        label: { formatter: '{b}\n{d}%' },
      },
    ],
  }

  const diffChartOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}题 ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        data: Object.entries(data?.difficulty_distribution || {}).map(([key, value]: [string, any]) => ({
          name: key,
          value,
          itemStyle: { color: DIFFICULTY_COLORS[key] || '#8c8c8c' },
        })),
        label: { formatter: '{b}\n{d}%' },
      },
    ],
  }

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic title="题目总量" value={data?.total_questions || 0} prefix={<BookOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="收录知识点" value={data?.total_knowledge_points || 0} prefix={<FireOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="高频考点" value={data?.knowledge_ranking?.filter((k: any) => k.question_count >= 10).length || 0} prefix={<TrophyOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card title="高频知识点排行榜" style={{ marginBottom: 24 }}>
        <Table
          columns={columns}
          dataSource={data?.knowledge_ranking || []}
          rowKey="rank"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </Card>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="技术栈分布">
            <ReactECharts option={techChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="分级分布">
            <ReactECharts option={diffChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
