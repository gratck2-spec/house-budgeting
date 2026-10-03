"use client";

import { useState, useEffect, useTransition } from "react";
import { getExpenses, addExpense, deleteExpense } from "./actions";
import { todayJakarta } from "@/lib/dates";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/money";
import { cnCategoryColor } from "@/lib/category-colors";
import { toast } from "sonner";
import { Receipt, Plus, Trash2, Wallet, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface Expense {
  id: string;
  spent_on: string;
  category: string;
  description: string | null;
  amount: number;
}

const categories = [
  "Material",
  "Upah tukang",
  "Alat",
  "Transport",
  "Konsumsi",
  "Perizinan",
  "Lainnya",
];

export function PengeluaranClient() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [spentOn, setSpentOn] = useState(todayJakarta());
  const [category, setCategory] = useState("Material");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const [filterCategory, setFilterCategory] = useState("all");
  const [filterMonth, setFilterMonth] = useState("");

  function loadExpenses() {
    setLoading(true);
    getExpenses(filterCategory, filterMonth || undefined).then((data) => {
      setExpenses(data);
      setLoading(false);
    });
  }

  useEffect(() => {
    loadExpenses();
  }, [filterCategory, filterMonth]);

  function resetForm() {
    setSpentOn(todayJakarta());
    setCategory("Material");
    setDescription("");
    setAmount("");
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("spent_on", spentOn);
    formData.set("category", category);
    formData.set("description", description);
    formData.set("amount", amount);

    startTransition(async () => {
      const result = await addExpense(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Pengeluaran ditambahkan");
        resetForm();
        loadExpenses();
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus pengeluaran ini?")) return;

    startTransition(async () => {
      const result = await deleteExpense(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Pengeluaran dihapus");
        loadExpenses();
      }
    });
  }

  const totalFiltered = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by date
  const grouped = expenses.reduce((acc, expense) => {
    if (!acc[expense.spent_on]) acc[expense.spent_on] = [];
    acc[expense.spent_on].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  function formatDateGroup(dateStr: string) {
    const today = todayJakarta();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yestStr = yesterday.toISOString().split("T")[0];

    if (dateStr === today) return "Hari ini";
    if (dateStr === yestStr) return "Kemarin";

    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Receipt}
        title="Pengeluaran"
        subtitle="Catat semua biaya pembangunan"
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
            <h3 className="font-heading font-bold text-lg mb-4">Tambah Pengeluaran</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={spentOn}
                  onChange={(e) => setSpentOn(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Keterangan</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Semen 50 sak"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label>Jumlah (Rp)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min={1}
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

      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total Pengeluaran
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatRupiah(totalFiltered)}</p>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v ?? "all")}>
          <SelectTrigger className="flex-1 h-11">
            <SelectValue placeholder="Semua kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua kategori</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="w-36 h-11"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-4 space-y-2">
                <div className="h-3 bg-muted rounded animate-pulse w-20" />
                <div className="h-5 bg-muted rounded animate-pulse w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <Card className="border-border/60 border-dashed">
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-heading font-bold text-lg mb-1">Belum ada pengeluaran</h3>
            <p className="text-sm text-muted-foreground">
              Tekan tombol Tambah untuk mencatat pengeluaran pertama
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {sortedDates.map((date) => (
            <div key={date}>
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2 ml-1">
                {formatDateGroup(date)}
              </h3>
              <div className="space-y-2">
                {grouped[date].map((exp) => (
                  <Card key={exp.id} className="border-border/60 overflow-hidden">
                    <CardContent className="flex items-center justify-between p-3.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cnCategoryColor(exp.category)}`}>
                            {exp.category}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="text-sm text-foreground truncate">{exp.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <span className="font-bold whitespace-nowrap text-foreground">
                          {formatRupiah(exp.amount)}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(exp.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}