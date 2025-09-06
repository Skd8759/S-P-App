import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Clock,
  Pool,
  BarChart3
} from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import { formatDate } from '../../utils/dateUtils'

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get('/api/admin/dashboard')
      setDashboardData(response.data.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  const stats = [
    {
      title: 'Total Users',
      value: dashboardData?.users?.total || 0,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Active Slots',
      value: dashboardData?.slots?.active || 0,
      icon: Calendar,
      color: 'bg-green-500',
      change: '+5%'
    },
    {
      title: 'Total Bookings',
      value: dashboardData?.bookings?.total || 0,
      icon: CheckCircle,
      color: 'bg-purple-500',
      change: '+18%'
    },
    {
      title: "Today's Bookings",
      value: dashboardData?.bookings?.today || 0,
      icon: Clock,
      color: 'bg-orange-500',
      change: '+8%'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Overview of the NITK Swimming Pool booking system.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="card p-6">
              <div className="flex items-center">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-green-600">{stat.change}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
              <a href="/admin/bookings" className="text-sm text-primary-600 hover:text-primary-500">
                View all
              </a>
            </div>
            
            <div className="space-y-4">
              {dashboardData?.recentBookings?.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent bookings</p>
              ) : (
                dashboardData?.recentBookings?.map((booking) => (
                  <div key={booking._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Pool className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{booking.user?.name}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(booking.slot?.date)} - {booking.slot?.startTime}
                        </p>
                      </div>
                    </div>
                    <span className={`badge ${
                      booking.status === 'confirmed' ? 'badge-success' :
                      booking.status === 'completed' ? 'badge-default' :
                      booking.status === 'cancelled' ? 'badge-error' : 'badge-warning'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Booking Trends */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Trends (Last 7 Days)</h3>
            
            {dashboardData?.bookingTrends?.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No booking data available</p>
            ) : (
              <div className="space-y-3">
                {dashboardData?.bookingTrends?.map((trend) => (
                  <div key={trend._id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{formatDate(trend._id)}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full" 
                          style={{ width: `${(trend.count / Math.max(...dashboardData.bookingTrends.map(t => t.count))) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">{trend.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/admin/users"
                className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Users className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Manage Users</p>
                  <p className="text-sm text-gray-600">View and manage user accounts</p>
                </div>
              </a>
              
              <a
                href="/admin/slots"
                className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Calendar className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Manage Slots</p>
                  <p className="text-sm text-gray-600">Create and manage time slots</p>
                </div>
              </a>
              
              <a
                href="/admin/analytics"
                className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <BarChart3 className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Analytics</p>
                  <p className="text-sm text-gray-600">View detailed analytics</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
