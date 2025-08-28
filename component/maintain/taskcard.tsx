'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/component/ui/card';
import { Button } from '@/component/ui/button';
import { Input } from '@/component/ui/input';
import { Textarea } from '@/component/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/component/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/component/ui/dialog';
import { Label } from '@/component/ui/label'
import * as XLSX from "xlsx";
import { DialogDescription } from '@radix-ui/react-dialog';

export type Task = {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null; // ISO string
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  pic_lapangan: string | null;
  pic_maintenance: string | null
};

// replace your old handleFile function with this
const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files) return;
  const file = e.target.files[0];
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet); // [{col1: val1, col2: val2}, ...]
  console.log(jsonData);

  // ---------- STEP 3: Send parsed data to backend ----------
  try {
    const res = await fetch('/api/tasks/import', { // <-- create this API route
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jsonData)
    });
    const result = await res.json();
    console.log('Server response:', result);
    alert('Upload successful!');
  } catch(err) {
    console.error('Upload failed', err);
    alert('Upload failed, see console for details.');
  }
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [due, setDue] = useState(''); // yyyy-mm-dd
  const [status, setStatus] = useState<'todo'|'in_progress'|'done'|'blocked'>('todo');
  const [pic_lapangan, setPic] = useState('');
  const [edit, setEdit] = useState<Task | null>(null);

  const STATUS_LABELS: Record<Task["status"], string> = {
  todo: "Direncanakan",
  in_progress: "Dalam Pengerjaan",
  done: "Selesai",
  blocked: "Dibatalkan",
  };


  async function fetchTasks() {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks', { cache: 'no-store' });
      const data = await res.json();
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTasks(); }, []);

  async function createTask() {
    try {
      setCreating(true);
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: description || null, due_date: due || null, status, pic_lapangan: status === 'done' ? (pic_lapangan || null) : null })
      });
      let data:any=null; try { data = await res.json(); } catch {}
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setTitle(''); setDescription(''); setDue(''); setStatus('todo'); setPic('');
      await fetchTasks();
    } catch(e:any){
      alert(`Create failed: ${e.message}`);
      console.error(e);
    } finally { setCreating(false); }
  }

  async function updateTask(t: Partial<Task> & { id: number }) {
    // bersihin nilai kosong -> null
    const payload = {
      title: t.title ?? null,
      description: t.description ?? null,
      status: t.status,
      due_date: (t.due_date && t.due_date.trim() !== '') ? t.due_date : null,
      pic_lapangan: (t.pic_lapangan && t.pic_lapangan.trim() !== '') ? t.pic_lapangan : null,
    };

    try {
      const res = await fetch(`/api/tasks/${t.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let body: any = null;
      try { body = await res.json(); } catch { /* ignore */ }

      if (!res.ok) {
        console.error('PUT /api/tasks failed', { status: res.status, body, payload });
        throw new Error(body?.error || `HTTP ${res.status}`);
      }

      await fetchTasks();
      setEdit(null)
    } catch (e:any) {
      alert(`Update failed: ${e.message}`);
    }
  }

  async function removeTask(id: number) {
    const ok = confirm('Hapus task ini?');
    if (!ok) return;
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('failed');
    await fetchTasks();
  }

  function fmt(d: string | null) {
    if (!d) return '-';
    const dd = new Date(d);
    if (Number.isNaN(dd.getTime())) return '-';
    return dd.toLocaleDateString();
  }

function parseDate(d: string | null) {
    if (!d) return null;
    const maybeISO = d.length === 10 ? `${d}T00:00:00` : d.replace(" ", "T");
    const dt = new Date(maybeISO);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  function addDays(d: Date, n: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }
  function isArchivedDone(t: Task) {
    if (t.status !== "done") return false;
    const due = parseDate(t.due_date);
    if (!due) return false; // done tanpa due_date → jangan auto-hide
    return new Date() > addDays(due, 30);
  }
  const STATUS_ORDER: Record<Task["status"], number> = {
    todo: 1,
    in_progress: 0,
    done: 2,
    blocked: 3, // blocked selalu paling bawah
  };

  // ---------- Filter, Sort, dan "maks 4 task kelihatan + scroll" ----------
  const visibleTasks = useMemo(() => {
    return tasks
      .filter(t => !isArchivedDone(t)) // hide "done" yang >30 hari dari due_date
      .sort((a, b) => {
        const sa = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        if (sa !== 0) return sa;
        const da = parseDate(a.due_date);
        const db = parseDate(b.due_date);
        if (da && db) return da.getTime() - db.getTime(); // due date terdekat dulu
        if (da && !db) return -1;
        if (!da && db) return 1;
        return a.id - b.id; // tie-breaker stabil
      });
  }, [tasks]);

  const pendingCount = useMemo(() => tasks.filter(t => t.status !== 'done').length, [tasks]);

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>List Pekerjaan ({pendingCount} belum diselesaikan)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Komponen pengisian tugas manual */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            {/* Nama Kegiatan */}
            <div className="md:col-span-1 space-y-1.5">
              <Label htmlFor="title">
              Judul Pekerjaan <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                className="border-[#033270] placeholder:text-black opacity-50"
                placeholder="Masukkan judul"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

          {/* Due Date */}
          <div className="md:col-span-1 space-y-1.5">
            <Label htmlFor="due">Tanggal Pelaksanaan<span className='text-destructive'>*</span></Label>
            <Input
              id="due"
              type="date"
              className='border-[#033270] placeholder: opacity-50'
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="md:col-span-1 space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">Direncanakan</SelectItem>
                <SelectItem value="in_progress">Dalam Pengerjaan</SelectItem>
                <SelectItem value="done">Selesai</SelectItem>
                <SelectItem value="blocked">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* PIC (muncul kalau done) */}
          {status === "done" && (
            <div className="md:col-span-1 space-y-1.5">
              <Label htmlFor="pic">Pelaku Kegiatan (PIC)</Label>
              <Input
                id="pic"
                className='placeholder: text-black'
                value={pic_lapangan}
                onChange={(e) => setPic(e.target.value)}
              />
            </div>
          )}

          {/* Deskripsi */}
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="desc">Deskripsi</Label>
            <Textarea
              id="desc"
              placeholder="Masukkan deskripsi pekerjaan (opsional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-[#033270] placeholder:opacity-50"
            />
            <p className="text-xs text-muted-foreground">
              Tambahkan detail tentang pekerjaan yang akan dilakukan.
            </p>
          </div>
        </div>
          <div className="flex gap-2">
            <Button className='bg-background hover:bg-foreground' onClick={createTask} disabled={creating || title.trim() === '' || !due}>Tambahkan</Button>
            <Button className='bg-green-600 hover:bg-green-800' onClick={fetchTasks} disabled={loading}>Refresh</Button>
            <label htmlFor="file-upload">
            <Button className='bg-orange-600 hover:bg-orange-800' asChild>
              <span>Upload File</span>
            </Button>
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFile}
              className="hidden" // hide the default input
            />
          </div>

          <div className="border-2 border-black rounded-xl overflow-hidden  ">
            <div className='max-h-72 overflow-y-auto '>
            <table className="w-full min-w-[900px] text-sm">   
              <thead className="bg-foreground-accent">
                <tr>
                  <th className="p-2 text-left w-[320px]">Pekerjaan</th>
                  <th className="p-2 text-center w-[160px]">Rencana Eksekusi</th>
                  <th className="p-2 text-center w-[140px]">Status Pekerjaan</th>
                  <th className="p-2 text-center w-[200px]">PIC Lapangan</th>
                  <th className="p-2 text-center w-[180px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleTasks.map(t => (
                  <tr key={t.id} className="border-t">
                    <td className="p-2 align-top">
                      <div className="font-medium mb-1">{t.title}</div>
                      {t.description ? (<p className='text-muted-foreground leading-relaxed break-words md:line-clamp-none line-clamp-3'
                      style={{ textAlign: "justify" }}>
                        {t.description}
                      </p> ) :null}
                    <div className='mt-1 text-[12px] text-muted-foreground'><span className='font-medium text-foreground/80'>PIC Maintenance:</span>
                    {" "}{t.pic_maintenance ?? "-"}
                    </div>
                    </td>
                    <td className="p-2 text-center align-top whitespace-nowrap">{fmt(t.due_date)}</td>
                    <td className="p-2 capitalize text-center align-top whitespace-nowrap">{STATUS_LABELS[t.status]}</td>
                    <td className="p-2 text-center align-top">{t.pic_lapangan ?? '-'}</td>
                    <td className="p-2 align-top">
                      <div className='flex flex-wrap items-center gap-2'>
                      <Dialog open={edit?.id === t.id} onOpenChange={(o)=>!o && setEdit(null)}>
                        <DialogTrigger asChild>
                          <Button size="sm" className='h-8 px-3' variant="default" onClick={()=>setEdit(t)}>Edit</Button>
                        </DialogTrigger>
                        <DialogContent className='bg-card text-black'>
                          <DialogHeader>
                            <DialogTitle className='text-black'>Edit {t.title}</DialogTitle>
                            <DialogDescription>
                              Klik <b>Save</b> untuk menyimpan.
                            </DialogDescription>
                          </DialogHeader>
                          {/* Komponen di dalam edit */}
                          <div className="space-y-3 text-black">
                            {/* Title */}
                            <div className="space-y-1">
                              <Label htmlFor="edit-title">Nama Kegiatan</Label>
                              <Input
                                id="edit-title"
                                value={edit?.title ?? ''}
                                onChange={(e) =>
                                  setEdit(prev => prev ? { ...prev, title: e.target.value } : prev)
                                }
                              />
                            </div>

                            {/* Due Date */}
                            <div className="space-y-1">
                              <Label htmlFor="edit-due">Tanggal Pelaksanaan</Label>
                              <Input
                                id="edit-due"
                                type="date"
                                value={edit?.due_date ? new Date(edit.due_date).toISOString().slice(0,10) : ''}
                                onChange={(e) =>
                                  setEdit(prev => prev ? { ...prev, due_date: e.target.value } : prev)
                                }
                              />
                            </div>

                            {/* Status */}
                            <div className="space-y-1">
                              <Label htmlFor="edit-status">Status</Label>
                              <Select
                                value={edit?.status ?? t.status}
                                onValueChange={(v) =>
                                  setEdit(prev => prev ? { ...prev, status: v as any } : prev)
                                }
                              >
                                <SelectTrigger id="edit-status">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="todo">Direncanakan</SelectItem>
                                  <SelectItem value="in_progress">Dalam Pengerjaan</SelectItem>
                                  <SelectItem value="done">Selesai</SelectItem>
                                  <SelectItem value="blocked">Dibatalkan</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* PIC */}
                            {(edit?.status ?? t.status) === 'done' && (
                              <div className="space-y-1">
                                <Label htmlFor="edit-pic">Pelaku Kegiatan (PIC)</Label>
                                <Input
                                  id="edit-pic"
                                  value={edit?.pic_lapangan ?? ''}
                                  onChange={(e) =>
                                    setEdit(prev => prev ? { ...prev, pic_lapangan: e.target.value } : prev)
                                  }
                                />
                              </div>
                            )}

                            {/* Description */}
                            <div className="space-y-1">
                              <Label htmlFor="edit-desc">Deskripsi</Label>
                              <Textarea
                                id="edit-desc"
                                className="border-[#033270]"
                                value={edit?.description ?? ''}
                                onChange={(e) =>
                                  setEdit(prev => prev ? { ...prev, description: e.target.value } : prev)
                                }
                              />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-2 pt-2">
                              <Button
                                onClick={() => edit && updateTask(edit)}
                                disabled={edit?.status === 'done' && !(edit?.pic_lapangan && edit.pic_lapangan.trim())}
                                className='bg-background hover:bg-foreground'
                              >
                                Save
                              </Button>
                              <Button variant="destructive" onClick={() => setEdit(null)} className='hover:bg-red-800'>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="destructive" className="h-8 px-3" onClick={()=>removeTask(t.id)}>Hapus</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!visibleTasks.length && !loading && (
                  <tr><td className="p-4 text-center" colSpan={5}>No tasks</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}