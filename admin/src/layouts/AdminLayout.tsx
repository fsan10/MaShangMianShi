import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd'
import {
  FileTextOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RobotOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom'

const { Header, Sider, Content } = Layout

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const token = localStorage.getItem('admin_token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  const menuItems = [
    { key: '/questions', icon: <FileTextOutlined />, label: '题目管理' },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    navigate('/login')
  }

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
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
            gap: 8,
          }}
        >
          <RobotOutlined style={{ color: 'var(--primary)', fontSize: 20 }} />
          {!collapsed && (
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              后台管理
            </span>
          )}
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
              <Avatar size="small" icon={<SettingOutlined />} style={{ background: 'var(--primary)' }} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>管理员</span>
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ padding: 0, background: 'var(--bg-primary)', minHeight: 'calc(100vh - 60px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout
