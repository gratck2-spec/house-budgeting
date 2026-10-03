"use client";

import { useState, useEffect, useTransition } from "react";
import { getPayroll, getAdvances, addAdvance, recordPayrollToExpense } from "./actions";
import { getWeekRange, todayJakarta } from "@/lib/dates";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/money";
import { toast } from "sonner";
import { Calculator, Printer, DollarSign, CalendarRange, UserMinus, Plus, TrendingDown, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

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

const roleColors: Record<string, string> = {
  tukang: "bg-primary/10 text-primary",
  kenek: "bg-[#7A9B76]/15 text-[#5A7A56] dark:text-[#9ABF96]",
  lainnya: "bg-muted text-muted-foreground",
};

export function GajiClient() {
  const today = todayJakarta();
  const defaultRange = getWeekRange(today);

  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [payroll, setPayroll] = useState<PayrollRow[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [showKasbon, setShowKasbon] = useState(false);
  const [kasbonWorker, setKasbonWorker] = useState("");
  const [kasbonAmount, setKasbonAmount] = useState("");
  const [kasbonNote, setKasbonNote] = useState("");
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
    if (!kasbonWorker) {
      toast.error("Pilih tukang terlebih dahulu");
      return;
    }

    startTransition(async () => {
      const result = await addAdvance(kasbonWorker, parseInt(kasbonAmount), kasbonNote, kasbonDate);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Kasbon ditambahkan");
        setShowKasbon(false);
        setKasbonAmount("");
        setKasbonNote("");
        loadData();
      }
    });
  }

  async function handleRecordToExpense() {
    const totalNet = payroll.reduce((sum, r) => sum + r.net, 0);
    if (totalNet <= 0) {
      toast.error("Total gaji harus lebih dari 0");
      return;
    }

    startTransition(async () => {
      const result = await recordPayrollToExpense(startDate, endDate, totalNet);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Gaji dicatat ke pengeluaran");
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
    <div className="space-y-5">
      <PageHeader
        icon={Calculator}
        title="Gaji"
        subtitle="Hitung gaji mingguan tukang"
      />

      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <CalendarRange className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Periode</span>
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Dari</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11" />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Sampai</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-11" />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-muted animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : payroll.length === 0 ? (
        <Card className="border-border/60 border-dashed">
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <UserMinus className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-heading font-bold text-lg mb-1">Tidak ada data absen</h3>
            <p className="text-sm text-muted-foreground">
              Belum ada absen pada periode ini. Isi absen terlebih dahulu.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {payroll.map((row) => (
              <Card key={row.worker_id} className="border-border/60 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn("w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0", roleColors[row.role] || roleColors.lainnya)}>
                      {row.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{row.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                          {row.role}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatRupiah(row.daily_rate)}/hari
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <DayChip count={row.days.hadir} label="Hadir" variant="hadir" />
                    <DayChip count={row.days.lembur} label="Lembur" variant="lembur" />
                    <DayChip count={row.days.setengah} label="1/2" variant="setengah" />
                    <DayChip count={row.days.absen} label="Absen" variant="absen" />
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gaji kotor</span>
                      <span className="font-medium">{formatRupiah(row.gross)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kasbon</span>
                      <span className="font-medium text-destructive">-{formatRupiah(row.advances)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border mt-2">
                      <span className="font-semibold">Dibayar</span>
                      <span className={cn("font-bold text-lg", row.net < 0 && "text-destructive")}>
                        {formatRupiah(row.net)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-primary mb-3">
                <Wallet className="h-5 w-5" />
                <span className="text-sm font-bold uppercase tracking-wide">Total Gaji</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gaji kotor</span>
                  <span className="font-medium">{formatRupiah(totalGross)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total kasbon</span>
                  <span className="font-medium text-destructive">-{formatRupiah(totalAdvances)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-primary/20 mt-2">
                  <span className="font-bold text-foreground">Total dibayar</span>
                  <span className={cn("font-heading font-bold text-2xl", totalNet < 0 && "text-destructive")}>
                    {formatRupiah(totalNet)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              className="h-12 rounded-xl"
              onClick={() => setShowKasbon(!showKasbon)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Kasbon
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-xl"
              onClick={handleRecordToExpense}
              disabled={isPending}
            >
              <DollarSign className="h-4 w-4 mr-1.5" />
              Catat
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-xl"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 mr-1.5" />
              Cetak
            </Button>
          </div>

          {showKasbon && (
            <Card className="border-border/60">
              <CardContent className="p-5">
                <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                  Tambah Kasbon
                </h3>
                <form onSubmit={handleAddKasbon} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tukang</Label>
                    <Select value={kasbonWorker} onValueChange={(v) => setKasbonWorker(v ?? "")}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Pilih tukang" />
                      </SelectTrigger>
                      <SelectContent>
                        {payroll.map((r) => (
                          <SelectItem key={r.worker_id} value={r.worker_id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal</Label>
                    <Input type="date" value={kasbonDate} onChange={(e) => setKasbonDate(e.target.value)} required className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label>Jumlah (Rp)</Label>
                    <Input type="number" value={kasbonAmount} onChange={(e) => setKasbonAmount(e.target.value)} min={1} required className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label>Catatan</Label>
                    <Input value={kasbonNote} onChange={(e) => setKasbonNote(e.target.value)} placeholder="Contoh: Beli baju" className="h-12" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={isPending} className="flex-1 h-12">
                      {isPending ? "Menyimpan..." : "Simpan"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowKasbon(false)} className="h-12 px-6">
                      Batal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {advances.length > 0 && (
            <Card className="border-border/60">
              <CardContent className="p-5">
                <h3 className="font-heading font-bold text-lg mb-3">Riwayat Kasbon</h3>
                <div className="space-y-2">
                  {advances.map((adv) => (
                    <div key={adv.id} className="flex justify-between items-center text-sm py-2 border-b border-border last:border-0">
                      <div>
                        <p className="font-medium">{adv.paid_on}</p>
                        {adv.note && <p className="text-xs text-muted-foreground">{adv.note}</p>}
                      </div>
                      <span className="font-bold text-destructive">{formatRupiah(adv.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function DayChip({ count, label, variant }: { count: number; label: string; variant: "hadir" | "lembur" | "setengah" | "absen" }) {
  const styles = {
    hadir: "bg-[#7A9B76]/15 text-[#5A7A56] dark:text-[#9ABF96]",
    lembur: "bg-primary/10 text-primary",
    setengah: "bg-[#D4A23A]/15 text-[#9A7A2A] dark:text-[#E6B84D]",
    absen: "bg-destructive/10 text-destructive",
  };

  return (
    <div className={cn("flex-1 flex flex-col items-center justify-center py-2 rounded-xl text-xs", styles[variant])}>
      <span className="font-bold text-sm">{count}</span>
      <span className="text-[10px] opacity-80">{label}</span>
    </div>
  );
}