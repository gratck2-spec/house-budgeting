'use client';

import { useState, useEffect, useTransition } from 'react';
import { getAttendance, saveAttendance } from './actions';
import { todayJakarta } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRupiah } from '@/lib/money';
import { toast } from 'sonner';
import { CalendarCheck, CheckCircle2 } from 'lucide-react';

interface AttendanceRow {
  id: string;
  name: string;
  role: string;
  daily_rate: number;
  status: string;
}

const statusOptions = [
  { value: 'hadir', label: 'Hadir', color: 'bg-green-100 text-green-800' },
  { value: 'lembur', label: 'Lembur', color: 'bg-blue-100 text-blue-800' },
  { value: 'setengah', label: 'Setengah', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'absen', label: 'Absen', color: 'bg-red-100 text-red-800' },
];

export function AbsenClient() {
  const [date, setDate] = useState(todayJakarta());
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLoading(true);
    getAttendance(date).then((data) => {
      setRows(data);
      setLoading(false);
    });
  }, [date]);

  function setStatus(workerId: string, status: string) {
    setRows((prev) =>
      prev.map((r) => (r.id === workerId ? { ...r, status } : r))
    );
  }

  function hadirkanSemua() {
    setRows((prev) => prev.map((r) => ({ ...r, status: 'hadir' })));
  }

  function handleSave() {
    startTransition(async () => {
      const records = rows
        .filter((r) => r.status)
        .map((r) => ({
          worker_id: r.id,
          status: r.status,
          daily_rate: r.daily_rate,
        }));

      const result = await saveAttendance(date, records);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Absen disimpan');
      }
    });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Absen</h1>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Tanggal:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Memuat...</p>
      ) : rows.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Tidak ada tukang aktif. Tambahkan tukang terlebih dahulu.
        </p>
      ) : (
        <>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={hadirkanSemua}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Hadirkan Semua
            </Button>
          </div>

          <div className="space-y-2">
            {rows.map((row) => (
              <Card key={row.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium">{row.name}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {row.role}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatRupiah(row.daily_rate)}/hari
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setStatus(row.id, opt.value)}
                        className={`flex-1 py-2 px-2 rounded text-sm font-medium transition-colors ${
                          row.status === opt.value
                            ? opt.color
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? 'Menyimpan...' : 'Simpan Absen'}
          </Button>
        </>
      )}
    </div>
  );
}