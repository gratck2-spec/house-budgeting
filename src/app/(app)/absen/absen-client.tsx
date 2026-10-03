"use client";

import { useState, useEffect, useTransition } from "react";
import { getAttendance, saveAttendance } from "./actions";
import { todayJakarta, formatDateIndo } from "@/lib/dates";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/money";
import { toast } from "sonner";
import { CalendarCheck, Users, CheckCircle2, Sun, Moon, Sunrise, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceRow {
  id: string;
  name: string;
  role: string;
  daily_rate: number;
  status: string;
}

const statusOptions = [
  { value: "hadir", label: "Hadir", icon: Sun, shortLabel: "H" },
  { value: "lembur", label: "Lembur", icon: Moon, shortLabel: "L" },
  { value: "setengah", label: "1/2 Hari", icon: Sunrise, shortLabel: "1/2" },
  { value: "absen", label: "Absen", icon: XCircle, shortLabel: "A" },
];

const roleColors: Record<string, string> = {
  tukang: "bg-primary/10 text-primary",
  kenek: "bg-[#7A9B76]/15 text-[#5A7A56] dark:text-[#9ABF96]",
  lainnya: "bg-muted text-muted-foreground",
};

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
    setRows((prev) => prev.map((r) => (r.id === workerId ? { ...r, status } : r)));
  }

  function hadirkanSemua() {
    setRows((prev) => prev.map((r) => ({ ...r, status: "hadir" })));
    toast.success("Semua tukang ditandai hadir");
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
        toast.success("Absen berhasil disimpan");
      }
    });
  }

  const selectedCount = rows.filter((r) => r.status).length;
  const allSelected = rows.length > 0 && selectedCount === rows.length;

  return (
    <div className="space-y-5">
      <PageHeader
        icon={CalendarCheck}
        title="Absen"
        subtitle="Catat kehadiran tukang per hari"
      />

      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Tanggal</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12 text-base"
            />
            <p className="text-sm font-medium text-foreground">{formatDateIndo(date)}</p>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/4" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-10 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="border-border/60 border-dashed">
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Users className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-heading font-bold text-lg mb-1">Belum ada tukang aktif</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Tambahkan tukang terlebih dahulu di menu Tukang
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/tukang'}>
              Ke Halaman Tukang
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedCount} dari {rows.length} tukang sudah diabsen
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={hadirkanSemua}
              disabled={allSelected}
              className="h-9"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Hadirkan Semua
            </Button>
          </div>

          <div className="space-y-3">
            {rows.map((row) => (
              <Card key={row.id} className="border-border/60 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn("w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0", roleColors[row.role] || roleColors.lainnya)}>
                      {row.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{row.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                          {row.role}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatRupiah(row.daily_rate)}/hari
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {statusOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = row.status === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setStatus(row.id, opt.value)}
                          className={cn(
                            "flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 rounded-xl text-xs font-semibold transition-all duration-200",
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{opt.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            className="w-full h-14 text-base font-semibold shadow-lg"
            size="lg"
            onClick={handleSave}
            disabled={isPending || selectedCount === 0}
          >
            {isPending ? "Menyimpan..." : `Simpan Absen (${selectedCount})`}
          </Button>
        </>
      )}
    </div>
  );
}