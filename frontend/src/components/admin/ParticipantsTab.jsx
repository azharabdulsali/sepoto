import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSpreadsheet,
  Upload,
  Download,
  Check,
  X,
  Loader2,
  UserPlus,
  Pencil,
  Trash2,
  User,
  Camera,
  Lock,
  Hash,
  Settings,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

export default function ParticipantsTab({
  events = [],
  selectedEventFilter = "all",
  onEventFilterChange,
}) {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "super_admin";
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const csvRef = useRef(null);
  const [importSuccess, setImportSuccess] = useState("");

  const filteredUsers = users.filter((u) => {
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchRole;

    const matchName = u.name && u.name.toLowerCase().includes(q);
    const matchBib = u.bibNumber && String(u.bibNumber).toLowerCase().includes(q);
    const matchUser = u.username && u.username.toLowerCase().includes(q);

    return matchRole && (matchName || matchBib || matchUser);
  });

  // Shadcn Alert State untuk Feedback Pengguna
  const [actionAlert, setActionAlert] = useState(null);

  // Dialog State untuk Tambah / Edit Pengguna
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null jika Tambah, object jika Edit
  const [addRole, setAddRole] = useState("user"); // 'user' | 'photographer' | 'admin'
  const [formEventId, setFormEventId] = useState("");
  const [formName, setFormName] = useState("");
  const [formBib, setFormBib] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Delete User State
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.getAllUsers(selectedEventFilter);
      if (res.success && res.users) {
        setUsers(res.users);
      }
    } catch (err) {
      console.error("Fetch users error:", err);
    }
  }, [selectedEventFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCsvImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setImportSuccess("");
    await new Promise((r) => setTimeout(r, 1200));
    setIsImporting(false);
    setImportSuccess(
      `File "${file.name}" berhasil diimport. 5 peserta baru ditambahkan.`,
    );
    e.target.value = "";
  };

  const openAddModal = () => {
    setEditingUser(null);
    setAddRole("user");
    setFormEventId(
      isSuperAdmin
        ? selectedEventFilter !== "all"
          ? selectedEventFilter
          : String(events[0]?.id || 1)
        : String(currentUser?.eventId || 1),
    );
    setFormName("");
    setFormBib("");
    setFormUsername("");
    setFormPassword("");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setAddRole(
      u.role === "admin"
        ? "admin"
        : u.role === "photographer"
          ? "photographer"
          : "user",
    );
    setFormEventId(String(u.eventId || events[0]?.id || 1));
    setFormName(u.name || "");
    setFormBib(u.bibNumber !== "-" ? u.bibNumber : "");
    setFormUsername(u.username !== "-" ? u.username : "");
    setFormPassword("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formName.trim()) {
      setFormError("Nama Lengkap wajib diisi.");
      return;
    }

    if (addRole === "user" && !formBib.trim()) {
      setFormError("Nomor BIB wajib diisi untuk peserta.");
      return;
    }

    if (
      (addRole === "photographer" || addRole === "admin") &&
      !editingUser &&
      (!formUsername.trim() || !formPassword)
    ) {
      setFormError(
        `Username dan Password wajib diisi untuk ${addRole === "admin" ? "Event Admin" : "fotografer"} baru.`,
      );
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        role: addRole,
        name: formName.trim(),
        bibNumber: formBib.trim(),
        username: formUsername.trim(),
        password: formPassword,
        eventId: formEventId ? Number(formEventId) : undefined,
      };

      let res;
      if (editingUser) {
        res = await api.updateUser(editingUser.id, payload);
      } else {
        res = await api.createUser(payload);
      }

      if (res.success) {
        loadUsers();
        setIsModalOpen(false);
        setActionAlert({
          type: "success",
          title: editingUser ? "Pengguna Diperbarui!" : "Pengguna Ditambahkan!",
          message: res.message || `Data ${formName.trim()} telah tersimpan.`,
        });
      } else {
        setFormError(res.message || "Gagal menyimpan data pengguna.");
      }
    } catch (err) {
      console.error("Submit user error:", err);
      setFormError("Terjadi kesalahan server saat menyimpan data pengguna.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    setDeletingId(id);
    const targetName = deleteConfirm?.name || "Pengguna";
    try {
      const res = await api.deleteUser(id);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setDeleteConfirm(null);
        setActionAlert({
          type: "success",
          title: "Pengguna Dihapus!",
          message: `Data ${targetName} berhasil dihapus.`,
        });
      } else {
        setActionAlert({
          type: "error",
          title: "Gagal Menghapus!",
          message: res.message || "Tidak dapat menghapus pengguna.",
        });
      }
    } catch (err) {
      console.error("Delete user error:", err);
      setActionAlert({
        type: "error",
        title: "Error Server",
        message: "Terjadi kesalahan saat menghapus pengguna.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Shadcn UI Alert Feedback Notifikasi */}
      {actionAlert && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert
            className={`rounded-2xl p-4 shadow-sm flex items-center justify-between ${
              actionAlert.type === "success"
                ? "bg-green-50 border border-green-200 text-green-900"
                : "bg-red-50 border border-red-200 text-red-900"
            }`}
          >
            <div className="flex items-center gap-3">
              {actionAlert.type === "success" ? (
                <Check className="w-5 h-5 text-green-600 shrink-0" />
              ) : (
                <X className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <div>
                <AlertTitle className="text-xs font-bold">
                  {actionAlert.title}
                </AlertTitle>
                <AlertDescription className="text-xs mt-0.5 opacity-90">
                  {actionAlert.message}
                </AlertDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActionAlert(null)}
              className="h-7 w-7 text-gray-400 hover:text-gray-700 rounded-full shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </Alert>
        </motion.div>
      )}

      <Card className="bg-[#F9FAFB] border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#111827]">
              Import Peserta via CSV/Excel
            </h3>
            <p className="text-xs text-[#4B5563] mt-0.5 leading-relaxed">
              Upload file CSV/Excel dengan kolom:{" "}
              <span className="font-bib text-brand font-bold">
                Nama Lengkap
              </span>{" "}
              dan{" "}
              <span className="font-bib text-brand font-bold">Nomor BIB</span>.
            </p>
          </div>
        </div>

        {importSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold px-4 py-3 rounded-xl mb-3"
          >
            <Check className="w-4 h-4 shrink-0 text-green-600" />
            {importSuccess}
          </motion.div>
        )}

        <div className="flex gap-2.5 flex-wrap">
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              id="import-csv-btn"
              onClick={() => csvRef.current?.click()}
              disabled={isImporting}
              className="bg-brand hover:bg-[#C2410C] text-white text-xs font-bold h-11 px-5 rounded-xl shadow-md shadow-orange-600/20"
            >
              {isImporting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {isImporting ? "Mengimport..." : "Pilih File CSV/Excel"}
            </Button>
          </motion.div>
          <Button
            variant="ghost"
            render={
              <a href="#" onClick={(e) => e.preventDefault()}>
                <Download className="w-4 h-4 mr-1.5" />
                Template CSV
              </a>
            }
            id="download-template"
            className="text-xs font-semibold text-[#4B5563] hover:text-brand px-4 h-11"
          />
          <input
            ref={csvRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="sr-only"
            onChange={handleCsvImport}
          />
        </div>
      </Card>

      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2.5">
          <h3 className="text-sm font-bold text-[#111827]">
            Daftar Pengguna ({filteredUsers.length})
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Bar Input */}
            <div className="relative w-full sm:w-56 shrink-0">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, BIB, username..."
                className="pl-9 pr-7 h-9 border-[#E5E7EB] rounded-xl text-xs bg-white font-medium shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Filter Role */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="!h-9 border-[#E5E7EB] rounded-xl text-xs bg-white font-medium w-[150px] shrink-0 shadow-xs">
                <SelectValue placeholder="Pilih Role...">
                  {roleFilter === "all"
                    ? "Semua Role"
                    : roleFilter === "user"
                      ? "Peserta"
                      : roleFilter === "photographer"
                        ? "Fotografer"
                        : roleFilter === "admin"
                          ? "Event Admin"
                          : "Super Admin"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white border-[#E5E7EB] rounded-xl shadow-lg z-50">
                <SelectGroup>
                  <SelectItem value="all">Semua Role</SelectItem>
                  <SelectItem value="user">Peserta</SelectItem>
                  <SelectItem value="photographer">Fotografer</SelectItem>
                  <SelectItem value="admin">Event Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* Dropdown Filter Event (Super Admin) */}
            {isSuperAdmin && events.length > 0 && (
              <Select
                value={String(selectedEventFilter)}
                onValueChange={(val) => onEventFilterChange(val)}
              >
                <SelectTrigger className="!h-9 border-[#E5E7EB] rounded-xl text-xs bg-white font-medium w-[170px] shrink-0 shadow-xs">
                  <SelectValue placeholder="Pilih Event...">
                    {selectedEventFilter === "all"
                      ? "Semua Event"
                      : events.find(
                          (e) => String(e.id) === String(selectedEventFilter),
                        )?.title || "Pilih Event..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border-[#E5E7EB] rounded-xl shadow-lg z-50">
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
            )}

            <Button
              id="open-add-user-modal"
              onClick={openAddModal}
              size="sm"
              className="bg-[#191C21] hover:bg-[#272B33] text-white text-xs font-bold h-9 px-3.5 rounded-xl shadow-sm shrink-0"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              Tambah Pengguna
            </Button>
          </div>
        </div>

        {/* Mobile View */}
        <div className="sm:hidden space-y-2.5">
          {filteredUsers.length === 0 ? (
            <Card className="bg-white border-[#E5E7EB] rounded-2xl p-6 text-center shadow-sm">
              <p className="text-xs text-gray-500 font-medium">
                Tidak ada pengguna yang cocok dengan pencarian atau filter.
              </p>
            </Card>
          ) : (
            filteredUsers.map((u, i) => (
              <Card
                key={u.id}
                className="bg-white border-[#E5E7EB] rounded-2xl px-3.5 py-3 flex flex-row items-center gap-3 shadow-sm"
              >
                <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-brand">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111827] truncate">
                    {u.name}
                  </p>
                  <p className="text-[11px] font-mono text-[#9CA3AF] truncate">
                    {u.eventTitle || "Semua Event"} ·{" "}
                    {u.role === "user"
                      ? "Peserta"
                      : u.username !== "-"
                        ? `@${u.username}`
                        : ""}
                  </p>
                </div>
                <div className="text-right shrink-0 flex items-center gap-2">
                  <div className="flex flex-col items-end justify-center">
                    {u.role === "user" ? (
                      <>
                        <Badge
                          variant="outline"
                          className="font-bib text-xs font-bold text-brand border-brand/20 bg-brand/10 px-2 py-0.5 mb-0.5"
                        >
                          #{u.bibNumber}
                        </Badge>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                          PESERTA
                        </span>
                      </>
                    ) : (
                      <Badge
                        variant="outline"
                        className={`font-semibold text-[10px] px-2 py-0.5 rounded-full ${
                          u.role === "super_admin"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : u.role === "admin"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {u.role === "super_admin"
                          ? "Super Admin"
                          : u.role === "admin"
                            ? "Event Admin"
                            : "Fotografer"}
                      </Badge>
                    )}
                  </div>

                  {/* Action Icons (Mobile) */}
                  <div className="flex items-center gap-0.5 ml-1">
                    {(isSuperAdmin ||
                      u.id === currentUser?.id ||
                      (u.role !== "admin" && u.role !== "super_admin")) && (
                      <Button
                        onClick={() => openEditModal(u)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-brand hover:bg-orange-50 rounded-lg shrink-0"
                        title="Edit Pengguna"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {u.id !== currentUser?.id &&
                      (isSuperAdmin ||
                        (u.role !== "admin" && u.role !== "super_admin")) && (
                        <Button
                          onClick={() => setDeleteConfirm(u)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Desktop View */}
        <Card className="hidden sm:block bg-white border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="text-left px-5 py-3.5 text-xs font-bib text-[#4B5563] uppercase tracking-wider font-bold">
                  Nama Lengkap
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-bib text-[#4B5563] uppercase tracking-wider font-bold">
                  Event
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-bib text-[#4B5563] uppercase tracking-wider font-bold">
                  BIB / Username
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-bib text-[#4B5563] uppercase tracking-wider font-bold">
                  Role
                </th>
                <th className="text-right px-5 py-3.5 text-xs font-bib text-[#4B5563] uppercase tracking-wider font-bold">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-xs text-gray-500 font-medium">
                    Tidak ada pengguna yang cocok dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-5 py-3.5 font-bold text-[#111827]">
                    {u.name}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-[#4B5563]">
                    {u.eventTitle || "Semua Event"}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-600">
                    {u.role === "user" ? (
                      <span className="font-bib text-brand font-bold text-sm">
                        #{u.bibNumber}
                      </span>
                    ) : (
                      `@${u.username}`
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs">
                    <Badge
                      variant="outline"
                      className={`font-semibold capitalize px-2.5 py-0.5 rounded-full ${
                        u.role === "super_admin"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : u.role === "admin"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : u.role === "photographer"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {u.role === "super_admin"
                        ? "Super Admin"
                        : u.role === "admin"
                          ? "Event Admin"
                          : u.role === "photographer"
                            ? "Fotografer"
                            : "Peserta"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {(isSuperAdmin ||
                        u.id === currentUser?.id ||
                        (u.role !== "admin" && u.role !== "super_admin")) && (
                        <Button
                          id={`edit-user-${u.id}`}
                          onClick={() => openEditModal(u)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-brand hover:bg-orange-50 rounded-xl"
                          title="Edit Pengguna"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {u.id !== currentUser?.id &&
                        (isSuperAdmin ||
                          (u.role !== "admin" && u.role !== "super_admin")) && (
                          <Button
                            id={`delete-user-${u.id}`}
                            onClick={() => setDeleteConfirm(u)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Dialog Modal: Tambah / Edit Pengguna */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-3">
                <div className="flex items-center gap-2">
                  {editingUser ? (
                    <Pencil className="w-5 h-5 text-brand" />
                  ) : (
                    <UserPlus className="w-5 h-5 text-brand" />
                  )}
                  <h3 className="text-base font-bold text-[#111827]">
                    {editingUser
                      ? `Edit Data: ${editingUser.name}`
                      : "Tambah Pengguna Baru"}
                  </h3>
                </div>
                <Button
                  onClick={() => setIsModalOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Selector Pilihan Role (Peserta, Fotografer, atau Event Admin - Super Admin Only) */}
              <div
                className={`grid ${isSuperAdmin ? "grid-cols-3" : "grid-cols-2"} gap-1.5 bg-[#F3F4F6] p-1.5 rounded-xl`}
              >
                <button
                  type="button"
                  disabled={!!editingUser}
                  onClick={() => setAddRole("user")}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                    addRole === "user"
                      ? "bg-white text-brand shadow-sm font-extrabold"
                      : "text-gray-500 hover:text-gray-700"
                  } ${editingUser ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Peserta</span>
                </button>

                <button
                  type="button"
                  disabled={!!editingUser}
                  onClick={() => setAddRole("photographer")}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                    addRole === "photographer"
                      ? "bg-white text-blue-600 shadow-sm font-extrabold"
                      : "text-gray-500 hover:text-gray-700"
                  } ${editingUser ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Fotografer</span>
                </button>

                {isSuperAdmin && (
                  <button
                    type="button"
                    disabled={!!editingUser}
                    onClick={() => setAddRole("admin")}
                    className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                      addRole === "admin"
                        ? "bg-white text-amber-600 shadow-sm font-extrabold"
                        : "text-gray-500 hover:text-gray-700"
                    } ${editingUser ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </button>
                )}
              </div>

              {formError && (
                <div className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-xl">
                  {formError}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-3.5 pt-1">
                {/* Event Selection Dropdown / Locked Display */}
                {isSuperAdmin ? (
                  events.length > 0 && (
                    <div className="space-y-1">
                      <label className="block text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold">
                        Event Tempat Ditempatkan
                      </label>
                      <Select
                        value={String(formEventId)}
                        onValueChange={(val) => setFormEventId(val)}
                      >
                        <SelectTrigger className="!h-10 w-full border-[#E5E7EB] rounded-xl text-xs bg-white font-medium">
                          <SelectValue placeholder="Pilih Event...">
                            {events.find(
                              (e) => String(e.id) === String(formEventId),
                            )?.title || "Pilih Event..."}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#E5E7EB] rounded-xl shadow-lg z-50">
                          <SelectGroup>
                            {events.map((ev) => (
                              <SelectItem key={ev.id} value={String(ev.id)}>
                                {ev.title}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  )
                ) : (
                  <div className="space-y-1">
                    <label className="block text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold">
                      Event Tempat Ditempatkan (Terkunci)
                    </label>
                    <div className="h-10 w-full border border-[#E5E7EB] bg-[#F9FAFB] rounded-xl text-xs font-bold text-brand px-3.5 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-brand shrink-0" />
                      <span className="truncate">
                        {events.find(
                          (e) => String(e.id) === String(currentUser?.eventId),
                        )?.title || `Event #${currentUser?.eventId || 1}`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Form Field: Nama Lengkap (Selalu Ada) */}
                <div className="space-y-1">
                  <label className="block text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={
                        addRole === "user"
                          ? "Contoh: Budi Santoso"
                          : addRole === "admin"
                            ? "Contoh: Admin Marathon"
                            : "Contoh: Reza Fotografer"
                      }
                      className="pl-9 h-10 text-xs border-[#E5E7EB] rounded-xl"
                    />
                  </div>
                </div>

                {/* Form Fields Khusus Peserta */}
                {addRole === "user" && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold">
                      Nomor BIB
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        required
                        value={formBib}
                        onChange={(e) => setFormBib(e.target.value)}
                        placeholder="Contoh: 101, A101, atau A-101"
                        className="pl-9 h-10 text-xs font-bib border-[#E5E7EB] rounded-xl"
                      />
                    </div>
                  </div>
                )}

                {/* Form Fields Khusus Fotografer & Admin */}
                {(addRole === "photographer" || addRole === "admin") && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold">
                        Username
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="text"
                          required
                          value={formUsername}
                          onChange={(e) => setFormUsername(e.target.value)}
                          placeholder={
                            addRole === "admin"
                              ? "Contoh: admin_event"
                              : "Contoh: fotografer_pro"
                          }
                          className="pl-9 h-10 text-xs font-mono border-[#E5E7EB] rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold">
                        {editingUser ? "Password Baru (Opsional)" : "Password"}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="password"
                          required={!editingUser}
                          value={formPassword}
                          onChange={(e) => setFormPassword(e.target.value)}
                          placeholder={
                            editingUser
                              ? "Kosongkan jika tidak ingin diubah"
                              : "Kata sandi akun..."
                          }
                          className="pl-9 h-10 text-xs border-[#E5E7EB] rounded-xl"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 h-10 text-xs font-bold border-[#E5E7EB] rounded-xl"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 h-10 text-xs font-bold bg-brand hover:bg-[#C2410C] text-white rounded-xl shadow-md shadow-orange-600/20"
                  >
                    {formLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingUser ? (
                      "Simpan Perubahan"
                    ) : (
                      "Tambah Pengguna"
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dialog Konfirmasi Hapus User */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#111827]">
              Hapus Pengguna {deleteConfirm?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#4B5563] leading-relaxed mt-1">
              Tindakan ini tidak dapat dibatalkan. Pengguna{" "}
              {deleteConfirm?.name} akan dihapus secara permanen dari database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex items-center justify-end gap-2.5 mt-4">
            <AlertDialogCancel className="h-9 text-xs font-bold border-[#E5E7EB] rounded-xl m-0">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteUser(deleteConfirm?.id)}
              disabled={deletingId === deleteConfirm?.id}
              className="h-9 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm m-0"
            >
              {deletingId === deleteConfirm?.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                "Ya, Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
