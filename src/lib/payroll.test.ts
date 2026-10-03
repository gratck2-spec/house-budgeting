import { describe, it, expect } from 'vitest';
import { hitungGaji, AttendanceRecord, AdvanceRecord } from './payroll';

describe('hitungGaji', () => {
  it('menghitung gaji dasar dengan status hadir', () => {
    const attendance: AttendanceRecord[] = [
      { worker_id: 'w1', day_weight: 1, rate_snapshot: 120000 },
      { worker_id: 'w1', day_weight: 1, rate_snapshot: 120000 },
    ];
    const advances: AdvanceRecord[] = [];

    const result = hitungGaji(attendance, advances);

    expect(result).toHaveLength(1);
    expect(result[0].gross).toBe(240000);
    expect(result[0].net).toBe(240000);
    expect(result[0].days.hadir).toBe(2);
  });

  it('menghitung gaji dengan lembur (1.5x)', () => {
    const attendance: AttendanceRecord[] = [
      { worker_id: 'w1', day_weight: 1, rate_snapshot: 120000 },
      { worker_id: 'w1', day_weight: 1.5, rate_snapshot: 120000 },
    ];
    const advances: AdvanceRecord[] = [];

    const result = hitungGaji(attendance, advances);

    expect(result[0].gross).toBe(300000);
    expect(result[0].days.lembur).toBe(1);
  });

  it('menghitung gaji dengan setengah hari (0.5x)', () => {
    const attendance: AttendanceRecord[] = [
      { worker_id: 'w1', day_weight: 0.5, rate_snapshot: 120000 },
    ];
    const advances: AdvanceRecord[] = [];

    const result = hitungGaji(attendance, advances);

    expect(result[0].gross).toBe(60000);
    expect(result[0].days.setengah).toBe(1);
  });

  it('menghitung gaji dengan absen (0x)', () => {
    const attendance: AttendanceRecord[] = [
      { worker_id: 'w1', day_weight: 0, rate_snapshot: 120000 },
      { worker_id: 'w1', day_weight: 1, rate_snapshot: 120000 },
    ];
    const advances: AdvanceRecord[] = [];

    const result = hitungGaji(attendance, advances);

    expect(result[0].gross).toBe(120000);
    expect(result[0].days.absen).toBe(1);
    expect(result[0].days.hadir).toBe(1);
  });

  it('mengurangi kasbon dari gaji kotor', () => {
    const attendance: AttendanceRecord[] = [
      { worker_id: 'w1', day_weight: 1, rate_snapshot: 120000 },
    ];
    const advances: AdvanceRecord[] = [
      { worker_id: 'w1', amount: 50000 },
    ];

    const result = hitungGaji(attendance, advances);

    expect(result[0].gross).toBe(120000);
    expect(result[0].advances).toBe(50000);
    expect(result[0].net).toBe(70000);
  });

  it('kasbon lebih besar dari gaji kotor menghasilkan nilai negatif', () => {
    const attendance: AttendanceRecord[] = [
      { worker_id: 'w1', day_weight: 1, rate_snapshot: 120000 },
    ];
    const advances: AdvanceRecord[] = [
      { worker_id: 'w1', amount: 150000 },
    ];

    const result = hitungGaji(attendance, advances);

    expect(result[0].gross).toBe(120000);
    expect(result[0].advances).toBe(150000);
    expect(result[0].net).toBe(-30000);
  });

  it('perubahan upah di tengah minggu tidak mengubah absen lama', () => {
    const attendance: AttendanceRecord[] = [
      { worker_id: 'w1', day_weight: 1, rate_snapshot: 120000 },
      { worker_id: 'w1', day_weight: 1, rate_snapshot: 150000 },
    ];
    const advances: AdvanceRecord[] = [];

    const result = hitungGaji(attendance, advances);

    expect(result[0].gross).toBe(270000);
  });

  it('menghitung gaji untuk beberapa pekerja', () => {
    const attendance: AttendanceRecord[] = [
      { worker_id: 'w1', day_weight: 1, rate_snapshot: 120000 },
      { worker_id: 'w2', day_weight: 1, rate_snapshot: 110000 },
    ];
    const advances: AdvanceRecord[] = [
      { worker_id: 'w1', amount: 30000 },
    ];

    const result = hitungGaji(attendance, advances);

    expect(result).toHaveLength(2);
    const w1 = result.find((r) => r.worker_id === 'w1')!;
    const w2 = result.find((r) => r.worker_id === 'w2')!;
    expect(w1.net).toBe(90000);
    expect(w2.net).toBe(110000);
  });
});