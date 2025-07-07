import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  X,
  Calendar,
  User,
  Briefcase,
} from 'lucide-react';


interface Booking {
  id: number;
  title: string;
  room: string;
  startTime: string;
  endTime: string;
  date: string;
  attendees: number;
  status: string;
  color: string;
  username?: string;
  department?: string;
  userId?: number;
}

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedBookings, setSelectedBookings] = useState<Booking[]>([]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/calendarview');
      if (res.ok) {
        const data = await res.json();
        setBookings(Array.isArray(data) ? data.map((b: Booking) => ({
          ...b,
          date: new Date(b.date).toLocaleDateString('sv-SE'), // local YYYY-MM-DD
        })) : []);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
  };

  const formatDate = (date: Date) => date.toLocaleDateString('sv-SE'); // local YYYY-MM-DD

  const formatDateThai = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getBookingsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return bookings.filter(b => b.date === dateStr);
  };

  const handleDayClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = formatDate(date);
    setSelectedDate(dateStr);
    setSelectedBookings(getBookingsForDate(date));
    setShowPopup(true);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
    return days;
  };

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getTodayBookings = () => {
    const todayStr = formatDate(new Date());
    return bookings.filter(booking => booking.date === todayStr);
  };

  const todayBookings = getTodayBookings();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-white/20 backdrop-blur-sm p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white">
                  <Calendar size={24} />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Calendar
                </h1>
              </div>
              <div className="h-8 w-px bg-gray-300"></div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => navigateMonth(-1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="text-gray-600" size={20} />
                </button>
                <span className="text-xl font-semibold text-gray-800 min-w-[200px] text-center">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
                <button 
                  onClick={() => navigateMonth(1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="text-gray-600" size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-white/20 backdrop-blur-sm p-6">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {weekDays.map(day => (
                  <div key={day} className="text-center font-semibold text-gray-600 bg-gray-50 py-3 rounded-lg">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {getDaysInMonth(currentDate).map((day, idx) => (
                  <div 
                    key={idx} 
                    className={`border-2 h-32 p-2 cursor-pointer transition-all duration-200 rounded-xl ${
                      day ? 'hover:bg-blue-50 hover:border-blue-200 hover:shadow-md' : ''
                    } ${isToday(day || 0) ? 'bg-blue-100 border-blue-300' : 'border-gray-100'}`}
                    onClick={() => day && handleDayClick(day)}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-bold mb-1 ${
                          isToday(day) ? 'text-blue-600' : 'text-gray-800'
                        }`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {getBookingsForDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day)).slice(0, 2).map(b => (
                            <div 
                              key={b.id} 
                              className={`text-xs p-1.5 rounded-md text-white truncate shadow-sm ${b.color}`} 
                              title={b.title}
                            >
                              {b.title}
                            </div>
                          ))}
                          {getBookingsForDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day)).length > 2 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{getBookingsForDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day)).length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Today's Bookings Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-white/20 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white">
                  <Clock size={20} />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Today's Bookings</h3>
                <span className="text-sm text-gray-500">
                  ({new Date().toLocaleDateString('en-GB')})
                </span>
              </div>
              
              <div className="space-y-3">
                {todayBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <Calendar size={48} className="mx-auto" />
                    </div>
                    <p className="text-gray-500">No bookings today</p>
                  </div>
                ) : todayBookings.map(b => (
                  <div key={b.id} className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-800">{b.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(b.status)}`}>
                        {b.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User size={14} />
                        <span>{b.username}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase size={14} />
                        <span>{b.department}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span>{b.startTime} - {b.endTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} />
                        <span>{b.room}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} />
                        <span>{b.attendees} people</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Popup */}
        {showPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white p-6 border-b border-gray-100 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">
                    Bookings on {formatDateThai(selectedDate)}
                  </h2>
                  <button 
                    onClick={() => setShowPopup(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {selectedBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <Calendar size={64} className="mx-auto" />
                    </div>
                    <p className="text-gray-500 text-lg">No bookings today</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedBookings.map(b => (
                      <div key={b.id} className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-5 border border-gray-100">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-semibold text-gray-800">{b.title}</h3>
                          <span className={`text-sm px-3 py-1 rounded-full border ${getStatusColor(b.status)}`}>
                            {b.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <User size={16} />
                            <span>By {b.username}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Briefcase size={16} />
                            <span>Department {b.department}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={16} />
                            <span>{b.startTime} - {b.endTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={16} />
                            <span>{b.room}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users size={16} />
                            <span>{b.attendees} people</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;