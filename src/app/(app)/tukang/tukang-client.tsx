'use client';

import { useState, useTransition } from 'react';
import { addWorker, updateWorker, toggleWorkerActive } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatRupiah } from '@/lib/money';
import { Pencil, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

interface Worker {
  id: string;
  name: string;
  role: string;
  daily_rate: number;
  active: boolean;
}

const defaultRates: Record<string, number> = {
  tukang: 120000,
  kenek: 110000,
  lainnya: 100000,
};

export function TukangClient({ workers }: { workers: Worker[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('tukang');
  const [dailyRate, setDailyRate] = useState('120000');
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setName('');
    setRole('tukang');
    setDailyRate('120000');
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(worker: Worker) {
    setEditingId(worker.id);
    setName(worker.name);
    setRole(worker.role);
    setDailyRate(String(worker.daily_rate));
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set('name', name);
    formData.set('role', role);
    formData.set('daily_rate', dailyRate);

    startTransition(async () => {
      const result = editingId
        ? await updateWorker(editingId, formData)
        : await addWorker(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(editingId ? 'Tukang diperbarui' : 'Tukang ditambahkan');
        resetForm();
      }
    });
  }

  async function handleToggle(worker: Worker) {
    startTransition(async () => {
      const result = await toggleWorkerActive(worker.id, worker.active);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(worker.active ? 'Tukang dinonaktifkan' : 'Tukang diaktifkan');
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tukang</h1>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>+ Tambah</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? 'Ubah Tukang' : 'Tambah Tukang'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="name">Nama</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama tukang"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="role">Posisi</Label>
                <Select
                  value={role}
                  onValueChange={(v) => {
                    if (v) {
                      setRole(v);
                      setDailyRate(String(defaultRates[v]));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tukang">Tukang</SelectItem>
                    <SelectItem value="kenek">Kenek</SelectItem>
                    <SelectItem value="lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="daily_rate">Upah/Hari (Rp)</Label>
                <Input
                  id="daily_rate"
                  type="number"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                  min={0}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {workers.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Belum ada tukang. Tekan &quot;+ Tambah&quot; untuk menambahkan.
          </p>
        )}
        {workers.map((worker) => (
          <Card key={worker.id} className={!worker.active ? 'opacity-60' : ''}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{worker.name}</span>
                  <Badge variant={worker.role === 'tukang' ? 'default' : 'secondary'}>
                    {worker.role}
                  </Badge>
                  {!worker.active && <Badge variant="outline">Nonaktif</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatRupiah(worker.daily_rate)}/hari
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => startEdit(worker)}
                  title="Ubah"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleToggle(worker)}
                  title={worker.active ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {worker.active ? (
                    <UserX className="h-4 w-4" />
                  ) : (
                    <UserCheck className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}