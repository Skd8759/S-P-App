import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Calendar, Clock, Users, Plus, Edit, Trash2 } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import { formatDate } from '../../utils/dateUtils'

const AdminSlots = () => {
  const [slots, setSlots] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')

  useEffect(() => {
    fetchSlots()
  }, [])

  const fetchSlots = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get('/api/slots')
      setSlots(response.data.data.slots)
    } catch (error) {
      console.error('Error fetching slots:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateDefaultSlots = async () => {
    if (!selectedDate) return

    try {
      await axios.post('/api/admin/slots/create-default', {
        date: selectedDate
      })
      fetchSlots()
      setShowCreateModal(false)
    } catch (error) {
      console.error('Error creating default slots:', error)
    }
  }

  const getGenderColor = (gender) => {
    return gender === 'male' ? 'badge-default' : 'badge-secondary'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Slots</h1>
              <p className="text-gray-600 mt-2">
                Create and manage swimming pool time slots.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Default Slots
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="card p-12 text-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 mt-4">Loading slots...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {slots.map((slot) => (
              <div key={slot._id} className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-primary-600" />
                    <span className="font-semibold text-gray-900">
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                  <span className={`badge ${getGenderColor(slot.gender)}`}>
                    {slot.gender}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{formatDate(slot.date)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-medium">{slot.currentBookings}/{slot.maxCapacity}</span>
                  </div>

                  {slot.isRaisingCourt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Raising Court:</span>
                      <span className="font-medium">{slot.raisingCourtBookings}/{slot.raisingCourtCapacity}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className={`badge ${slot.isActive ? 'badge-success' : 'badge-error'}`}>
                      {slot.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4">
                  <button className="btn btn-outline btn-sm flex-1">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                  <button className="btn btn-outline btn-sm text-red-600 border-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Default Slots Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Default Slots</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Default Slots:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 5:00 AM - 6:00 AM (Male)</li>
                  <li>• 6:00 AM - 7:00 AM (Female)</li>
                  <li>• 7:00 AM - 8:00 AM (Male)</li>
                  <li>• 8:00 AM - 9:00 AM (Female)</li>
                  <li>• 4:00 PM - 5:00 PM (Male)</li>
                  <li>• 5:00 PM - 7:00 PM (Female)</li>
                  <li>• 7:00 PM - 8:00 PM (Male)</li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDefaultSlots}
                  disabled={!selectedDate}
                  className="btn btn-primary flex-1"
                >
                  Create Slots
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminSlots
