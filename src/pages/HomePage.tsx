import React from 'react'
import { motion } from 'framer-motion'
import { 
  Sparkles, 
  Gift, 
  Trophy, 
  Users, 
  ArrowRight,
  Star,
  Zap,
  Shield
} from 'lucide-react'
import { Link } from 'react-router-dom'

const HomePage: React.FC = () => {
  const features = [
    {
      icon: Gift,
      title: 'Free Premium Subscriptions',
      description: 'Get Netflix, YouTube Premium, Amazon Prime, and more - absolutely free!'
    },
    {
      icon: Trophy,
      title: 'Fun Games & Tasks',
      description: 'Play games, complete quizzes, and earn points while having fun.'
    },
    {
      icon: Users,
      title: 'Social Rewards',
      description: 'Join our community and earn extra points through social activities.'
    },
    {
      icon: Zap,
      title: 'Instant Rewards',
      description: 'Redeem your points instantly for premium subscriptions.'
    }
  ]

  const subscriptions = [
    { name: 'Netflix', logo: '🎬', color: 'from-red-500 to-red-600' },
    { name: 'YouTube Premium', logo: '📺', color: 'from-red-600 to-red-700' },
    { name: 'Amazon Prime', logo: '📦', color: 'from-blue-500 to-blue-600' },
    { name: 'Hotstar', logo: '⭐', color: 'from-blue-600 to-indigo-600' },
    { name: 'JioSaavn', logo: '🎵', color: 'from-green-500 to-green-600' },
    { name: 'Spotify', logo: '🎶', color: 'from-green-600 to-green-700' }
  ]

  const stats = [
    { label: 'Active Users', value: '50K+' },
    { label: 'Subscriptions Given', value: '25K+' },
    { label: 'Points Distributed', value: '1M+' },
    { label: 'Happy Members', value: '95%' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-lg opacity-50" />
                <div className="relative bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-4">
                  <Sparkles className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Premium Access
              </span>
              <br />
              <span className="text-white">Zone</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto">
              Unlock premium subscriptions without spending a penny. Complete simple tasks, 
              play games, and enjoy Netflix, YouTube Premium, Amazon Prime & more!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-full text-lg shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300"
                >
                  <span className="flex items-center gap-2">
                    Get Started Free
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </motion.button>
              </Link>
              
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 border-2 border-white/30 text-white font-bold rounded-full text-lg backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
                >
                  Sign In
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-400/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-40 right-20 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-blue-400/20 rounded-full blur-xl animate-pulse delay-500" />
      </div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative -mt-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-300">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Available Subscriptions */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="py-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Available Premium Subscriptions
            </h2>
            <p className="text-xl text-gray-300">
              Choose from dozens of premium services
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {subscriptions.map((sub, index) => (
              <motion.div
                key={sub.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group"
              >
                <div className={`bg-gradient-to-br ${sub.color} p-6 rounded-2xl shadow-xl group-hover:shadow-2xl transition-all duration-300`}>
                  <div className="text-center">
                    <div className="text-4xl mb-3">{sub.logo}</div>
                    <div className="text-white font-bold">{sub.name}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="py-24 bg-black/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-300">
              Simple steps to unlock premium subscriptions
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 h-full">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="py-24"
      >
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 backdrop-blur-sm rounded-3xl p-12 border border-yellow-400/30">
            <div className="flex justify-center mb-8">
              <div className="flex -space-x-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-8 w-8 text-yellow-400 fill-current" />
                ))}
              </div>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Join 50,000+ Happy Members
            </h2>
            <p className="text-xl text-gray-200 mb-8">
              Start earning points today and unlock your first premium subscription within hours!
            </p>
            
            <div className="flex items-center justify-center gap-4 mb-8">
              <Shield className="h-6 w-6 text-green-400" />
              <span className="text-green-400 font-medium">100% Free & Secure</span>
            </div>
            
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-12 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-full text-xl shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300"
              >
                Start Earning Now
                <Sparkles className="h-6 w-6" />
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="bg-black/40 backdrop-blur-sm border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2025 Premium Access Zone. All rights reserved.</p>
            <p className="text-sm mt-2">Unlock premium subscriptions through simple tasks and games.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage