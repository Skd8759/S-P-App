import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Calendar, Clock, Users, CheckCircle, X, AlertCircle } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import { formatDate } from '../../utils/dateUtils'

const AdminBookings = () => {
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchBookings()
  }, [filter, currentPage])

  const fetchBookings = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      })
      
      if (filter !== 'all') {
        params.append('status', filter)
      }
      
      const response = await axios.get(`/api/admin/bookings?${params}`)
      setBookings(response.data.data.bookings)
      setTotalPages(response.data.data.pagination.pages)
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (bookingId, status) => {
    try {
      await axios.put(`/api/admin/bookings/${bookingId}/status`, { status })
      fetchBookings()
    } catch (error) {
      console.error('Error updating booking status:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'badge-success'
      case 'completed':
        return 'badge-default'
      case 'cancelled':
        return 'badge-error'
      case 'no-show':
        return 'badge-warning'
      default:
        return 'badge-secondary'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      case 'no-show':
        return 'No Show'
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Bookings</h1>
          <p className="text-gray-600 mt-2">
            View and manage all swimming pool bookings.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All Bookings' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'no-show', label: 'No Show' }
            ].map((filterOption) => (
              <button
                key={filterOption.value}
                onClick={() => setFilter(filterOption.value)}
                className={`btn btn-sm ${
                  filter === filterOption.value ? 'btn-primary' : 'btn-outline'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="card p-12 text-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 mt-4">Loading bookings...</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booked
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {booking.user?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(booking.slot?.date)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.slot?.startTime} - {booking.slot?.endTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {booking.isRaisingCourt ? 'Raising Court' : 'Swimming Pool'}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {booking.slot?.gender}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${getStatusColor(booking.status)}`}>
                          {getStatusText(booking.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(booking.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {booking.status === 'confirmed' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(booking._id, 'completed')}
                                className="text-green-600 hover:text-green-900"
                                title="Mark as completed"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(booking._id, 'no-show')}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Mark as no-show"
                              >
                                <AlertCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {booking.status !== 'cancelled' && (
                            <button
                              onClick={() => handleUpdateStatus(booking._id, 'cancelled')}
                              className="text-red-600 hover:text-red-900"
                              title="Cancel booking"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="btn btn-outline btn-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="btn btn-outline btn-sm"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="btn btn-outline btn-sm"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="btn btn-outline btn-sm"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminBookings
