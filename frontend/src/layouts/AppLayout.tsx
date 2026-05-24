import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd'
import {
  DashboardOutlined,
  ThunderboltOutlined,
  LogoutOutlined,
  UserOutlined,
  LoginOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FireOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoginModal } from '@/pages/Login'

const { Header, Sider, Content } = Layout

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const menuItems = [
    { key: '/home', icon: <FireOutlined />, label: '题目列表' },
    { key: '/dashboard', icon: <DashboardOutlined />, label: '统计大盘' },
    { key: '/study', icon: <ThunderboltOutlined />, label: '学习巩固' },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = async () => {
    await logout()
  }

  const userMenuItems = user
    ? [
        { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
      ]
    : [
        { key: 'login', icon: <LoginOutlined />, label: '登录', onClick: () => setLoginOpen(true) },
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
          style={{ borderRight: 'none', padding: '8px 0' }}
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
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ padding: 0, background: 'var(--bg-primary)', minHeight: 'calc(100vh - 60px)' }}>
          <Outlet />
        </Content>
      </Layout>

      {/* 登录弹窗 */}
      <LoginModal
        visible={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => setLoginOpen(false)}
      />
    </Layout>
  )
}

export default AppLayout
