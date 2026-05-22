import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Modal } from 'antd'
import {
  DashboardOutlined,
  CodeOutlined,
  BookOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  LogoutOutlined,
  UserOutlined,
  LoginOutlined,
  CloudSyncOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import QRCodeLogin from '@/pages/Login'

const { Header, Sider, Content } = Layout

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '统计大盘' },
    { key: '/questions', icon: <QuestionCircleOutlined />, label: '问题管理' },
    { key: '/ai', icon: <RobotOutlined />, label: 'AI 识别' },
    { key: '/projects', icon: <LinkOutlined />, label: '项目关联' },
    { key: '/oj', icon: <CodeOutlined />, label: '在线OJ' },
    { key: '/progress', icon: <BookOutlined />, label: '学习进度' },
    { key: '/review', icon: <ThunderboltOutlined />, label: '巩固功能' },
    { key: '/mistakes', icon: <FileTextOutlined />, label: '错题本' },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = async () => {
    await logout()
  }

  const userMenuItems = user
    ? [
        { key: 'sync', icon: <CloudSyncOutlined />, label: '云端同步' },
        { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
      ]
    : [
        { key: 'login', icon: <LoginOutlined />, label: '登录同步', onClick: () => setLoginOpen(true) },
      ]

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={200}
        style={{
          background: '#fff',
          borderRight: '1px solid var(--border-color)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
          zIndex: 10,
        }}
      >
        <div
          style={{
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 20px',
            borderBottom: '1px solid var(--border-color)',
            fontSize: collapsed ? 18 : 16,
            fontWeight: 700,
            color: 'var(--text-primary)',
            gap: 8,
          }}
        >
          <span style={{ color: 'var(--primary)', fontSize: 20 }}>面</span>
          {!collapsed && <span>马上面试</span>}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            borderRight: 'none',
            padding: '8px 0',
          }}
          theme="light"
        />
      </Sider>
      <Layout style={{ background: 'var(--bg-primary)' }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-color)',
            height: 60,
            position: 'sticky',
            top: 0,
            zIndex: 9,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16 }}
          />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button
              type="text"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 40,
                padding: '0 12px',
                borderRadius: 20,
                border: '1px solid var(--border-color)',
              }}
            >
              <Avatar size="small" icon={<UserOutlined />} src={user?.avatar_url} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {user?.nickname || '未登录'}
              </span>
              {!user && (
                <CloudSyncOutlined style={{ color: 'var(--primary)', fontSize: 12 }} />
              )}
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ padding: 0, background: 'var(--bg-primary)', minHeight: 'calc(100vh - 60px)' }}>
          <Outlet />
        </Content>
      </Layout>

      {loginOpen && (
        <Modal
          open={loginOpen}
          onCancel={() => setLoginOpen(false)}
          footer={null}
          title="登录以启用云端同步"
          width={420}
        >
          <QRCodeLogin onSuccess={() => setLoginOpen(false)} />
        </Modal>
      )}
    </Layout>
  )
}

export default AppLayout
