import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button, message, Space, Typography, Modal } from 'antd'
import { CloseOutlined, CopyOutlined, ReloadOutlined, LoadingOutlined } from '@ant-design/icons'
import { authApi } from '@/api'
import { useAuth } from '@/contexts/AuthContext'

const { Text } = Typography

interface LoginModalProps {
  visible: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const LoginModal: React.FC<LoginModalProps> = ({ visible, onClose, onSuccess }) => {
  const { login } = useAuth()
  const [sessionId] = useState(() => `web_${Date.now()}_${Math.random().toString(36).slice(2)}`)
  const [qrCode, setQrCode] = useState('')
  const [status, setStatus] = useState<'loading' | 'scanning' | 'scanned' | 'success' | 'expired'>('loading')
  const [countdown, setCountdown] = useState(300)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  const requestLoginCode = useCallback(async () => {
    setStatus('loading')
    try {
      const res = await authApi.requestLoginCode(sessionId)
      setQrCode(res.data?.code || '')
      setStatus('scanning')
      setCountdown(300)
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || '获取验证码失败'
      message.error(detail)
      setStatus('expired')
    }
  }, [sessionId])

  const startPolling = useCallback(() => {
    clearTimers()
    pollRef.current = setInterval(async () => {
      try {
        const res = await authApi.checkLoginStatus(sessionId)
        const data = res.data
        if (data?.status === 'scanned') {
          setStatus('scanned')
        } else if (data?.status === 'success' && data?.token) {
          setStatus('success')
          clearTimers()
          await login(data.token)
          message.success('登录成功')
          onSuccess?.()
          onClose()
        } else if (data?.status === 'expired') {
          setStatus('expired')
          clearTimers()
        }
      } catch {
        // 忽略轮询错误
      }
    }, 2000)
  }, [sessionId, login, onSuccess, onClose, clearTimers])

  useEffect(() => {
    if (!visible) return
    requestLoginCode()
    startPolling()
    return () => { clearTimers() }
  }, [visible])

  useEffect(() => {
    if (status !== 'scanning') return
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setStatus('expired')
          clearTimers()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [status, clearTimers])

  const handleCopy = () => {
    navigator.clipboard.writeText(qrCode).then(() => message.success('验证码已复制'))
  }

  const handleRefresh = () => {
    requestLoginCode()
    startPolling()
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const statusDot = status === 'scanning' ? '#1677ff' : status === 'scanned' ? '#52c41a' : status === 'expired' ? '#ff4d4f' : '#8c8c8c'
  const statusText = status === 'scanning' ? `等待中... 验证码 ${formatTime(countdown)} 后过期` : status === 'scanned' ? '已扫码，正在登录...' : status === 'expired' ? '验证码已过期，请刷新' : status === 'success' ? '登录成功' : '加载中...'

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={380}
      centered
      closable={false}
      styles={{ body: { padding: 0 } }}
      maskStyle={{ background: 'rgba(0,0,0,0.45)' }}
    >
      <div style={{ padding: '20px 24px 16px' }}>
        {/* 头部 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1f1f1f' }}>登录 / 注册</span>
          <Button type="text" size="small" icon={<CloseOutlined />} onClick={onClose} style={{ color: '#8c8c8c' }} />
        </div>

        {/* 二维码区域 */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{
            width: 200,
            height: 200,
            margin: '0 auto',
            borderRadius: 8,
            border: '1px solid #f0f0f0',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {status === 'loading' ? (
              <LoadingOutlined style={{ fontSize: 32, color: '#bfbfbf' }} />
            ) : status === 'expired' ? (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.95)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <Text type="danger" style={{ fontSize: 14, marginBottom: 12 }}>二维码已过期</Text>
                <Button type="primary" icon={<ReloadOutlined />} onClick={handleRefresh} size="small">
                  刷新
                </Button>
              </div>
            ) : (
              <div style={{
                width: 180,
                height: 180,
                background: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: '#8c8c8c',
                borderRadius: 4,
              }}>
                {/* 这里用占位展示二维码样式，实际接入微信时替换为真实二维码图片 */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 160, height: 160,
                    background: `repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 50% / 20px 20px`,
                    borderRadius: 4,
                    position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 36, height: 36,
                      background: '#fff',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#1677ff' }}>码</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: '#595959' }}>
            长按识别 / 微信扫码
          </div>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
            关注「码砖 CodeBrick」公众号
          </div>
        </div>

        {/* 验证码区域 */}
        <div style={{
          background: '#f5f5f5',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, color: '#595959', marginBottom: 6 }}>
            验证码（5分钟内有效）
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: 28,
              fontWeight: 800,
              fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
              letterSpacing: 6,
              color: '#1677ff',
            }}>
              {qrCode || '------'}
            </span>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={handleCopy}
              disabled={!qrCode}
              style={{ color: '#595959', fontSize: 12 }}
            >
              复制
            </Button>
          </div>
        </div>

        {/* 步骤说明 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#595959', lineHeight: 1.8 }}>
            <div>1. 长按二维码识别，或用微信扫码进入公众号</div>
            <div>
              2. 在公众号对话框发送{' '}
              <span style={{ fontWeight: 700, color: '#1677ff' }}>{qrCode || '------'}</span>
            </div>
            <div>3. 等待自动登录（无需手动操作）</div>
          </div>
        </div>

        {/* 底部分隔线 + 状态 */}
        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: statusDot,
              animation: status === 'scanning' ? 'pulse 1.5s infinite' : 'none',
            }} />
            <span style={{ fontSize: 13, color: '#8c8c8c' }}>{statusText}</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </Modal>
  )
}

// 兼容旧接口：Login 页面组件（用于独立路由）
const Login: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const [visible, setVisible] = useState(true)
  return (
    <LoginModal
      visible={visible}
      onClose={() => setVisible(false)}
      onSuccess={onSuccess}
    />
  )
}

export default Login
