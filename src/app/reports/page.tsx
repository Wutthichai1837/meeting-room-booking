"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FileText,
  DoorOpen,
  Clock4,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  MapPin,
  Users,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Booking {
  id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  attendees_count: number;
  status: string;
  created_at: string;
  updated_at: string;
  username: string;
  room_name: string;
  user?: {
    username: string;
  };
  room?: {
    name: string;
    location: string;
  };
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchBookings();
  }, [currentPage, searchTerm, filterStatus]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/bookings", {
        params: {
          page: currentPage,
          limit: 100,
          search: searchTerm,
        },
      });
      const bookingsData: Booking[] = res.data.success ? res.data.data || [] : [];
      let filtered = bookingsData;
      if (filterStatus !== "all") {
        filtered = bookingsData.filter((item) => item.status === filterStatus);
      }
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setBookings(filtered);

      if (res.data.success && res.data.data?.pagination) {
        setPagination(res.data.data.pagination);
      }

      setError(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTimeRange = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const isSameDay = start.toDateString() === end.toDateString();
    if (isSameDay) {
      return `${start.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })} ${start.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      })} - ${end.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return `${start.toLocaleString("th-TH")} - ${end.toLocaleString("th-TH")}`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "approved":
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setCurrentPage(1); fetchBookings(); };
  const handleRefresh = () => { setCurrentPage(1); fetchBookings(); };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bookings</h1>
          <p className="text-gray-600">View all confirmed and cancelled bookings.</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search bookings"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left font-medium text-gray-900">Title</th>
                  <th className="px-6 py-4 text-left font-medium text-gray-900">Room</th>
                  <th className="px-6 py-4 text-left font-medium text-gray-900">Create By</th>
                  <th className="px-6 py-4 text-left font-medium text-gray-900">DateTime</th>
                  <th className="px-6 py-4 text-left font-medium text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="w-8 h-8 text-gray-400" />
                        <p>No bookings found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  bookings.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{item.title}</div>
                        {item.description && (
                          <div className="text-sm text-gray-500 mt-1">{item.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <DoorOpen className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">{item.room?.name || item.room_name}</div>
                            {item.room?.location && (
                              <div className="text-sm text-gray-500">{item.room.location}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{item.user?.username || item.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock4 className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{formatDateTimeRange(item.start_time, item.end_time)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          {getStatusText(item.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              แสดง {((currentPage - 1) * pagination.limit) + 1} ถึง {Math.min(currentPage * pagination.limit, pagination.totalRecords)} 
              จากทั้งหมด {pagination.totalRecords} รายการ
            </div>
            <div className="flex gap-2">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1} className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => handlePageChange(page)} className={`px-3 py-1 rounded ${currentPage === page ? 'bg-blue-600 text-white' : 'border hover:bg-gray-50'}`}>
                  {page}
                </button>
              ))}
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= pagination.totalPages} className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}