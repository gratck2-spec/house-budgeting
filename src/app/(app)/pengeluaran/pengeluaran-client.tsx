'use client';

import { useState, useEffect, useTransition } from 'react';
import { getExpenses, addExpense, deleteExpense } from './actions';
import { todayJakarta } from '@/lib/dates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatRupiah } from '@/lib/money';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

interface Expense {
  id: string;
  spent_on: string;
  category: string;
  description: string | null;
  amount: number;
}

const categories = [
  'Material',
  'Upah tukang',
  'Alat',
  'Transport',
  'Konsumsi',
  'Perizinan',
  'Lainnya',
];

export function PengeluaranClient() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [spentOn, setSpentOn] = useState(todayJakarta());
  const [category, setCategory] = useState('Material');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  // Filter state
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMonth, setFilterMonth] = useState('');

  function loadExpenses() {
    setLoading(true);
    getExpenses(
      filterCategory,
      filterMonth || undefined
    ).then((data) => {
      setExpenses(data);
      setLoading(false);
    });
  }

  useEffect(() => {
    loadExpenses();
  }, [filterCategory, filterMonth]);

  function resetForm() {
    setSpentOn(todayJakarta());
    setCategory('Material');
    setDescription('');
    setAmount('');
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set('spent_on', spentOn);
    formData.set('category', category);
    formData.set('description', description);
    formData.set('amount', amount);

    startTransition(async () => {
      const result = await addExpense(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Pengeluaran ditambahkan');
        resetForm();
        loadExpenses();
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus pengeluaran ini?')) return;

    startTransition(async () => {
      const result = await deleteExpense(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Pengeluaran dihapus');
        loadExpenses();
      }
    });
  }

  const totalFiltered = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pengeluaran</h1>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>+ Tambah</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={spentOn}
                  onChange={(e) => setSpentOn(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Kategori</Label>
                <Select value={category} onValueChange={(v) => setCategory(v ?? '')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Keterangan (opsional)</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Semen 50 sak"
                />
              </div>
              <div className="space-y-1">
                <Label>Jumlah (Rp)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min={1}
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

      <div className="flex gap-2">
        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v ?? 'all')}>
          <SelectTrigger className="flex-1">
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
          className="w-40"
        />
      </div>

      <div className="text-sm text-muted-foreground">
        Total: <span className="font-semibold text-foreground">{formatRupiah(totalFiltered)}</span>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Memuat...</p>
      ) : expenses.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Belum ada pengeluaran.
        </p>
      ) : (
        <div className="space-y-2">
          {expenses.map((exp) => (
            <Card key={exp.id}>
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{exp.category}</Badge>
                    <span className="text-xs text-muted-foreground">{exp.spent_on}</span>
                  </div>
                  {exp.description && (
                    <p className="text-sm truncate mt-1">{exp.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="font-semibold whitespace-nowrap">
                    {formatRupiah(exp.amount)}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(exp.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}