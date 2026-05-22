import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Progress, Button, Tag, Tabs, Modal, List } from 'antd'
import { ArrowRightOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { reviewApi } from '@/api'

const ReviewPage: React.FC = () => {
  const [knowledgePoints, setKnowledgePoints] = useState<any[]>([])
  const [weakPoints, setWeakPoints] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [weakModalOpen, setWeakModalOpen] = useState(false)

  useEffect(() => {
    loadKnowledgePoints()
    reviewApi.weakPoints().then((res) => setWeakPoints(res.data))
  }, [activeTab])

  const loadKnowledgePoints = async () => {
    const res = await reviewApi.knowledgePoints()
    setKnowledgePoints(res.data)
  }

  const handleStart = async (kpId: number) => {
    await reviewApi.start(kpId)
  }

  const totalQuestions = knowledgePoints.reduce((sum, kp) => sum + (kp.question_count || 0), 0)
  const masteredQuestions = knowledgePoints.filter((kp) => kp.mastery_status === 'mastered').length

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{totalQuestions}</div>
            <div style={{ color: '#999' }}>总题数</div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{masteredQuestions}</div>
            <div style={{ color: '#999' }}>已掌握题数</div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={() => setWeakModalOpen(true)}
              style={{ marginBottom: 8, width: '100%' }}
            >
              查看薄弱项
            </Button>
            <Button
              icon={<ArrowRightOutlined />}
              onClick={() => {}}
              style={{ width: '100%' }}
            >
              开始智能推荐
            </Button>
          </Card>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'all', label: '全部' },
          { key: 'ds', label: '数据结构' },
          { key: 'os', label: '操作系统' },
          { key: 'cn', label: '计算机网络' },
          { key: 'co', label: '组成原理' },
        ]}
      />

      <Row gutter={[16, 16]}>
        {knowledgePoints.map((kp) => (
          <Col span={8} key={kp.id}>
            <Card hoverable>
              <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>{kp.name}</div>
              <div style={{ marginBottom: 8 }}>
                {kp.tech_stack?.map((ts: string) => (
                  <Tag key={ts} style={{ marginBottom: 4 }}>{ts}</Tag>
                ))}
              </div>
              <div style={{ color: '#666', marginBottom: 4 }}>
                {kp.question_count} 真题 · {kp.correct_count || 0} 做题
              </div>
              <Progress percent={kp.percentage || 0} size="small" />
              <Button
                type="primary"
                block
                style={{ marginTop: 12 }}
                onClick={() => handleStart(kp.id)}
              >
                开始巩固 →
              </Button>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title="薄弱项分析"
        open={weakModalOpen}
        onCancel={() => setWeakModalOpen(false)}
        footer={null}
      >
        <List
          dataSource={weakPoints}
          renderItem={(item: any) => (
            <List.Item>
              <List.Item.Meta
                title={`知识点 #${item.knowledge_point_id}`}
                description={`优先级: ${item.priority} | 原因: ${item.weak_reason || '正确率低'}`}
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  )
}

export default ReviewPage
