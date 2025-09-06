import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Calendar, Clock, Users, Pool, Timer, CheckCircle, AlertCircle } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatDate, getRelativeDate, canBookSlot } from '../utils/dateUtils'
import { getNextNDays } from '../utils/dateUtils'

const BookSlot = () => {
  const [selectedDate, setSelectedDate] = useState('')
  const [slots, setSlots] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingType, setBookingType] = useState('swimming')

  const availableDates = getNextNDays(7)

  useEffect(() => {
    if (selectedDate) {
      fetchSlots()
    }
  }, [selectedDate])

  const fetchSlots = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`/api/slots?date=${selectedDate}`)
      setSlots(response.data.data.slots)
    } catch (error) {
      console.error('Error fetching slots:', error)
      toast.error('Failed to fetch available slots')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBookSlot = async () => {
    if (!selectedSlot) return

    setIsBooking(true)
    try {
      const response = await axios.post('/api/bookings', {
        slotId: selectedSlot._id,
        bookingDate: selectedDate,
        isRaisingCourt: bookingType === 'raising-court'
      })

      toast.success('Slot booked successfully!')
      setShowBookingModal(false)
      setSelectedSlot(null)
      fetchSlots() // Refresh slots
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to book slot'
      toast.error(message)
    } finally {
      setIsBooking(false)
    }
  }

  const openBookingModal = (slot) => {
    setSelectedSlot(slot)
    setShowBookingModal(true)
  }

  const getSlotStatus = (slot) => {
    if (!canBookSlot(selectedDate, slot.startTime)) {
      return { status: 'expired', text: 'Booking closed', color: 'text-red-600' }
    }
    
    if (slot.currentBookings >= slot.maxCapacity) {
      return { status: 'full', text: 'Full', color: 'text-red-600' }
    }
    
    if (slot.currentBookings >= slot.maxCapacity * 0.8) {
      return { status: 'almost-full', text: 'Almost full', color: 'text-yellow-600' }
    }
    
    return { status: 'available', text: 'Available', color: 'text-green-600' }
  }

  const getRaisingCourtStatus = (slot) => {
    if (!slot.isRaisingCourt) {
      return { status: 'not-available', text: 'Not available', color: 'text-gray-500' }
    }
    
    if (slot.raisingCourtBookings >= slot.raisingCourtCapacity) {
      return { status: 'full', text: 'Full', color: 'text-red-600' }
    }
    
    return { status: 'available', text: 'Available', color: 'text-green-600' }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Book a Swimming Pool Slot</h1>
          <p className="text-gray-600 mt-2">
            Select your preferred date and time slot for swimming.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Date Selection */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Date</h3>
              <div className="space-y-2">
                {availableDates.map((date) => (
                  <button
                    key={date.toISOString().split('T')[0]}
                    onClick={() => setSelectedDate(date.toISOString().split('T')[0])}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedDate === date.toISOString().split('T')[0]
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <div>
                        <p className="font-medium">{getRelativeDate(date)}</p>
                        <p className="text-sm text-gray-500">{formatDate(date, 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Available Slots */}
          <div className="lg:col-span-3">
            {!selectedDate ? (
              <div className="card p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Date</h3>
                <p className="text-gray-600">Choose a date from the calendar to view available slots.</p>
              </div>
            ) : isLoading ? (
              <div className="card p-12 text-center">
                <LoadingSpinner size="lg" />
                <p className="text-gray-600 mt-4">Loading available slots...</p>
              </div>
            ) : slots.length === 0 ? (
              <div className="card p-12 text-center">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Slots Available</h3>
                <p className="text-gray-600">No slots are available for the selected date.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Available Slots for {formatDate(selectedDate)}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {slots.map((slot) => {
                    const slotStatus = getSlotStatus(slot)
                    const raisingCourtStatus = getRaisingCourtStatus(slot)
                    const canBook = slotStatus.status === 'available' || raisingCourtStatus.status === 'available'
                    
                    return (
                      <div key={slot._id} className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-5 h-5 text-primary-600" />
                            <span className="font-semibold text-gray-900">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                          <span className={`badge ${
                            slot.gender === 'male' ? 'badge-default' : 'badge-secondary'
                          }`}>
                            {slot.gender}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {/* Swimming Pool */}
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Pool className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-gray-900">Swimming Pool</span>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-medium ${slotStatus.color}`}>
                                {slotStatus.text}
                              </p>
                              <p className="text-xs text-gray-500">
                                {slot.currentBookings}/{slot.maxCapacity} booked
                              </p>
                            </div>
                          </div>

                          {/* Raising Court */}
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Timer className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-gray-900">Raising Court</span>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-medium ${raisingCourtStatus.color}`}>
                                {raisingCourtStatus.text}
                              </p>
                              {slot.isRaisingCourt && (
                                <p className="text-xs text-gray-500">
                                  {slot.raisingCourtBookings}/{slot.raisingCourtCapacity} booked
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => openBookingModal(slot)}
                          disabled={!canBook}
                          className={`w-full mt-4 btn ${
                            canBook ? 'btn-primary' : 'btn-secondary'
                          }`}
                        >
                          {canBook ? 'Book Slot' : 'Not Available'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Booking</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Date & Time</span>
                  <span className="text-sm text-gray-600">
                    {formatDate(selectedDate)} - {selectedSlot.startTime}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Gender</span>
                  <span className="text-sm text-gray-600 capitalize">{selectedSlot.gender}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Duration</span>
                  <span className="text-sm text-gray-600">1 hour</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="bookingType"
                      value="swimming"
                      checked={bookingType === 'swimming'}
                      onChange={(e) => setBookingType(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">Swimming Pool</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="bookingType"
                      value="raising-court"
                      checked={bookingType === 'raising-court'}
                      onChange={(e) => setBookingType(e.target.value)}
                      className="mr-2"
                      disabled={!selectedSlot.isRaisingCourt}
                    />
                    <span className="text-sm">Raising Court</span>
                    {!selectedSlot.isRaisingCourt && (
                      <span className="text-xs text-gray-500 ml-1">(Not available)</span>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowBookingModal(false)}
                className="btn btn-outline flex-1"
                disabled={isBooking}
              >
                Cancel
              </button>
              <button
                onClick={handleBookSlot}
                disabled={isBooking}
                className="btn btn-primary flex-1"
              >
                {isBooking ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Booking...
                  </div>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookSlot
