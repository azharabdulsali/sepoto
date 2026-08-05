import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloudUpload, Image as ImageIcon, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

import UploadTab from "../components/photographer/UploadTab";
import MyPhotosTab from "../components/photographer/MyPhotosTab";

export default function PhotographerDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedCount, setUploadedCount] = useState(0);

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
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge
                variant="outline"
                className="inline-flex items-center gap-1.5 text-[10px] font-bib uppercase tracking-widest text-blue-600 bg-blue-50 border-blue-200 px-3 py-1 rounded-full mb-2"
              >
                <Camera className="w-3.5 h-3.5" />
                Fotografer
              </Badge>
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
            <div className="text-right shrink-0 bg-white border border-[#E5E7EB] rounded-2xl px-3.5 py-1.5 shadow-sm">
              <p className="text-xl font-bold text-[#111827] font-bib">
                {uploadedCount}
              </p>
              <p className="text-[10px] text-[#4B5563]">foto diupload</p>
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
              <UploadTab onUploadSuccess={fetchUploadedCount} />
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
