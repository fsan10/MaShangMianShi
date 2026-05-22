import React, { useState, useEffect, useRef } from 'react'
import { Button, Typography, Space, Steps, message } from 'antd'
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons'
import { authApi } from '@/api'
import { useAuth } from '@/contexts/AuthContext'

const { Text, Title } = Typography

interface QRCodeLoginProps {
  onSuccess?: () => void
}

const QRCodeLogin: React.FC<QRCodeLoginProps> = ({ onSuccess }) => {
  const { login } = useAuth()
  const [session, setSession] = useState<{
    session_id: string
    qrcode_url: string
    verify_code: string
    expires_in: number
  } | null>(null)
  const [status, setStatus] = useState<'pending' | 'success' | 'expired'>('pending')
  const [countdown, setCountdown] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval>>()

  const fetchQRCode = async () => {
    try {
      const res = await authApi.getQRCode()
      setSession(res.data)
      setStatus('pending')
      setCountdown(res.data.expires_in)
    } catch {
      message.error('获取二维码失败')
    }
  }

  useEffect(() => {
    fetchQRCode()
  }, [])

  useEffect(() => {
    if (!session || status !== 'pending') return

    pollRef.current = setInterval(async () => {
      try {
        const res = await authApi.checkStatus(session.session_id)
        const data = res.data
        if (data.status === 'success') {
          setStatus('success')
          login(data.token, data.user)
          message.success('登录成功！')
          onSuccess?.()
        } else if (data.status === 'expired') {
          setStatus('expired')
        }
      } catch {
        // ignore
      }
    }, 2000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [session, status, login, onSuccess])

  useEffect(() => {
    if (countdown <= 0) {
      if (status === 'pending') setStatus('expired')
      return
    }
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown, status])

  const handleCopy = () => {
    if (session?.verify_code) {
      navigator.clipboard.writeText(session.verify_code)
      message.success('验证码已复制')
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      {session && (
        <>
          <div
            style={{
              width: 200,
              height: 200,
              margin: '0 auto 16px',
              border: '1px solid #d9d9d9',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fafafa',
            }}
          >
            <Text type="secondary">微信扫码</Text>
          </div>
          <Text type="secondary">长按识别 / 微信扫码关注「面试题库」公众号</Text>

          <div
            style={{
              margin: '16px 0',
              padding: '12px 24px',
              background: '#f0f5ff',
              borderRadius: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Text type="secondary">验证码（5分钟内有效）</Text>
              <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
                复制
              </Button>
            </div>
            <Title
              level={2}
              style={{ margin: '8px 0', color: '#1677ff', letterSpacing: 8, fontFamily: 'monospace' }}
            >
              {session.verify_code}
            </Title>
          </div>

          <Steps
            direction="vertical"
            size="small"
            current={status === 'success' ? 3 : status === 'expired' ? -1 : 0}
            items={[
              { title: '长按二维码识别，或用微信扫码进入公众号' },
              { title: `在公众号对话框发送 ${session.verify_code}` },
              { title: '等待自动登录' },
            ]}
          />

          <div style={{ marginTop: 16 }}>
            {status === 'pending' && (
              <Text type="secondary">🔵 等待中... 验证码 {formatTime(countdown)} 后过期</Text>
            )}
            {status === 'expired' && (
              <Space>
                <Text type="danger">验证码已过期</Text>
                <Button icon={<ReloadOutlined />} onClick={fetchQRCode}>
                  刷新
                </Button>
              </Space>
            )}
            {status === 'success' && <Text type="success">✅ 登录成功，云端同步已启用</Text>}
          </div>
        </>
      )}
    </div>
  )
}

export default QRCodeLogin
