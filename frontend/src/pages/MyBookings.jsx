import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  X, 
  AlertCircle,
  Pool,
  Timer,
  QrCode,
  Eye
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatDate, getRelativeDate, canBookSlot } from '../utils/dateUtils'

const MyBookings = () => {
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    fetchBookings()
  }, [filter])

  const fetchBookings = async () => {
    setIsLoading(true)
    try {
      const url = filter === 'all' ? '/api/bookings' : `/api/bookings?status=${filter}`
      const response = await axios.get(url)
      setBookings(response.data.data.bookings)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Failed to fetch bookings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    setIsCancelling(true)
    try {
      await axios.put(`/api/bookings/${bookingId}/cancel`, {
        reason: 'Cancelled by user'
      })
      
      toast.success('Booking cancelled successfully')
      fetchBookings()
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to cancel booking'
      toast.error(message)
    } finally {
      setIsCancelling(false)
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

  const canCancelBooking = (booking) => {
    if (booking.status !== 'confirmed') return false
    return canBookSlot(booking.bookingDate, booking.slot?.startTime)
  }

  const filters = [
    { value: 'all', label: 'All Bookings' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">
            View and manage your swimming pool bookings.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {filters.map((filterOption) => (
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
            <p className="text-gray-600 mt-4">Loading your bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="card p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Found</h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all' 
                ? "You haven't made any bookings yet."
                : `No ${filter} bookings found.`
              }
            </p>
            <a
              href="/book-slot"
              className="btn btn-primary"
            >
              Book a Slot
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="card p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        {booking.isRaisingCourt ? (
                          <Timer className="w-6 h-6 text-primary-600" />
                        ) : (
                          <Pool className="w-6 h-6 text-primary-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formatDate(booking.slot?.date)} - {booking.slot?.startTime}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {booking.slot?.gender} • {booking.isRaisingCourt ? 'Raising Court' : 'Swimming Pool'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">Date:</span>
                        <span className="ml-2 font-medium">{formatDate(booking.slot?.date)}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">Time:</span>
                        <span className="ml-2 font-medium">{booking.slot?.startTime} - {booking.slot?.endTime}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Users className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">Gender:</span>
                        <span className="ml-2 font-medium capitalize">{booking.slot?.gender}</span>
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {booking.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center space-x-4">
                      <span className={`badge ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                      <span className="text-sm text-gray-500">
                        Booked {getRelativeDate(booking.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 mt-4 lg:mt-0 lg:ml-6">
                    {booking.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => handleCancelBooking(booking._id)}
                          disabled={!canCancelBooking(booking) || isCancelling}
                          className="btn btn-outline btn-sm text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </button>
                        <button
                          onClick={() => {/* TODO: Implement QR code view */}}
                          className="btn btn-outline btn-sm"
                        >
                          <QrCode className="w-4 h-4 mr-1" />
                          View QR
                        </button>
                      </>
                    )}
                    
                    {booking.status === 'completed' && (
                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Completed
                      </div>
                    )}
                    
                    {booking.status === 'cancelled' && (
                      <div className="flex items-center text-sm text-red-600">
                        <X className="w-4 h-4 mr-1" />
                        Cancelled
                      </div>
                    )}
                  </div>
                </div>

                {/* Booking Details */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Booking ID:</span>
                      <span className="ml-2 font-mono text-gray-900">{booking._id.slice(-8)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="ml-2 text-gray-900">{booking.isRaisingCourt ? 'Raising Court' : 'Swimming Pool'}</span>
                    </div>
                    {booking.checkedIn && (
                      <div>
                        <span className="text-gray-600">Checked In:</span>
                        <span className="ml-2 text-green-600">
                          {new Date(booking.checkedInAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {booking.checkedOutAt && (
                      <div>
                        <span className="text-gray-600">Checked Out:</span>
                        <span className="ml-2 text-gray-900">
                          {new Date(booking.checkedOutAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyBookings
