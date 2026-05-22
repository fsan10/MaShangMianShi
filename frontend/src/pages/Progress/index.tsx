import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Progress } from 'antd'
import {
  CheckCircleOutlined,
  FireOutlined,
  TrophyOutlined,
  BookOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { localStore } from '@/utils/localStore'
import dayjs from 'dayjs'

const ProgressPage: React.FC = () => {
  const [stats, setStats] = useState(localStore.getStats())
  const [masteries, setMasteries] = useState(localStore.getMasteries())
  const [checkins, setCheckins] = useState(localStore.getCheckins())

  useEffect(() => {
    setStats(localStore.getStats())
    setMasteries(localStore.getMasteries())
    setCheckins(localStore.getCheckins())
  }, [])

  const accuracy = stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0

  const streakDays = (() => {
    if (!stats.lastStudyDate) return 0
    const sorted = [...checkins].sort((a, b) => b.date.localeCompare(a.date))
    let streak = 0
    let current = dayjs().format('YYYY-MM-DD')
    for (const c of sorted) {
      if (c.date === current) {
        streak++
        current = dayjs(current).subtract(1, 'day').format('YYYY-MM-DD')
      } else if (c.date < current) {
        break
      }
    }
    return streak
  })()

  const categoryMap: Record<string, { total: number; mastered: number }> = {}
  masteries.forEach((m) => {
    const cat = m.knowledgePointName || '未分类'
    if (!categoryMap[cat]) categoryMap[cat] = { total: 0, mastered: 0 }
    categoryMap[cat].total += m.totalCount
    if (m.status === 'mastered') categoryMap[cat].mastered += m.totalCount
  })

  const chapters = Object.entries(categoryMap).map(([name, data]) => ({
    name,
    total: data.total,
    mastered: data.mastered,
    percentage: data.total > 0 ? Math.round((data.mastered / data.total) * 100) : 0,
  }))

  const radarData = Object.entries(categoryMap).map(([name, data]) => ({
    name,
    score: data.total > 0 ? Math.round((data.mastered / data.total) * 100) : 0,
  }))

  const radarOption = {
    tooltip: {},
    radar: {
      indicator: radarData.map((r) => ({ name: r.name, max: 100 })),
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: radarData.map((r) => r.score),
            name: '掌握程度',
            areaStyle: { opacity: 0.3 },
          },
        ],
      },
    ],
  }

  const checkinDates = new Set(checkins.map((c) => c.date))
  const generateCalendarData = () => {
    const year = new Date().getFullYear()
    const data: [string, number][] = []
    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(year, m + 1, 0).getDate()
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        data.push([dateStr, checkinDates.has(dateStr) ? 1 : 0])
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
            <Statistic title="已做题数" value={stats.totalAnswered} prefix={<BookOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="正确率" value={accuracy} suffix="%" prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="连续打卡" value={streakDays} suffix="天" prefix={<FireOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已掌握" value={stats.masteredCount} suffix="个" prefix={<TrophyOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="能力雷达">
            {radarData.length > 0 ? (
              <ReactECharts option={radarOption} style={{ height: 300 }} />
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>开始做题后显示雷达图</div>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="365天打卡日历">
            <ReactECharts option={calendarOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card title="章节进度">
        {chapters.length > 0 ? (
          chapters.map((ch) => (
            <div key={ch.name} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>{ch.name}</span>
                <span>{ch.percentage}% ({ch.mastered}/{ch.total}题)</span>
              </div>
              <Progress percent={ch.percentage} strokeColor="#1677ff" />
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>开始做题后显示进度</div>
        )}
      </Card>
    </div>
  )
}

export default ProgressPage
