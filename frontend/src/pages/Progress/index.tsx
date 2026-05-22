import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic } from 'antd'
import { CheckCircleOutlined, FireOutlined, TrophyOutlined, BookOutlined, RiseOutlined } from '@ant-design/icons'
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
      splitArea: {
        areaStyle: {
          color: ['rgba(22, 119, 255, 0.02)', 'rgba(22, 119, 255, 0.05)', 'rgba(22, 119, 255, 0.08)'],
        },
      },
      axisLine: { lineStyle: { color: 'var(--border-color)' } },
      splitLine: { lineStyle: { color: 'var(--border-color)' } },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: radarData.map((r) => r.score),
            name: '掌握程度',
            areaStyle: { opacity: 0.2, color: '#1677ff' },
            lineStyle: { color: '#1677ff', width: 2 },
            itemStyle: { color: '#1677ff' },
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
        { value: 0, color: '#f0f0f0', label: '未打卡' },
        { value: 1, color: '#52c41a', label: '已打卡' },
      ],
      orient: 'horizontal',
      left: 'center',
      top: 0,
      itemWidth: 12,
      itemHeight: 12,
      textStyle: { fontSize: 11 },
    },
    calendar: {
      range: new Date().getFullYear().toString(),
      cellSize: ['auto', 14],
      left: 30,
      right: 30,
      top: 50,
      yearLabel: { show: false },
      itemStyle: { borderWidth: 2, borderColor: '#fff' },
      splitLine: { show: false },
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
    <div>
      <div className="page-header">
        <h1><RiseOutlined style={{ marginRight: 8, color: 'var(--primary)' }} />学习进度</h1>
        <p>追踪你的学习轨迹，掌握程度一目了然。坚持每日打卡，稳步提升。</p>
      </div>

      <div style={{ padding: '24px 32px' }}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <div className="stat-card blue">
              <div className="stat-value">{stats.totalAnswered}</div>
              <div className="stat-label">已做题数</div>
              <div className="stat-desc">累计答题记录</div>
            </div>
          </Col>
          <Col span={6}>
            <div className="stat-card green">
              <div className="stat-value">{accuracy}%</div>
              <div className="stat-label">正确率</div>
              <div className="stat-desc">{stats.totalCorrect} / {stats.totalAnswered} 正确</div>
            </div>
          </Col>
          <Col span={6}>
            <div className="stat-card orange">
              <div className="stat-value">{streakDays}</div>
              <div className="stat-label">连续打卡</div>
              <div className="stat-desc">天不间断</div>
            </div>
          </Col>
          <Col span={6}>
            <div className="stat-card purple">
              <div className="stat-value">{stats.masteredCount}</div>
              <div className="stat-label">已掌握</div>
              <div className="stat-desc">个知识点</div>
            </div>
          </Col>
        </Row>

        <Row gutter={24} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <div className="sidebar-card">
              <div className="card-title">能力雷达</div>
              {radarData.length > 0 ? (
                <ReactECharts option={radarOption} style={{ height: 320 }} />
              ) : (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                  <BookOutlined style={{ fontSize: 32, marginBottom: 12 }} />
                  <div>开始做题后显示雷达图</div>
                </div>
              )}
            </div>
          </Col>
          <Col span={12}>
            <div className="sidebar-card">
              <div className="card-title">365天打卡日历</div>
              <ReactECharts option={calendarOption} style={{ height: 320 }} />
            </div>
          </Col>
        </Row>

        <div className="sidebar-card">
          <div className="card-title">章节进度</div>
          {chapters.length > 0 ? (
            chapters.map((ch) => (
              <div key={ch.name} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{ch.name}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    {ch.percentage}% ({ch.mastered}/{ch.total}题)
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${ch.percentage}%` }} />
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <BookOutlined style={{ fontSize: 32, marginBottom: 12 }} />
              <div>开始做题后显示进度</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProgressPage
