import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Coins, 
  Trophy, 
  Target, 
  Gift, 
  TrendingUp,
  Calendar,
  Users,
  Award,
  AlertCircle,
  Database,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import toast from 'react-hot-toast'

const Dashboard: React.FC = () => {
  const { userProfile, user, checkAndAwardSignupBonus, refreshProfile } = useAuth()
  const [stats, setStats] = useState({
    todayEarned: 0,
    tasksCompleted: 0,
    totalTransactions: 0,
    weeklyEarned: 0
  })
  const [recentTransactions, setRecentTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [activityLoading, setActivityLoading] = useState(false)
  const [databaseConnected, setDatabaseConnected] = useState(false)
  const [fixingBonus, setFixingBonus] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    // Only show loading if we have a user and Supabase is configured
    if (user?.id && isSupabaseConfigured) {
      setLoading(true)
      checkDatabaseConnection()
    } else {
      setLoading(false)
      setDatabaseConnected(false)
      setConnectionError(null)
    }
  }, [user])

  const checkDatabaseConnection = async () => {
    if (!isSupabaseConfigured) {
      setDatabaseConnected(false)
      setConnectionError('Supabase not configured')
      setLoading(false)
      return
    }

    try {
      // Fast connection check with short timeout
      const connectionPromise = supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .maybeSingle()

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 3000)
      )

      await Promise.race([connectionPromise, timeoutPromise])

      setDatabaseConnected(true)
      setConnectionError(null)
      
      // Fetch dashboard data in background - don't block UI
      fetchDashboardData().catch((error) => {
        console.warn('Dashboard data fetch failed (non-critical):', error)
      })
    } catch (error: any) {
      console.warn('Database connection check failed (non-critical):', error)
      setDatabaseConnected(false)
      
      // Set user-friendly error messages
      if (error.message?.includes('Failed to fetch') || error.message?.includes('Connection timeout')) {
        setConnectionError('Network connection failed. Please check your internet connection.')
      } else if (error.message?.includes('timeout')) {
        setConnectionError('Database connection timed out. Please try again.')
      } else {
        setConnectionError('Unable to connect to database. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboardData = async () => {
    if (!user?.id || !isSupabaseConfigured || !databaseConnected) return

    try {
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      // Create queries with fast timeouts
      const queries = [
        Promise.race([
          supabase.from('transactions').select('points').eq('user_id', user.id).eq('type', 'earn').gte('created_at', today),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 3000))
        ]),
        Promise.race([
          supabase.from('transactions').select('points').eq('user_id', user.id).eq('type', 'earn').gte('created_at', weekAgo),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 3000))
        ]),
        Promise.race([
          supabase.from('tasks').select('id').eq('user_id', user.id).eq('completed', true),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 3000))
        ]),
        Promise.race([
          supabase.from('transactions').select('id').eq('user_id', user.id),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 3000))
        ])
      ]

      // Execute queries with individual error handling
      const results = await Promise.allSettled(queries)

      // Process results safely
      const [todayResult, weeklyResult, tasksResult, transactionsResult] = results

      setStats({
        todayEarned: todayResult.status === 'fulfilled' && todayResult.value?.data 
          ? todayResult.value.data.reduce((sum: number, t: any) => sum + t.points, 0) 
          : 0,
        tasksCompleted: tasksResult.status === 'fulfilled' && tasksResult.value?.data 
          ? tasksResult.value.data.length 
          : 0,
        totalTransactions: transactionsResult.status === 'fulfilled' && transactionsResult.value?.data 
          ? transactionsResult.value.data.length 
          : 0,
        weeklyEarned: weeklyResult.status === 'fulfilled' && weeklyResult.value?.data 
          ? weeklyResult.value.data.reduce((sum: number, t: any) => sum + t.points, 0) 
          : 0
      })

      // Fetch recent transactions separately
      fetchRecentActivity()
    } catch (error) {
      console.warn('Dashboard data fetch failed (non-critical):', error)
      // Set default values on error
      setStats({
        todayEarned: 0,
        tasksCompleted: 0,
        totalTransactions: 0,
        weeklyEarned: 0
      })
    }
  }

  const fetchRecentActivity = async () => {
    if (!user?.id || !isSupabaseConfigured || !databaseConnected) return

    try {
      setActivityLoading(true)

      // Create a promise with timeout for recent transactions
      const transactionsPromise = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(15)

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Recent activity timeout')), 5000)
      )

      const { data, error } = await Promise.race([
        transactionsPromise,
        timeoutPromise
      ]) as any

      if (error) throw error
      
      setRecentTransactions(data || [])
    } catch (error) {
      console.warn('Recent activity fetch failed (non-critical):', error)
      setRecentTransactions([])
      // Only show toast for non-timeout errors to avoid spamming the user
      if (error.message && !error.message.includes('timeout')) {
        toast.error('Failed to load recent activity')
      }
    } finally {
      setActivityLoading(false)
    }
  }

  const handleFixSignupBonus = async () => {
    if (!user?.id || !isSupabaseConfigured) return
    
    setFixingBonus(true)
    try {
      await checkAndAwardSignupBonus()
      await refreshProfile()
      await fetchDashboardData()
      toast.success('Signup bonus check completed!')
    } catch (error: any) {
      console.warn('Signup bonus fix failed (non-critical):', error)
      if (error.message?.includes('Failed to fetch')) {
        toast.error('Network error. Please check your connection and try again.')
      } else {
        toast.error('Failed to check signup bonus. Please try again.')
      }
    } finally {
      setFixingBonus(false)
    }
  }

  const quickActions = [
    {
      title: 'Play Games',
      description: 'Spin, scratch & earn',
      icon: Trophy,
      href: '/games',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      title: 'Complete Tasks',
      description: 'Social media tasks',
      icon: Target,
      href: '/tasks',
      color: 'from-blue-400 to-blue-600'
    },
    {
      title: 'Redeem Rewards',
      description: 'Get subscriptions',
      icon: Gift,
      href: '/rewards',
      color: 'from-purple-400 to-purple-600'
    }
  ]

  const statCards = [
    {
      title: 'Current Balance',
      value: userProfile?.points || 0,
      icon: Coins,
      color: 'from-green-400 to-green-600',
      suffix: ' Points'
    },
    {
      title: 'Today\'s Earnings',
      value: stats.todayEarned,
      icon: TrendingUp,
      color: 'from-blue-400 to-blue-600',
      suffix: ' Points'
    },
    {
      title: 'Tasks Completed',
      value: stats.tasksCompleted,
      icon: Award,
      color: 'from-purple-400 to-purple-600',
      suffix: ' Tasks'
    },
    {
      title: 'Weekly Earned',
      value: stats.weeklyEarned,
      icon: Calendar,
      color: 'from-orange-400 to-orange-600',
      suffix: ' Points'
    }
  ]

  // Show minimal loading only when actually fetching data
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Show skeleton content instead of full loading screen */}
        <div className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-8 border border-yellow-400/30 animate-pulse">
          <div className="h-8 bg-white/20 rounded mb-4 w-3/4"></div>
          <div className="h-6 bg-white/20 rounded w-1/2"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 animate-pulse">
              <div className="h-12 w-12 bg-white/20 rounded-xl mb-4"></div>
              <div className="h-8 bg-white/20 rounded mb-2"></div>
              <div className="h-4 bg-white/20 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Database Setup Notice */}
      {(!databaseConnected || !isSupabaseConfigured) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <Database className="h-6 w-6 text-blue-300 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-blue-200 font-semibold mb-2">
                {!isSupabaseConfigured ? 'Complete Your Setup' : 'Connection Issue'}
              </h3>
              <p className="text-blue-100 text-sm mb-3">
                {!isSupabaseConfigured 
                  ? 'To unlock all features including points tracking, tasks, and rewards, please connect your database. Click the "Connect to Supabase" button in the top right corner to get started.'
                  : connectionError || 'Unable to connect to the database. Some features may be limited.'
                }
              </p>
              {!isSupabaseConfigured && (
                <div className="bg-blue-400/20 rounded-lg p-3 border border-blue-400/30">
                  <p className="text-blue-200 text-xs font-medium">
                    🎁 Once connected, you'll automatically receive your 100 welcome bonus points!
                  </p>
                </div>
              )}
              {connectionError && isSupabaseConfigured && (
                <button
                  onClick={checkDatabaseConnection}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/30 hover:bg-blue-500/40 border border-blue-400/50 rounded-lg text-blue-200 text-sm font-medium transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry Connection
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Signup Bonus Missing Notice */}
      {databaseConnected && isSupabaseConfigured && userProfile && userProfile.points === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-yellow-300 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-yellow-200 font-semibold mb-2">Missing Welcome Bonus?</h3>
              <p className="text-yellow-100 text-sm mb-4">
                It looks like you haven't received your 100 welcome bonus points yet. This might happen if there was an issue during account creation.
              </p>
              <button
                onClick={handleFixSignupBonus}
                disabled={fixingBonus}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500/30 hover:bg-yellow-500/40 border border-yellow-400/50 rounded-lg text-yellow-200 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {fixingBonus ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-300" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {fixingBonus ? 'Checking...' : 'Claim Welcome Bonus'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-8 border border-yellow-400/30"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {userProfile?.full_name || 'User'}! 👋
            </h1>
            <p className="text-gray-200 text-lg">
              You have <span className="font-bold text-yellow-400">{userProfile?.points || 0} points</span> ready to use
            </p>
            {(!databaseConnected || !isSupabaseConfigured) && (
              <p className="text-yellow-300 text-sm mt-2">
                {!isSupabaseConfigured 
                  ? 'Connect to Supabase to start earning and tracking points'
                  : 'Reconnect to database to sync your latest points'
                }
              </p>
            )}
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center">
              <Coins className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {stat.value.toLocaleString()}{stat.suffix}
            </h3>
            <p className="text-gray-300 text-sm">{stat.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <motion.a
              key={action.title}
              href={action.href}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
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
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
          <button 
            onClick={fetchRecentActivity}
            disabled={activityLoading}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${activityLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {databaseConnected && isSupabaseConfigured ? (
          activityLoading && recentTransactions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400" />
            </div>
          ) : recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((transaction: any, index) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-white/10 rounded-xl border border-white/20"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'earn' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {transaction.type === 'earn' ? '+' : '-'}
                    </div>
                    <div>
                      <p className="text-white font-medium">{transaction.description}</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(transaction.created_at).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className={`font-bold ${
                    transaction.type === 'earn' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {transaction.type === 'earn' ? '+' : '-'}{transaction.points}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No recent activity yet</p>
              <p className="text-gray-500 text-sm">
                Complete tasks to see your activity here
              </p>
              <button 
                onClick={fetchRecentActivity} 
                className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 text-white text-sm transition-colors"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh Activity
                </div>
              </button>
            </div>
          )
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No recent activity yet</p>
            <p className="text-gray-500 text-sm">
              {(!databaseConnected || !isSupabaseConfigured)
                ? 'Connect to database to start tracking your activity' 
                : 'Complete tasks to see your activity here'
              }
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default Dashboard