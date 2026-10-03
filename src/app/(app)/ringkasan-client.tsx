"use client";

import { useState, useTransition } from "react";
import { updateBudget } from "./actions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cnCategoryColor } from "@/lib/category-colors";
import { formatRupiah } from "@/lib/money";
import { toast } from "sonner";
import { LayoutDashboard, Wallet, ArrowDown, Settings2, TrendingUp, AlertCircle } from "lucide-react";

interface CategoryData {
  category: string;
  total: number;
}

interface RingkasanClientProps {
  totalBudget: number;
  categoryData: CategoryData[];
}

export function RingkasanClient({ totalBudget, categoryData }: RingkasanClientProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(totalBudget));
  const [isPending, startTransition] = useTransition();

  const totalSpent = categoryData.reduce((sum, c) => sum + c.total, 0);
  const remaining = totalBudget - totalSpent;
  const percentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const isOverBudget = remaining < 0;

  async function handleSaveBudget() {
    startTransition(async () => {
      const result = await updateBudget(parseInt(budgetInput) || 0);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Anggaran diperbarui");
        setShowSettings(false);
      }
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={LayoutDashboard}
        title="Ringkasan"
        subtitle="Pantau anggaran dan pengeluaran bangunan"
        action={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => {
              setBudgetInput(String(totalBudget));
              setShowSettings(!showSettings);
            }}
          >
            <Settings2 className="h-5 w-5" />
          </Button>
        }
      />

      {showSettings && (
        <Card className="overflow-hidden border-primary/20">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Total Anggaran (Rp)</Label>
              <Input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                min={0}
                className="h-12 text-lg"
                placeholder="0"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveBudget} disabled={isPending} className="flex-1 h-11">
                {isPending ? "Menyimpan..." : "Simpan Anggaran"}
              </Button>
              <Button variant="outline" onClick={() => setShowSettings(false)} className="h-11">
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hero Sisa Anggaran */}
      <Card
        className={`overflow-hidden border-0 shadow-lg ${
          isOverBudget
            ? "bg-gradient-to-br from-[#B44A3E] to-[#8B3A30] text-white"
            : "bg-gradient-to-br from-[#C2703E] to-[#A85D33] text-white"
        }`}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-white/90">
              <Wallet className="h-5 w-5" />
              <span className="text-sm font-medium">Sisa Anggaran</span>
            </div>
            {isOverBudget ? (
              <div className="flex items-center gap-1 text-white/90 text-xs bg-white/20 px-2 py-1 rounded-full">
                <AlertCircle className="h-3 w-3" />
                Over budget
              </div>
            ) : percentage > 75 ? (
              <div className="flex items-center gap-1 text-white/90 text-xs bg-white/20 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                {Math.round(percentage)}% terpakai
              </div>
            ) : null}
          </div>
          <p className="text-4xl font-heading font-bold tracking-tight mb-3">
            {formatRupiah(Math.abs(remaining))}
          </p>
          {!isOverBudget && totalBudget > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/80">
                <span>{formatRupiah(totalSpent)} terpakai</span>
                <span>{formatRupiah(totalBudget)} total</span>
              </div>
              <div className="w-full bg-white/25 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium uppercase tracking-wide">Anggaran</span>
            </div>
            <p className="text-xl font-bold text-foreground">{formatRupiah(totalBudget)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <ArrowDown className="h-4 w-4 text-destructive" />
              <span className="text-xs font-medium uppercase tracking-wide">Total Keluar</span>
            </div>
            <p className="text-xl font-bold text-foreground">{formatRupiah(totalSpent)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {categoryData.length > 0 && (
        <Card className="border-border/60">
          <CardContent className="p-5">
            <h3 className="font-heading font-bold text-lg mb-4">Pengeluaran per Kategori</h3>
            <div className="space-y-4">
              {categoryData.map((cat) => {
                const catPercentage = totalSpent > 0 ? (cat.total / totalSpent) * 100 : 0;
                return (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cnCategoryColor(cat.category)}`}>
                          {cat.category}
                        </span>
                      </div>
                      <span className="text-sm font-bold">{formatRupiah(cat.total)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${cnCategoryColor(cat.category)}`}
                        style={{ width: `${catPercentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}