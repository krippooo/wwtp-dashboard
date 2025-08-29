'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, CalendarDays } from 'lucide-react';

type TaskNotification = {
  date: string;
  title: string;
  status: string;
  pic: string | null;
};

function formatDate(d: string) {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString('id-ID', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<TaskNotification[]>([]);
  const [count, setCount] = useState(0);  // track jumlah notification

  const panelRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  // Ambil data tasks yang due-nya dalam 3 hari
  const loadTasks = async () => {
    try {
      const response = await fetch('/api/tasks/upcoming');  // Call to new API route
      const data = await response.json();

      // Filter and show upcoming tasks that are due in the next 3 days
      if (Array.isArray(data)) {
        setItems(data);  
        setCount(data.length);  // update notification count
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      setItems([]);
      setCount(0);
    }
  };

    const STATUS_LABELS: Record<TaskNotification["status"], string> = {
    todo: "Direncanakan",
    in_progress: "Dalam Pengerjaan",
    done: "Selesai",
    blocked: "Dibatalkan",
    };

  useEffect(() => {
    loadTasks();
    // update every 1 minute for new notifications
    const intervalId = setInterval(loadTasks, 60000);

    // cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'maintenanceDates') load();
    };
    window.addEventListener('storage', onStorage);

    // tutup saat klik di luar
    const onClickOutside = (e: MouseEvent) => {
      if (!open) return;
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target) &&
          btnRef.current && !btnRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);

    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Notifications"
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-rose-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
      >
        <Bell className="w-5 h-4 text-gray-700 dark:text-gray-900" />
        {count > 0 && (
          <span className="absolute top-1 right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500" />
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notification panel"
          className="absolute right-0 mt-2 w-80 rounded-2xl border border-gray-400 bg-card shadow-xl z-50 overflow-hidden"
        >
          <div className="px-4 py-3 border-b bg-card">
            <p className="font-semibold text-gray-800">Reminders</p>
            <p className="text-xs text-gray-500">Tugas dalam 7 hari kedepan dan yang belum diselesaikan.</p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No upcoming tasks.</div>
            ) : (
              <ul className="divide-y">
                {items.map((it, idx) => {
                  return (
                    <li key={idx} className="p-3 flex items-start gap-3 hover:bg-gray-50">
                      <div className="mt-0.5">
                        <CalendarDays className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {formatDate(it.date)}
                        </p>
                        <dl className="text-xs text-gray-500 grid grid-cols-[auto,1fr] gap-x-2 gap-y-0.5">
                          <dt className="text-gray-600 font-medium">Task: {it.title}</dt>
                          <dt className="text-gray-600 font-medium">Status: {STATUS_LABELS[it.status]}</dt>
                          {(it.pic) && (
                            <>
                              <dt className="text-gray-600 font-medium">PIC Maintenance: {it.pic}</dt>
                            </>
                          )}
                        </dl>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="px-4 py-2 border-t bg-card text-right">
            <button
              className="text-xs text-gray-600 hover:text-gray-800 underline"
              onClick={() => setItems([])}  // clear all notifications
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
function load() {
  throw new Error('Function not implemented.');
}

