import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Calendar, 
  Clock, 
  Users, 
  Shield, 
  CheckCircle, 
  ArrowRight,
  Pool,
  Timer,
  UserCheck
} from 'lucide-react'

const Home = () => {
  const { isAuthenticated, user } = useAuth()

  const features = [
    {
      icon: Calendar,
      title: 'Easy Booking',
      description: 'Book your swimming pool slots with just a few clicks. Available 24/7 online booking system.'
    },
    {
      icon: Clock,
      title: 'Flexible Timings',
      description: 'Multiple time slots available throughout the day for both male and female swimmers.'
    },
    {
      icon: Users,
      title: 'Fair Access',
      description: 'Equal opportunity for all NITK students and staff to access the swimming pool facilities.'
    },
    {
      icon: Shield,
      title: 'Secure System',
      description: 'Email verification and secure authentication ensure only authorized users can book slots.'
    }
  ]

  const slotTimings = [
    { time: '5:00 AM - 6:00 AM', gender: 'Male', capacity: '40' },
    { time: '6:00 AM - 7:00 AM', gender: 'Female', capacity: '40' },
    { time: '7:00 AM - 8:00 AM', gender: 'Male', capacity: '40' },
    { time: '8:00 AM - 9:00 AM', gender: 'Female', capacity: '40' },
    { time: '4:00 PM - 5:00 PM', gender: 'Male', capacity: '40' },
    { time: '5:00 PM - 7:00 PM', gender: 'Female', capacity: '40' },
    { time: '7:00 PM - 8:00 PM', gender: 'Male', capacity: '40' },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              NITK Swimming Pool
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Book your swimming slots with ease and convenience
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/book-slot"
                    className="btn btn-lg bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Book a Slot
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                  <Link
                    to="/my-bookings"
                    className="btn btn-lg border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    My Bookings
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="btn btn-lg bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Get Started
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                  <Link
                    to="/login"
                    className="btn btn-lg border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our System?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the most convenient and fair way to book swimming pool slots at NITK
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Slot Timings Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pool Timings & Capacity
            </h2>
            <p className="text-xl text-gray-600">
              Check out our daily slot timings and capacity limits
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {slotTimings.map((slot, index) => (
              <div key={index} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Timer className="w-5 h-5 text-primary-600" />
                    <span className="font-semibold text-gray-900">{slot.time}</span>
                  </div>
                  <span className={`badge ${
                    slot.gender === 'Male' ? 'badge-default' : 'badge-secondary'
                  }`}>
                    {slot.gender}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>Capacity: {slot.capacity} people</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to book your swimming pool slot
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Register & Verify
              </h3>
              <p className="text-gray-600">
                Create your account with your NITK email and verify it with the OTP sent to your email.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Choose Your Slot
              </h3>
              <p className="text-gray-600">
                Browse available slots, select your preferred date and time, and make your booking.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Enjoy Swimming
              </h3>
              <p className="text-gray-600">
                Arrive on time, check in with your booking, and enjoy your swimming session.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-16 bg-primary-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Swimming?
            </h2>
            <p className="text-xl mb-8 text-primary-100">
              Join thousands of NITK students and staff who use our booking system
            </p>
            <Link
              to="/register"
              className="btn btn-lg bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Register Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}

export default Home
