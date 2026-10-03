'use client';

import { useState, useEffect, useTransition } from 'react';
import { getPayroll, getAdvances, addAdvance, recordPayrollToExpense } from './actions';
import { getWeekRange, todayJakarta } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRupiah } from '@/lib/money';
import { toast } from 'sonner';
import { Printer, DollarSign } from 'lucide-react';

interface PayrollRow {
  worker_id: string;
  name: string;
  role: string;
  daily_rate: number;
  gross: number;
  advances: number;
  net: number;
  days: {
    hadir: number;
    lembur: number;
    setengah: number;
    absen: number;
  };
}

interface Advance {
  id: string;
  worker_id: string;
  amount: number;
  note: string | null;
  paid_on: string;
}

export function GajiClient() {
  const today = todayJakarta();
  const defaultRange = getWeekRange(today);

  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [payroll, setPayroll] = useState<PayrollRow[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Kasbon form
  const [showKasbon, setShowKasbon] = useState(false);
  const [kasbonWorker, setKasbonWorker] = useState('');
  const [kasbonAmount, setKasbonAmount] = useState('');
  const [kasbonNote, setKasbonNote] = useState('');
  const [kasbonDate, setKasbonDate] = useState(today);

  function loadData() {
    setLoading(true);
    Promise.all([
      getPayroll(startDate, endDate),
      getAdvances(startDate, endDate),
    ]).then(([payrollData, advancesData]) => {
      setPayroll(payrollData);
      setAdvances(advancesData);
      setLoading(false);
    });
  }

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  async function handleAddKasbon(e: React.FormEvent) {
    e.preventDefault();
    if (!kasbonWorker) return;

    startTransition(async () => {
      const result = await addAdvance(
        kasbonWorker,
        parseInt(kasbonAmount),
        kasbonNote,
        kasbonDate
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Kasbon ditambahkan');
        setShowKasbon(false);
        setKasbonAmount('');
        setKasbonNote('');
        loadData();
      }
    });
  }

  async function handleRecordToExpense() {
    const totalNet = payroll.reduce((sum, r) => sum + r.net, 0);
    if (totalNet <= 0) {
      toast.error('Total gaji harus lebih dari 0');
      return;
    }

    startTransition(async () => {
      const result = await recordPayrollToExpense(startDate, endDate, totalNet);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Gaji dicatat ke pengeluaran');
      }
    });
  }

  function handlePrint() {
    window.print();
  }

  const totalGross = payroll.reduce((sum, r) => sum + r.gross, 0);
  const totalAdvances = payroll.reduce((sum, r) => sum + r.advances, 0);
  const totalNet = payroll.reduce((sum, r) => sum + r.net, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Gaji</h1>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Label className="text-xs">Dari</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Label className="text-xs">Sampai</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Memuat...</p>
      ) : payroll.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Tidak ada data absen pada periode ini.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {payroll.map((row) => (
              <Card key={row.worker_id}>
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
                  <div className="grid grid-cols-4 gap-1 text-center text-xs mb-2">
                    <div className="bg-green-50 rounded p-1">
                      <div className="font-medium">{row.days.hadir}</div>
                      <div className="text-muted-foreground">Hadir</div>
                    </div>
                    <div className="bg-blue-50 rounded p-1">
                      <div className="font-medium">{row.days.lembur}</div>
                      <div className="text-muted-foreground">Lembur</div>
                    </div>
                    <div className="bg-yellow-50 rounded p-1">
                      <div className="font-medium">{row.days.setengah}</div>
                      <div className="text-muted-foreground">1/2</div>
                    </div>
                    <div className="bg-red-50 rounded p-1">
                      <div className="font-medium">{row.days.absen}</div>
                      <div className="text-muted-foreground">Absen</div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Gaji kotor:</span>
                    <span>{formatRupiah(row.gross)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Kasbon:</span>
                    <span className="text-red-600">-{formatRupiah(row.advances)}</span>
                  </div>
                  <div className="flex justify-between font-semibold mt-1 pt-1 border-t">
                    <span>Dibayar:</span>
                    <span className={row.net < 0 ? 'text-red-600' : ''}>
                      {formatRupiah(row.net)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-muted">
            <CardContent className="p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Total gaji kotor:</span>
                <span>{formatRupiah(totalGross)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total kasbon:</span>
                <span className="text-red-600">-{formatRupiah(totalAdvances)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-1 border-t">
                <span>Total dibayar:</span>
                <span className={totalNet < 0 ? 'text-red-600' : ''}>
                  {formatRupiah(totalNet)}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowKasbon(!showKasbon)}
            >
              + Kasbon
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleRecordToExpense}
              disabled={isPending}
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Catat ke Pengeluaran
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
            </Button>
          </div>

          {showKasbon && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tambah Kasbon</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddKasbon} className="space-y-3">
                  <div className="space-y-1">
                    <Label>Tukang</Label>
                    <select
                      className="w-full border rounded px-2 py-1.5 text-sm"
                      value={kasbonWorker}
                      onChange={(e) => setKasbonWorker(e.target.value)}
                      required
                    >
                      <option value="">Pilih tukang</option>
                      {payroll.map((r) => (
                        <option key={r.worker_id} value={r.worker_id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Tanggal</Label>
                    <Input
                      type="date"
                      value={kasbonDate}
                      onChange={(e) => setKasbonDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Jumlah (Rp)</Label>
                    <Input
                      type="number"
                      value={kasbonAmount}
                      onChange={(e) => setKasbonAmount(e.target.value)}
                      min={1}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Catatan (opsional)</Label>
                    <Input
                      value={kasbonNote}
                      onChange={(e) => setKasbonNote(e.target.value)}
                      placeholder="Contoh: Beli baju"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isPending} className="flex-1">
                      {isPending ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowKasbon(false)}>
                      Batal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {advances.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Riwayat Kasbon</h3>
              <div className="space-y-1">
                {advances.map((adv) => (
                  <div key={adv.id} className="flex justify-between text-sm">
                    <span>{adv.paid_on} {adv.note ? `- ${adv.note}` : ''}</span>
                    <span className="text-red-600">{formatRupiah(adv.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}