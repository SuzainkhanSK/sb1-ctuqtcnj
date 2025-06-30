import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  Settings,
  Shield,
  Database,
  Zap,
  Globe,
  Mail,
  Bell,
  Gift,
  Target,
  Trophy,
  Coins,
  Star
} from 'lucide-react'
import { useAdmin } from '../../contexts/AdminContext'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalTransactions: number
  totalPoints: number
  pendingRedemptions: number
  completedRedemptions: number
  todaySignups: number
  todayEarnings: number
  totalSpins: number
  totalScratches: number
  totalTasks: number
  systemHealth: 'good' | 'warning' | 'critical'
}

interface RecentActivity {
  id: string
  type: 'signup' | 'redemption' | 'spin' | 'scratch' | 'task'
  user_email: string
  description: string
  points?: number
  created_at: string
}

const AdminDashboard: React.FC = () => {
  const { adminUser, hasPermission } = useAdmin()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalTransactions: 0,
    totalPoints: 0,
    pendingRedemptions: 0,
    completedRedemptions: 0,
    todaySignups: 0,
    todayEarnings: 0,
    totalSpins: 0,
    totalScratches: 0,
    totalTasks: 0,
    systemHealth: 'good'
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activityLoading, setActivityLoading] = useState(false)

  useEffect(() => {
    fetchDashboardStats()
    fetchRecentActivity()

    // Set up auto-refresh for recent activity every 30 seconds
    const activityRefreshInterval = setInterval(() => {
      fetchRecentActivity(false)
    }, 30000)

    return () => clearInterval(activityRefreshInterval)
  }, [])

  const fetchDashboardStats = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    try {
      setRefreshing(true)
      
      const today = new Date().toISOString().split('T')[0]
      
      // Fetch all stats in parallel
      const [
        usersResult,
        transactionsResult,
        redemptionsResult,
        todaySignupsResult,
        todayEarningsResult,
        spinsResult,
        scratchesResult,
        tasksResult
      ] = await Promise.allSettled([
        supabase.from('profiles').select('id, created_at, points'),
        supabase.from('transactions').select('id, points, created_at, type'),
        supabase.from('redemption_requests').select('id, status, created_at'),
        supabase.from('profiles').select('id').gte('created_at', today),
        supabase.from('transactions').select('points').eq('type', 'earn').gte('created_at', today),
        supabase.from('spin_history').select('id'),
        supabase.from('scratch_history').select('id'),
        supabase.from('tasks').select('id, completed')
      ])

      // Process results safely
      const users = usersResult.status === 'fulfilled' ? usersResult.value.data || [] : []
      const transactions = transactionsResult.status === 'fulfilled' ? transactionsResult.value.data || [] : []
      const redemptions = redemptionsResult.status === 'fulfilled' ? redemptionsResult.value.data || [] : []
      const todaySignups = todaySignupsResult.status === 'fulfilled' ? todaySignupsResult.value.data || [] : []
      const todayEarnings = todayEarningsResult.status === 'fulfilled' ? todayEarningsResult.value.data || [] : []
      const spins = spinsResult.status === 'fulfilled' ? spinsResult.value.data || [] : []
      const scratches = scratchesResult.status === 'fulfilled' ? scratchesResult.value.data || [] : []
      const tasks = tasksResult.status === 'fulfilled' ? tasksResult.value.data || [] : []

      // Calculate stats
      const totalPoints = users.reduce((sum, user) => sum + (user.points || 0), 0)
      const pendingRedemptions = redemptions.filter(r => r.status === 'pending').length
      const completedRedemptions = redemptions.filter(r => r.status === 'completed').length
      const todayEarningsTotal = todayEarnings.reduce((sum, t) => sum + (t.points || 0), 0)
      const activeUsers = users.filter(u => new Date(u.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length

      // Determine system health
      const systemHealth = pendingRedemptions > 50 ? 'critical' : 
                          pendingRedemptions > 20 ? 'warning' : 'good'

      setStats({
        totalUsers: users.length,
        activeUsers,
        totalTransactions: transactions.length,
        totalPoints,
        pendingRedemptions,
        completedRedemptions,
        todaySignups: todaySignups.length,
        todayEarnings: todayEarningsTotal,
        totalSpins: spins.length,
        totalScratches: scratches.length,
        totalTasks: tasks.filter(t => t.completed).length,
        systemHealth
      })

    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
      toast.error('Failed to load dashboard statistics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchRecentActivity = async (showLoading = true) => {
    if (!isSupabaseConfigured) return

    try {
      if (showLoading) {
        setActivityLoading(true)
      }

      // Create a promise for transactions with timeout
      const transactionsPromise = new Promise(async (resolve, reject) => {
        try {
          const { data, error } = await supabase
            .from('transactions')
            .select(`
              id,
              type,
              points,
              description,
              task_type,
              created_at,
              profiles!inner(email)
            `)
            .order('created_at', { ascending: false })
            .limit(10)
          
          if (error) throw error
          resolve(data || [])
        } catch (error) {
          reject(error)
        }
      })

      // Create a promise for redemptions with timeout
      const redemptionsPromise = new Promise(async (resolve, reject) => {
        try {
          const { data, error } = await supabase
            .from('redemption_requests')
            .select(`
              id,
              subscription_name,
              points_cost,
              created_at,
              user_email
            `)
            .order('created_at', { ascending: false })
            .limit(5)
          
          if (error) throw error
          resolve(data || [])
        } catch (error) {
          reject(error)
        }
      })

      // Set a timeout for both promises
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Activity fetch timeout')), 5000)
      )

      // Race the promises against the timeout
      const [recentTransactions, recentRedemptions] = await Promise.all([
        Promise.race([transactionsPromise, timeoutPromise]),
        Promise.race([redemptionsPromise, timeoutPromise])
      ])

      // Combine and format activity
      const activity: RecentActivity[] = []

      // Add transactions
      if (recentTransactions && Array.isArray(recentTransactions)) {
        recentTransactions.forEach((t: any) => {
          let type: RecentActivity['type'] = 'signup'
          if (t.task_type === 'spin_win') type = 'spin'
          else if (t.task_type === 'scratch_earn') type = 'scratch'
          else if (t.task_type === 'telegram' || t.task_type === 'youtube') type = 'task'

          activity.push({
            id: t.id,
            type,
            user_email: t.profiles?.email || 'Unknown',
            description: t.description,
            points: t.points,
            created_at: t.created_at
          })
        })
      }

      // Add redemptions
      if (recentRedemptions && Array.isArray(recentRedemptions)) {
        recentRedemptions.forEach((r: any) => {
          activity.push({
            id: r.id,
            type: 'redemption',
            user_email: r.user_email,
            description: `Redeemed ${r.subscription_name}`,
            points: r.points_cost,
            created_at: r.created_at
          })
        })
      }

      // Sort by date and limit
      activity.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setRecentActivity(activity.slice(0, 15))

    } catch (error) {
      console.error('Failed to fetch recent activity:', error)
      // Don't show toast for background refreshes
      if (showLoading) {
        toast.error('Failed to load recent activity')
      }
    } finally {
      if (showLoading) {
        setActivityLoading(false)
      }
    }
  }

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'signup': return <Users className="h-4 w-4" />
      case 'redemption': return <Gift className="h-4 w-4" />
      case 'spin': return <Target className="h-4 w-4" />
      case 'scratch': return <Trophy className="h-4 w-4" />
      case 'task': return <CheckCircle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'signup': return 'text-green-400'
      case 'redemption': return 'text-purple-400'
      case 'spin': return 'text-blue-400'
      case 'scratch': return 'text-yellow-400'
      case 'task': return 'text-orange-400'
      default: return 'text-gray-400'
    }
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      change: '+12%',
      permission: 'users.read'
    },
    {
      title: 'Active Users (30d)',
      value: stats.activeUsers,
      icon: Activity,
      color: 'from-green-500 to-green-600',
      change: '+8%',
      permission: 'users.read'
    },
    {
      title: 'Total Points',
      value: stats.totalPoints.toLocaleString(),
      icon: Coins,
      color: 'from-yellow-500 to-yellow-600',
      change: '+22%',
      permission: 'transactions.read'
    },
    {
      title: 'Pending Redemptions',
      value: stats.pendingRedemptions,
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      change: stats.pendingRedemptions > 20 ? 'High' : 'Normal',
      permission: 'redemptions.read'
    },
    {
      title: 'Today Signups',
      value: stats.todaySignups,
      icon: Star,
      color: 'from-indigo-500 to-indigo-600',
      change: 'Today',
      permission: 'users.read'
    },
    {
      title: 'Today Earnings',
      value: stats.todayEarnings.toLocaleString(),
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      change: 'Today',
      permission: 'transactions.read'
    }
  ]

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      href: '/admin/users',
      permission: 'users.read'
    },
    {
      title: 'Redemption Requests',
      description: 'Process pending redemption requests',
      icon: Gift,
      color: 'from-green-500 to-green-600',
      href: '/admin/redemptions',
      permission: 'redemptions.read'
    },
    {
      title: 'Analytics',
      description: 'View detailed analytics and reports',
      icon: BarChart3,
      color: 'from-purple-500 to-purple-600',
      href: '/admin/analytics',
      permission: 'analytics.read'
    },
    {
      title: 'System Settings',
      description: 'Configure system settings and preferences',
      icon: Settings,
      color: 'from-gray-500 to-gray-600',
      href: '/admin/settings',
      permission: 'system.manage'
    },
    {
      title: 'Support Center',
      description: 'Manage support tickets and communications',
      icon: Mail,
      color: 'from-orange-500 to-orange-600',
      href: '/admin/support',
      permission: 'support.read'
    },
    {
      title: 'Database Status',
      description: 'Monitor database health and fix issues',
      icon: Database,
      color: 'from-blue-500 to-blue-600',
      href: '/admin/database',
      permission: '*'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p className="text-white">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-300">Welcome back, {adminUser?.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                stats.systemHealth === 'good' ? 'bg-green-500/20 text-green-400' :
                stats.systemHealth === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {stats.systemHealth === 'good' ? <CheckCircle className="h-4 w-4" /> :
                 stats.systemHealth === 'warning' ? <AlertTriangle className="h-4 w-4" /> :
                 <AlertTriangle className="h-4 w-4" />}
                System {stats.systemHealth}
              </div>
              <button
                onClick={() => {
                  fetchDashboardStats()
                  fetchRecentActivity()
                }}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 text-white ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-white">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => {
            if (!hasPermission(stat.permission)) return null
            
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-green-400 text-sm font-medium">{stat.change}</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-gray-300 text-sm">{stat.title}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              if (!hasPermission(action.permission) && action.permission !== '*') return null
              
              return (
                <motion.a
                  key={action.title}
                  href={action.href}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group block"
                >
                  <div className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                    <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{action.title}</h3>
                    <p className="text-gray-300 text-sm">{action.description}</p>
                  </div>
                </motion.a>
              )
            })}
          </div>
        </motion.div>

        {/* Recent Activity & System Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-gray-400" />
                {activityLoading && (
                  <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />
                )}
              </div>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-3 bg-white/10 rounded-xl border border-white/20"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)} bg-current/20`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {activity.description}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {activity.user_email} • {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                    {activity.points && (
                      <div className="text-right">
                        <p className={`text-sm font-bold ${activity.type === 'redemption' ? 'text-red-400' : 'text-green-400'}`}>
                          {activity.type === 'redemption' ? '-' : '+'}{activity.points}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : activityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No recent activity</p>
                  <button 
                    onClick={() => fetchRecentActivity()} 
                    className="mt-2 text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mx-auto"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Refresh activity
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* System Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">System Overview</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-300">
                  <Database className="h-4 w-4" />
                  <span className="text-sm">Database: Connected</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm">Performance: Good</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Game Statistics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-400" />
                      <span className="text-gray-300">Total Spins</span>
                    </div>
                    <span className="text-blue-400 font-bold">{stats.totalSpins.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-400" />
                      <span className="text-gray-300">Total Scratches</span>
                    </div>
                    <span className="text-yellow-400 font-bold">{stats.totalScratches.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-gray-300">Completed Tasks</span>
                    </div>
                    <span className="text-green-400 font-bold">{stats.totalTasks.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                    <span className="text-gray-300">API Status</span>
                    <span className="text-green-400 font-bold">Operational</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                    <span className="text-gray-300">Database</span>
                    <span className="text-green-400 font-bold">Healthy</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                    <span className="text-gray-300">Cache</span>
                    <span className="text-green-400 font-bold">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard