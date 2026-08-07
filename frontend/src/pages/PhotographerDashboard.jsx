import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloudUpload, Image as ImageIcon, Camera, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

import UploadTab from "../components/photographer/UploadTab";
import MyPhotosTab from "../components/photographer/MyPhotosTab";

export default function PhotographerDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedCount, setUploadedCount] = useState(0);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");

  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.getAllEvents();
      if (res.success && res.events) {
        let photographerEvents = res.events;

        if (currentUser?.availableEvents && currentUser.availableEvents.length > 0) {
          const allowedIds = currentUser.availableEvents.map((evt) =>
            String(evt.eventId || evt.id || evt)
          );
          photographerEvents = res.events.filter((evt) =>
            allowedIds.includes(String(evt.id))
          );
        } else if (currentUser?.eventId) {
          photographerEvents = res.events.filter(
            (evt) => String(evt.id) === String(currentUser.eventId)
          );
        }

        setEvents(photographerEvents);

        if (photographerEvents.length > 0) {
          const exists = photographerEvents.some(
            (e) => String(e.id) === String(selectedEventId)
          );
          if (!selectedEventId || !exists) {
            setSelectedEventId(String(photographerEvents[0].id));
          }
        }
      }
    } catch (err) {
      console.error("Fetch events error:", err);
    }
  }, [selectedEventId, currentUser]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const fetchUploadedCount = useCallback(async () => {
    try {
      const res = await api.getMyPhotos();
      if (res.success && res.photos) {
        setUploadedCount(res.photos.length);
      } else {
        setUploadedCount(0);
      }
    } catch (err) {
      console.error("Fetch uploaded count error:", err);
      setUploadedCount(0);
    }
  }, []);

  useEffect(() => {
    fetchUploadedCount();
  }, [fetchUploadedCount]);

  const tabs = [
    { id: "upload", label: "Upload Foto", icon: CloudUpload },
    { id: "manage", label: "Kelola Foto", icon: ImageIcon },
  ];

  return (
    <AppShell>
      <div className="max-w-screen-lg mx-auto px-4 pb-12 font-sans antialiased">
        <div className="py-6 md:py-8 border-b border-[#E2E8F0]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className="inline-flex items-center gap-1.5 text-[10px] font-bib uppercase tracking-widest text-blue-700 bg-blue-50 border-blue-200 px-3 py-1 rounded-full font-semibold"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Fotografer Official
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                Dashboard Fotografer
              </h1>
              <p className="text-sm text-[#475569] mt-1">
                Selamat datang,{" "}
                <span className="font-semibold text-[#0F172A]">
                  {currentUser?.name}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0 self-start md:self-auto">
              {events.length > 1 && (
                <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] px-3 py-1.5 rounded-2xl shadow-xs">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-semibold text-xs text-slate-500 shrink-0">Event:</span>
                  <Select
                    value={selectedEventId}
                    onValueChange={setSelectedEventId}
                  >
                    <SelectTrigger className="h-8 border-0 bg-transparent text-xs font-bold text-[#0F172A] px-1 focus:ring-0 shadow-none gap-2">
                      <SelectValue>
                        {events.find((e) => String(e.id) === String(selectedEventId))?.title ||
                          events.find((e) => String(e.id) === String(selectedEventId))?.name ||
                          "Pilih Event"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-[#E2E8F0] rounded-2xl shadow-lg p-1 z-50">
                      {events.map((evt) => (
                        <SelectItem
                          key={evt.id}
                          value={String(evt.id)}
                          className="hover:bg-blue-50 text-xs py-2.5 px-3 rounded-xl cursor-pointer text-[#0F172A]"
                        >
                          {evt.title || evt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {events.length === 1 && (
                <div className="inline-flex items-center gap-2 bg-white border border-[#E2E8F0] px-3.5 py-2 rounded-2xl shadow-xs text-xs font-medium text-[#0F172A]">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-slate-500 font-normal">Event:</span>
                  <span className="font-bold text-[#0F172A]">
                    {events[0].title || events[0].name}
                  </span>
                </div>
              )}

              <div className="text-right shrink-0 bg-white border border-[#E2E8F0] rounded-2xl px-3.5 py-1.5 shadow-xs">
                <p className="text-xl font-extrabold text-[#0F172A] font-bib">
                  {uploadedCount}
                </p>
                <p className="text-[10px] text-[#475569] font-medium">foto diupload</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mt-5 mb-6 bg-[#F1F5F9] p-1 rounded-2xl">
          {tabs.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              id={`tab-${id}`}
              variant="ghost"
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 min-h-[48px] h-12 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === id
                  ? "bg-white text-[#0F172A] shadow-xs"
                  : "text-[#475569] hover:text-[#0F172A]"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </Button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "upload" ? (
              <UploadTab onUploadSuccess={fetchUploadedCount} selectedEventId={selectedEventId} />
            ) : (
              <MyPhotosTab
                onPhotosChange={(count) => {
                  if (typeof count === "number") {
                    setUploadedCount(count);
                  } else {
                    fetchUploadedCount();
                  }
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
