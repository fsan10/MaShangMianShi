import React, { useEffect, useState } from 'react'
import { Card, List, Button, Tabs, Tag, Space, Empty, message } from 'antd'
import {
  StarOutlined,
  StarFilled,
  DeleteOutlined,
  RedoOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { localStore, MistakeItem } from '@/utils/localStore'

const MistakesPage: React.FC = () => {
  const [activeList, setActiveList] = useState<MistakeItem[]>([])
  const [masteredList, setMasteredList] = useState<MistakeItem[]>([])
  const [activeTab, setActiveTab] = useState('active')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const all = localStore.getMistakes()
    setActiveList(all.filter((m) => m.status === 'active'))
    setMasteredList(all.filter((m) => m.status === 'mastered'))
  }

  const handleToggleFavorite = (questionId: number) => {
    const all = localStore.getMistakes()
    const item = all.find((m) => m.questionId === questionId)
    if (item) {
      item.isFavorite = !item.isFavorite
      localStore.setMistakes(all)
      loadData()
    }
  }

  const handleRemove = (questionId: number) => {
    localStore.removeMistake(questionId)
    message.success('已移除')
    loadData()
  }

  const handleRejoin = (questionId: number) => {
    const all = localStore.getMistakes()
    const item = all.find((m) => m.questionId === questionId)
    if (item) {
      item.status = 'active'
      item.consecutiveCorrect = 0
      item.masteredAt = null
      localStore.setMistakes(all)
      message.success('已重新加入错题本')
      loadData()
    }
  }

  const handleAnswer = (questionId: number, isCorrect: boolean) => {
    const all = localStore.getMistakes()
    const item = all.find((m) => m.questionId === questionId)
    if (!item) return

    if (isCorrect) {
      item.consecutiveCorrect += 1
      if (item.consecutiveCorrect >= 3) {
        item.status = 'mastered'
        item.masteredAt = new Date().toISOString()
        message.success('连续答对3次，已出本！')
      }
    } else {
      item.mistakeCount += 1
      item.consecutiveCorrect = 0
      item.lastMistakeAt = new Date().toISOString()
    }
    item.lastAnswerAt = new Date().toISOString()
    localStore.setMistakes(all)

    const stats = localStore.getStats()
    stats.totalAnswered += 1
    if (isCorrect) stats.totalCorrect += 1
    localStore.setStats(stats)

    loadData()
  }

  return (
    <div>
      <div className="page-header">
        <h1><FileTextOutlined style={{ marginRight: 8, color: 'var(--danger)' }} />错题本</h1>
        <p>记录错题，反复练习。连续答对 3 次自动出本，每天少做点已经会的题。</p>
      </div>

      <div style={{ padding: '24px 32px' }}>
        <div className="sidebar-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
            <div className="section-title" style={{ marginBottom: 0 }}>
              错题管理
              <span className="subtitle">连续答对 3 次自动出本</span>
            </div>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="middle"
            style={{ padding: '0 20px' }}
            items={[
              {
                key: 'active',
                label: `活跃错题 ${activeList.length}`,
                children: activeList.length > 0 ? (
                  <List
                    dataSource={activeList}
                    renderItem={(item: MistakeItem) => (
                      <List.Item
                        style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}
                        actions={[
                          <Button
                            size="small"
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleAnswer(item.questionId, true)}
                            style={{ background: 'var(--success)', borderColor: 'var(--success)' }}
                          >
                            答对
                          </Button>,
                          <Button
                            size="small"
                            danger
                            icon={<CloseCircleOutlined />}
                            onClick={() => handleAnswer(item.questionId, false)}
                          >
                            答错
                          </Button>,
                          <Button
                            size="small"
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemove(item.questionId)}
                          >
                            移除
                          </Button>,
                          <Button
                            size="small"
                            type="text"
                            icon={item.isFavorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                            onClick={() => handleToggleFavorite(item.questionId)}
                          >
                            {item.isFavorite ? '取消' : '收藏'}
                          </Button>,
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                              {item.questionContent || `题目 #${item.questionId}`}
                            </span>
                          }
                          description={
                            <Space size={16} style={{ marginTop: 4 }}>
                              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                                错误次数：<span style={{ color: 'var(--danger)', fontWeight: 600 }}>{item.mistakeCount}</span> 次
                              </span>
                              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                                连续正确：<span style={{ color: 'var(--success)', fontWeight: 600 }}>{item.consecutiveCorrect}</span> / 3
                              </span>
                              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                最后错误：{item.lastMistakeAt?.split('T')[0]}
                              </span>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无活跃错题，做题后答错的会自动加入"
                    style={{ padding: 60 }}
                  />
                ),
              },
              {
                key: 'mastered',
                label: `已出本 ${masteredList.length}`,
                children: masteredList.length > 0 ? (
                  <List
                    dataSource={masteredList}
                    renderItem={(item: MistakeItem) => (
                      <List.Item
                        style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}
                        actions={[
                          <Button
                            size="small"
                            type="text"
                            icon={<RedoOutlined />}
                            onClick={() => handleRejoin(item.questionId)}
                          >
                            重新加入
                          </Button>,
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                              {item.questionContent || `题目 #${item.questionId}`}
                            </span>
                          }
                          description={
                            <Space size={16} style={{ marginTop: 4 }}>
                              <Tag color="success" style={{ fontSize: 12 }}>已掌握</Tag>
                              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                出本时间：{item.masteredAt?.split('T')[0]}
                              </span>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无已出本记录"
                    style={{ padding: 60 }}
                  />
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  )
}

export default MistakesPage
