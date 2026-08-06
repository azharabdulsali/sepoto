import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Clock, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { useAuth } from '../context/AuthContext';

// Durasi idle sebelum warning (default: 14 menit = 840.000 milidetik)
const IDLE_THRESHOLD_MS = 14 * 60 * 1000;
// Durasi countdown warning modal (default: 60 detik)
const COUNTDOWN_SECONDS = 60;

export default function IdleTimeoutHandler() {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const idleTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const isWarningRef = useRef(false);

  // Always redirect to the single unified login page
  const getLoginRedirect = useCallback(() => '/login', []);

  // Handle logout otomatis akibat idle timeout
  const handleTimeoutLogout = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    const redirectUrl = getLoginRedirect();
    setShowWarning(false);
    isWarningRef.current = false;
    logout();
    navigate(redirectUrl, { replace: true, state: { sessionExpired: true } });
  }, [logout, navigate, getLoginRedirect]);

  // Reset timer ketika pengguna aktif
  const resetIdleTimer = useCallback(() => {
    if (!isAuthenticated || isWarningRef.current) return;

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    idleTimerRef.current = setTimeout(() => {
      isWarningRef.current = true;
      setShowWarning(true);
      setCountdown(COUNTDOWN_SECONDS);
    }, IDLE_THRESHOLD_MS);
  }, [isAuthenticated]);

  // Perpanjang sesi & reset warning dialog
  const handleExtendSession = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    isWarningRef.current = false;
    setShowWarning(false);
    resetIdleTimer();
  };

  // Effect melacak aktivitas interaksi pengguna
  useEffect(() => {
    if (!isAuthenticated) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      setShowWarning(false);
      isWarningRef.current = false;
      return;
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

    const handleUserActivity = () => {
      resetIdleTimer();
    };

    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));
    resetIdleTimer();

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isAuthenticated, resetIdleTimer]);

  // Effect countdown timer 60s saat warning modal terbuka
  useEffect(() => {
    if (showWarning) {
      setCountdown(COUNTDOWN_SECONDS);
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current);
            handleTimeoutLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    }

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [showWarning, handleTimeoutLogout]);

  if (!isAuthenticated) return null;

  return (
    <AlertDialog open={showWarning} onOpenChange={() => {}}>
      <AlertDialogContent className="max-w-md w-full rounded-3xl bg-white border border-[#E5E7EB] p-6 shadow-2xl">
        <AlertDialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <AlertDialogTitle className="text-lg font-bold text-[#111827] flex items-center gap-2">
            Sesi Login Akan Berakhir
            <Badge variant="outline" className="font-bib text-xs bg-amber-100 text-amber-800 border-amber-300">
              {countdown}d
            </Badge>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-[#4B5563] pt-1.5 leading-relaxed">
            Sesi Anda (<strong className="text-[#111827] font-semibold">{currentUser?.name}</strong>) tidak aktif. Anda akan ter-logout otomatis dalam{' '}
            <strong className="text-amber-600 font-bold font-bib">{countdown} detik</strong> untuk menjaga keamanan akun.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-[11px] text-amber-800 font-medium leading-normal">
            Klik <strong>Tetap Login</strong> di bawah ini untuk memperpanjang waktu sesi Anda.
          </p>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-2.5 pt-2">
          <Button
            variant="outline"
            onClick={handleTimeoutLogout}
            className="flex-1 h-11 text-xs font-bold border-[#E5E7EB] text-gray-600 hover:bg-gray-100 rounded-xl"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
            Keluar Sekarang
          </Button>
          <Button
            onClick={handleExtendSession}
            className="flex-1 h-11 text-xs font-bold bg-brand hover:bg-[#C2410C] text-white rounded-xl shadow-md shadow-orange-600/20"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Tetap Login
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
