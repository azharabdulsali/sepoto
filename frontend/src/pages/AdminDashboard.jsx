import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CheckCircle2,
  Users,
  Settings,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

// Import Modular Admin Tab Components
import OverviewTab from "../components/admin/OverviewTab";
import TransactionsTab from "../components/admin/TransactionsTab";
import ParticipantsTab from "../components/admin/ParticipantsTab";
import EventSettingsTab from "../components/admin/EventSettingsTab";
import AdminPhotosTab from "../components/admin/AdminPhotosTab";

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "super_admin";
  const [activeTab, setActiveTab] = useState("overview");
  const [transactions, setTransactions] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventFilter, setSelectedEventFilter] = useState(
    currentUser?.role === "admin" && currentUser?.eventId
      ? String(currentUser.eventId)
      : "all",
  );

  const [photographers, setPhotographers] = useState([]);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.getAllEvents();
      if (res.success && res.events) {
        setEvents(res.events);
      }
    } catch (err) {
      console.error("Fetch events error:", err);
    }
  }, []);

  const fetchPhotographers = useCallback(async () => {
    try {
      const res = await api.getAllUsers("all");
      if (res.success && Array.isArray(res.users)) {
        const photoUsers = res.users.filter((u) => u.role === "photographer");
        setPhotographers(photoUsers);
      }
    } catch (err) {
      console.error("Fetch photographers error:", err);
    }
  }, []);

  const [loadingTx, setLoadingTx] = useState(true);

  const fetchTransactions = useCallback(async () => {
    setLoadingTx(true);
    try {
      const res = await api.getTransactions(selectedEventFilter);
      if (res.success && Array.isArray(res.transactions)) {
        setTransactions(res.transactions);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error("Fetch transactions error:", err);
      setTransactions([]);
    } finally {
      setLoadingTx(false);
    }
  }, [selectedEventFilter]);

  useEffect(() => {
    fetchEvents();
    fetchPhotographers();
  }, [fetchEvents, fetchPhotographers]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleUpdateStatus = (id, newStatus) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: newStatus,
              approvedByName: currentUser?.name || "Admin",
              approvedByRole: currentUser?.role || "admin",
            }
          : t,
      ),
    );
  };

  const tabs = isSuperAdmin
    ? [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "payments", label: "Pembayaran", icon: CheckCircle2 },
        { id: "photos", label: "Kelola Foto", icon: Camera },
        { id: "participants", label: "Pengguna", icon: Users },
        { id: "settings", label: "Event", icon: Settings },
      ]
    : [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "payments", label: "Pembayaran", icon: CheckCircle2 },
        { id: "participants", label: "Pengguna", icon: Users },
        { id: "settings", label: "Event", icon: Settings },
      ];

  const pendingCount = transactions.filter(
    (t) => t.status === "pending",
  ).length;

  const currentEventTitle = events.find(
    (e) => String(e.id) === String(selectedEventFilter),
  )?.title;

  return (
    <AppShell>
      <div className="max-w-screen-lg mx-auto px-4 pb-12 font-sans antialiased">
        <div className="py-6 md:py-8 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Badge
              variant="outline"
              className={`inline-flex items-center gap-1.5 text-[10px] font-bib uppercase tracking-widest px-3 py-1 rounded-full mb-2 font-semibold ${
                isSuperAdmin
                  ? "text-purple-700 bg-purple-50 border-purple-200"
                  : "text-amber-700 bg-amber-50 border-amber-200"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              {isSuperAdmin ? "Super Admin" : "Event Admin"}
            </Badge>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-sm text-[#475569] mt-1">
              Selamat datang,{" "}
              <span className="font-semibold text-[#0F172A]">
                {currentUser?.name}
              </span>
            </p>
          </div>

          {/* Global Event Scoping Filter */}
          <div className="bg-[#FAFBFD] border border-[#E2E8F0] rounded-2xl p-3 flex items-center gap-3 shadow-xs">
            <Settings className="w-4 h-4 text-brand shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bib uppercase tracking-wider text-slate-500 font-bold">
                Event Terpilih:
              </span>
              {isSuperAdmin ? (
                <Select
                  value={String(selectedEventFilter)}
                  onValueChange={(val) => setSelectedEventFilter(val)}
                >
                  <SelectTrigger className="!h-8 border-0 bg-transparent p-0 text-xs font-bold text-[#0F172A] shadow-none focus:ring-0">
                    <SelectValue placeholder="Pilih Event...">
                      {selectedEventFilter === "all"
                        ? "Semua Event"
                        : events.find(
                            (e) => String(e.id) === String(selectedEventFilter),
                          )?.title || "Pilih Event..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E2E8F0] rounded-xl shadow-lg z-50">
                    <SelectGroup>
                      <SelectItem value="all">
                        Semua Event ({events.length})
                      </SelectItem>
                      {events.map((ev) => (
                        <SelectItem key={ev.id} value={String(ev.id)}>
                          {ev.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-xs font-bold text-brand truncate max-w-[200px]">
                  {currentEventTitle || `Event #${currentUser?.eventId || 1}`}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 mb-6">
          <div
            className={`flex overflow-x-auto no-scrollbar gap-1 p-1 bg-[#F1F5F9] rounded-2xl w-full sm:grid ${isSuperAdmin ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}
          >
            {tabs.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                id={`admin-tab-${id}`}
                variant="ghost"
                onClick={() => setActiveTab(id)}
                className={`relative flex items-center justify-center gap-1.5 px-3 sm:px-4 h-12 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 sm:shrink min-h-[48px] ${
                  activeTab === id
                    ? "bg-white text-[#0F172A] shadow-xs"
                    : "text-[#475569] hover:text-[#0F172A]"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap sm:truncate">{label}</span>
                {id === "payments" && pendingCount > 0 && (
                  <Badge className="bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full p-0 flex items-center justify-center border-0 shrink-0">
                    {pendingCount}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "overview" && (
              <OverviewTab
                transactions={transactions}
                events={events}
                photographers={photographers}
                selectedEventFilter={selectedEventFilter}
                onEventFilterChange={(val) => setSelectedEventFilter(val)}
                onUpdateStatus={handleUpdateStatus}
              />
            )}
            {activeTab === "payments" && (
              <TransactionsTab
                transactions={transactions}
                loading={loadingTx}
                onUpdateStatus={handleUpdateStatus}
                events={events}
                photographers={photographers}
                selectedEventFilter={selectedEventFilter}
                onEventFilterChange={(val) => setSelectedEventFilter(val)}
              />
            )}
            {activeTab === "photos" && isSuperAdmin && (
              <AdminPhotosTab
                events={events}
                photographers={photographers}
                selectedEventFilter={selectedEventFilter}
                onEventFilterChange={(val) => setSelectedEventFilter(val)}
              />
            )}
            {activeTab === "participants" && (
              <ParticipantsTab
                events={events}
                selectedEventFilter={selectedEventFilter}
                onEventFilterChange={(val) => setSelectedEventFilter(val)}
              />
            )}
            {activeTab === "settings" && (
              <EventSettingsTab events={events} onRefreshEvents={fetchEvents} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
