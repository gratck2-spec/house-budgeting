'use client';

import { useState, useTransition } from 'react';
import { updateBudget } from './actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatRupiah } from '@/lib/money';
import { toast } from 'sonner';
import { Settings } from 'lucide-react';

interface CategoryData {
  category: string;
  total: number;
}

const categoryColors: Record<string, string> = {
  Material: 'bg-blue-500',
  'Upah tukang': 'bg-green-500',
  Alat: 'bg-yellow-500',
  Transport: 'bg-purple-500',
  Konsumsi: 'bg-orange-500',
  Perizinan: 'bg-pink-500',
  Lainnya: 'bg-gray-500',
};

export function RingkasanClient({
  totalBudget,
  categoryData,
}: {
  totalBudget: number;
  categoryData: CategoryData[];
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(totalBudget));
  const [isPending, startTransition] = useTransition();

  const totalSpent = categoryData.reduce((sum, c) => sum + c.total, 0);
  const remaining = totalBudget - totalSpent;
  const percentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  async function handleSaveBudget() {
    startTransition(async () => {
      const result = await updateBudget(parseInt(budgetInput) || 0);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Anggaran diperbarui');
        setShowSettings(false);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ringkasan</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {showSettings && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Total Anggaran (Rp)</Label>
                <Input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  min={0}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveBudget} disabled={isPending} className="flex-1">
                  {isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
                <Button variant="outline" onClick={() => setShowSettings(false)}>
                  Batal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Anggaran</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{formatRupiah(totalBudget)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Keluar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{formatRupiah(totalSpent)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Sisa Anggaran</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatRupiah(remaining)}
          </p>
          {totalBudget > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{Math.round(percentage)}% terpakai</span>
                <span>{formatRupiah(totalBudget - totalSpent)} tersisa</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {categoryData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pengeluaran per Kategori</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {categoryData.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${categoryColors[cat.category] ?? 'bg-gray-400'}`} />
                  <span className="text-sm">{cat.category}</span>
                </div>
                <span className="text-sm font-medium">{formatRupiah(cat.total)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}