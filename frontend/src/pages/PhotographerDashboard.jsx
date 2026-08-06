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

        // Filter events based on logged-in photographer's registered/assigned events
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
      <div className="max-w-screen-lg mx-auto px-4 pb-12">
        <div className="py-6 md:py-8 border-b border-[#E5E7EB]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className="inline-flex items-center gap-1.5 text-[10px] font-bib uppercase tracking-widest text-blue-600 bg-blue-50 border-blue-200 px-3 py-1 rounded-full"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Fotografer
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#111827] tracking-tight">
                Dashboard Fotografer
              </h1>
              <p className="text-sm text-[#4B5563] mt-1">
                Selamat datang,{" "}
                <span className="font-semibold text-[#111827]">
                  {currentUser?.name}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0 self-start md:self-auto">
              {events.length > 1 && (
                <div className="flex items-center gap-2 bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-2xl shadow-sm">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-semibold text-xs text-gray-500 shrink-0">Event:</span>
                  <Select
                    value={selectedEventId}
                    onValueChange={setSelectedEventId}
                  >
                    <SelectTrigger className="h-7 border-0 bg-transparent text-xs font-bold text-[#111827] px-1 focus:ring-0 shadow-none gap-2">
                      <SelectValue>
                        {events.find((e) => String(e.id) === String(selectedEventId))?.title ||
                          events.find((e) => String(e.id) === String(selectedEventId))?.name ||
                          "Pilih Event"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-1 z-50">
                      {events.map((evt) => (
                        <SelectItem
                          key={evt.id}
                          value={String(evt.id)}
                          className="hover:bg-blue-50 text-xs py-2 px-3 rounded-xl cursor-pointer text-[#111827]"
                        >
                          {evt.title || evt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {events.length === 1 && (
                <div className="inline-flex items-center gap-2 bg-white border border-[#E5E7EB] px-3.5 py-2 rounded-2xl shadow-sm text-xs font-medium text-[#111827]">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-gray-500 font-normal">Event:</span>
                  <span className="font-bold text-[#111827]">
                    {events[0].title || events[0].name}
                  </span>
                </div>
              )}

              <div className="text-right shrink-0 bg-white border border-[#E5E7EB] rounded-2xl px-3.5 py-1.5 shadow-sm">
                <p className="text-xl font-bold text-[#111827] font-bib">
                  {uploadedCount}
                </p>
                <p className="text-[10px] text-[#4B5563]">foto diupload</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mt-5 mb-6 bg-[#F3F4F6] p-1 rounded-2xl">
          {tabs.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              id={`tab-${id}`}
              variant="ghost"
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-bold transition-all ${
                activeTab === id
                  ? "bg-white text-[#111827] shadow-md"
                  : "text-[#4B5563] hover:text-[#111827]"
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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
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
