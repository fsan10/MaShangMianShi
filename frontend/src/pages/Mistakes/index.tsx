import React, { useEffect, useState } from 'react'
import { Card, List, Button, Tabs, Tag, Space, Empty, message } from 'antd'
import {
  StarOutlined,
  StarFilled,
  DeleteOutlined,
  RedoOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import { mistakesApi } from '@/api'

const MistakesPage: React.FC = () => {
  const [activeList, setActiveList] = useState<any[]>([])
  const [masteredList, setMasteredList] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('active')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [activeRes, masteredRes] = await Promise.all([
      mistakesApi.active(),
      mistakesApi.mastered(),
    ])
    setActiveList(activeRes.data)
    setMasteredList(masteredRes.data)
  }

  const handleToggleFavorite = async (id: number) => {
    await mistakesApi.toggleFavorite(id)
    loadData()
  }

  const handleRemove = async (id: number) => {
    await mistakesApi.remove(id)
    message.success('已移除')
    loadData()
  }

  const handleRejoin = async (id: number) => {
    await mistakesApi.rejoin(id)
    message.success('已重新加入错题本')
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
                  renderItem={(item: any) => (
                    <List.Item
                      actions={[
                        <Button
                          size="small"
                          type="link"
                          icon={<ArrowRightOutlined />}
                          onClick={() => mistakesApi.review(item.id)}
                        >
                          去巩固
                        </Button>,
                        <Button
                          size="small"
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemove(item.id)}
                        >
                          移除
                        </Button>,
                        <Button
                          size="small"
                          type="link"
                          icon={item.is_favorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                          onClick={() => handleToggleFavorite(item.id)}
                        >
                          {item.is_favorite ? '取消收藏' : '收藏'}
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={`题目 #${item.question_id}`}
                        description={
                          <Space>
                            <span>错误次数：{item.mistake_count} 次</span>
                            <span>连续正确：{item.consecutive_correct} 次</span>
                            <span>最后错误：{item.last_mistake_at?.split('T')[0]}</span>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无活跃错题" />
              ),
            },
            {
              key: 'mastered',
              label: `已出本 ${masteredList.length}`,
              children: masteredList.length > 0 ? (
                <List
                  dataSource={masteredList}
                  renderItem={(item: any) => (
                    <List.Item
                      actions={[
                        <Button
                          size="small"
                          type="link"
                          icon={<RedoOutlined />}
                          onClick={() => handleRejoin(item.id)}
                        >
                          重新加入
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={`题目 #${item.question_id}`}
                        description={
                          <Space>
                            <Tag color="green">已掌握</Tag>
                            <span>出本时间：{item.mastered_at?.split('T')[0]}</span>
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
