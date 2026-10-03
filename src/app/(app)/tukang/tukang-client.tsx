"use client";

import { useState, useTransition } from "react";
import { addWorker, updateWorker, toggleWorkerActive } from "./actions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/money";
import { toast } from "sonner";
import { Users, Plus, Pencil, UserCheck, UserX, HardHat, Wrench, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

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

const roleConfig: Record<string, { label: string; color: string; icon: typeof HardHat }> = {
  tukang: { label: "Tukang", color: "bg-primary/10 text-primary", icon: HardHat },
  kenek: { label: "Kenek", color: "bg-[#7A9B76]/15 text-[#5A7A56] dark:text-[#9ABF96]", icon: Wrench },
  lainnya: { label: "Lainnya", color: "bg-muted text-muted-foreground", icon: Briefcase },
};

export function TukangClient({ workers }: { workers: Worker[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("tukang");
  const [dailyRate, setDailyRate] = useState("120000");
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setName("");
    setRole("tukang");
    setDailyRate("120000");
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
    formData.set("name", name);
    formData.set("role", role);
    formData.set("daily_rate", dailyRate);

    startTransition(async () => {
      const result = editingId
        ? await updateWorker(editingId, formData)
        : await addWorker(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(editingId ? "Tukang diperbarui" : "Tukang ditambahkan");
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
        toast.success(worker.active ? "Tukang dinonaktifkan" : "Tukang diaktifkan");
      }
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Users}
        title="Tukang"
        subtitle="Kelola data dan upah tukang/kenek"
        action={
          !showForm && (
            <Button onClick={() => setShowForm(true)} className="h-10 px-4 rounded-full">
              <Plus className="h-4 w-4 mr-1.5" />
              Tambah
            </Button>
          )
        }
      />

      {showForm && (
        <Card className="border-primary/20 shadow-md">
          <CardContent className="p-5">
            <h3 className="font-heading font-bold text-lg mb-4">
              {editingId ? "Ubah Tukang" : "Tambah Tukang"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Pak Budi"
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
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
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tukang">Tukang</SelectItem>
                    <SelectItem value="kenek">Kenek</SelectItem>
                    <SelectItem value="lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="daily_rate">Upah Harian (Rp)</Label>
                <Input
                  id="daily_rate"
                  type="number"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                  min={0}
                  required
                  className="h-12"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isPending} className="flex-1 h-12">
                  {isPending ? "Menyimpan..." : "Simpan"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="h-12 px-6">
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {workers.length === 0 ? (
        <Card className="border-border/60 border-dashed">
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Users className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-heading font-bold text-lg mb-1">Belum ada tukang</h3>
            <p className="text-sm text-muted-foreground">
              Tekan tombol Tambah untuk menambahkan tukang/kenek
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {workers.map((worker) => {
            const config = roleConfig[worker.role] || roleConfig.lainnya;
            const RoleIcon = config.icon;
            return (
              <Card
                key={worker.id}
                className={cn(
                  "border-border/60 overflow-hidden transition-opacity",
                  !worker.active && "opacity-60"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0", config.color)}>
                      {worker.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={cn("font-semibold truncate", !worker.active && "line-through text-muted-foreground")}>
                        {worker.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wide flex items-center gap-1">
                          <RoleIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                        {!worker.active && (
                          <Badge variant="outline" className="text-[10px]">Nonaktif</Badge>
                        )}
                      </div>
                      <p className="text-sm font-bold text-foreground mt-1.5">
                        {formatRupiah(worker.daily_rate)}
                        <span className="text-xs font-normal text-muted-foreground"> /hari</span>
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEdit(worker)}
                        title="Ubah"
                        className="h-9 w-9 rounded-full"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleToggle(worker)}
                        title={worker.active ? "Nonaktifkan" : "Aktifkan"}
                        className={cn(
                          "h-9 w-9 rounded-full",
                          worker.active ? "text-muted-foreground hover:text-destructive" : "text-[#7A9B76] hover:text-[#5A7A56]"
                        )}
                      >
                        {worker.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}