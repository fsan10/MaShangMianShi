import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Progress } from 'antd'
import {
  CheckCircleOutlined,
  FireOutlined,
  TrophyOutlined,
  BookOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { progressApi } from '@/api'

const ProgressPage: React.FC = () => {
  const [overview, setOverview] = useState<any>(null)
  const [chapters, setChapters] = useState<any[]>([])
  const [radar, setRadar] = useState<any[]>([])
  const [checkins, setCheckins] = useState<any[]>([])

  useEffect(() => {
    progressApi.overview().then((res) => setOverview(res.data))
    progressApi.chapters().then((res) => setChapters(res.data))
    progressApi.radar().then((res) => setRadar(res.data))
    progressApi.checkins().then((res) => setCheckins(res.data))
  }, [])

  const radarOption = {
    tooltip: {},
    radar: {
      indicator: radar.map((r) => ({ name: r.category_name, max: 100 })),
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: radar.map((r) => r.score),
            name: '掌握程度',
            areaStyle: { opacity: 0.3 },
          },
        ],
      },
    ],
  }

  const checkinDates = new Set(checkins.map((c) => c.checkin_date))

  const generateCalendarData = () => {
    const now = new Date()
    const year = now.getFullYear()
    const data: [string, number][] = []
    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(year, m + 1, 0).getDate()
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const count = checkinDates.has(dateStr) ? 1 : 0
        data.push([dateStr, count])
      }
    }
    return data
  }

  const calendarOption = {
    visualMap: {
      min: 0,
      max: 1,
      type: 'piecewise',
      pieces: [
        { value: 0, color: '#eee', label: '未打卡' },
        { value: 1, color: '#52c41a', label: '已打卡' },
      ],
      orient: 'horizontal',
      left: 'center',
      top: 0,
    },
    calendar: {
      range: new Date().getFullYear().toString(),
      cellSize: ['auto', 14],
      left: 40,
      right: 40,
      top: 60,
      yearLabel: { show: false },
    },
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: generateCalendarData(),
      },
    ],
  }

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="已做题数"
              value={overview?.total_answered || 0}
              prefix={<BookOutlined />}
              suffix={`/ ${overview?.total_answered || 0}`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="正确率"
              value={overview?.accuracy || 0}
              suffix="%"
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="连续打卡"
              value={overview?.streak_days || 0}
              suffix="天"
              prefix={<FireOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已掌握"
              value={overview?.mastered_count || 0}
              suffix="个"
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="4科能力雷达">
            <ReactECharts option={radarOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="365天打卡日历">
            <ReactECharts option={calendarOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card title="章节进度">
        {chapters.map((ch) => (
          <div key={ch.category_name} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>{ch.category_name}</span>
              <span>{ch.percentage}% ({ch.answered_questions}/{ch.total_questions}题)</span>
            </div>
            <Progress percent={ch.percentage} strokeColor="#1677ff" />
          </div>
        ))}
      </Card>
    </div>
  )
}

export default ProgressPage
