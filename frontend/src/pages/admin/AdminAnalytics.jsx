import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart3, TrendingUp, Users, Calendar } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import { formatDate } from '../../utils/dateUtils'

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get('/api/admin/analytics', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      })
      setAnalytics(response.data.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getMaxValue = (data) => {
    return Math.max(...data.map(item => item.count))
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">
            Detailed analytics and insights for the swimming pool booking system.
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Date Range</h3>
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="input"
              />
            </div>
          </div>
        </div>

        {analytics && (
          <>
            {/* Booking Trends */}
            <div className="card p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Trends</h3>
              <div className="space-y-4">
                {analytics.bookingTrends.map((trend) => (
                  <div key={trend._id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 w-24">{formatDate(trend._id)}</span>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full" 
                          style={{ 
                            width: `${(trend.count / getMaxValue(analytics.bookingTrends)) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{trend.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Status Distribution */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Status Distribution</h3>
                <div className="space-y-3">
                  {analytics.statusDistribution.map((status) => (
                    <div key={status._id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          status._id === 'confirmed' ? 'bg-green-500' :
                          status._id === 'completed' ? 'bg-blue-500' :
                          status._id === 'cancelled' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {status._id}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">{status.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gender Distribution */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gender Distribution</h3>
                <div className="space-y-3">
                  {analytics.genderDistribution.map((gender) => (
                    <div key={gender._id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          gender._id === 'male' ? 'bg-blue-500' : 'bg-pink-500'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {gender._id}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">{gender.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Peak Hours */}
            <div className="card p-6 mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Hours Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.peakHours.slice(0, 6).map((hour, index) => (
                  <div key={hour._id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                      <span className="text-sm text-gray-600">{hour.count} bookings</span>
                    </div>
                    <div className="text-lg font-semibold text-primary-600">
                      {hour._id}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminAnalytics
