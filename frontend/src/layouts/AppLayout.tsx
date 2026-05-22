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
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 16 : 20,
            fontWeight: 'bold',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {collapsed ? '面' : '马上面试'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} src={user?.avatar_url} />
              <span>{user?.nickname || '未登录'}</span>
              {!user && <CloudSyncOutlined style={{ color: '#1677ff', fontSize: 12 }} />}
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ margin: 0, background: '#f5f5f5', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>

      {loginOpen && (
        <Modal
          open={loginOpen}
          onCancel={() => setLoginOpen(false)}
          footer={null}
          title="登录以启用云端同步"
        >
          <QRCodeLogin onSuccess={() => setLoginOpen(false)} />
        </Modal>
      )}
    </Layout>
  )
}

export default AppLayout
