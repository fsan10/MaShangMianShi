import React, { useEffect, useState } from 'react'
import { Card, List, Button, Tabs, Tag, Space, Empty, message } from 'antd'
import {
  StarOutlined,
  StarFilled,
  DeleteOutlined,
  RedoOutlined,
  ArrowRightOutlined,
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
    <div style={{ padding: 24 }}>
      <Card
        title="错题本"
        extra={<span style={{ color: '#999' }}>连续答对 3 次自动出本，每天少做点已经会的题</span>}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'active',
              label: `活跃错题 ${activeList.length}`,
              children: activeList.length > 0 ? (
                <List
                  dataSource={activeList}
                  renderItem={(item: MistakeItem) => (
                    <List.Item
                      actions={[
                        <Button size="small" type="primary" onClick={() => handleAnswer(item.questionId, true)}>
                          答对
                        </Button>,
                        <Button size="small" danger onClick={() => handleAnswer(item.questionId, false)}>
                          答错
                        </Button>,
                        <Button
                          size="small"
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemove(item.questionId)}
                        >
                          移除
                        </Button>,
                        <Button
                          size="small"
                          type="link"
                          icon={item.isFavorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                          onClick={() => handleToggleFavorite(item.questionId)}
                        >
                          {item.isFavorite ? '取消' : '收藏'}
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={item.questionContent || `题目 #${item.questionId}`}
                        description={
                          <Space>
                            <span>错误次数：{item.mistakeCount} 次</span>
                            <span>连续正确：{item.consecutiveCorrect} 次</span>
                            <span>最后错误：{item.lastMistakeAt?.split('T')[0]}</span>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无活跃错题，做题后答错的会自动加入" />
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
                      actions={[
                        <Button
                          size="small"
                          type="link"
                          icon={<RedoOutlined />}
                          onClick={() => handleRejoin(item.questionId)}
                        >
                          重新加入
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={item.questionContent || `题目 #${item.questionId}`}
                        description={
                          <Space>
                            <Tag color="green">已掌握</Tag>
                            <span>出本时间：{item.masteredAt?.split('T')[0]}</span>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无已出本记录" />
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}

export default MistakesPage
