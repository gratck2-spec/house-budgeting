export interface AttendanceRecord {
  worker_id: string;
  day_weight: number;
  rate_snapshot: number;
}

export interface AdvanceRecord {
  worker_id: string;
  amount: number;
}

export interface PayrollResult {
  worker_id: string;
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

export function hitungGaji(
  attendance: AttendanceRecord[],
  advances: AdvanceRecord[]
): PayrollResult[] {
  const workerMap = new Map<string, PayrollResult>();

  for (const att of attendance) {
    if (!workerMap.has(att.worker_id)) {
      workerMap.set(att.worker_id, {
        worker_id: att.worker_id,
        gross: 0,
        advances: 0,
        net: 0,
        days: { hadir: 0, lembur: 0, setengah: 0, absen: 0 },
      });
    }

    const result = workerMap.get(att.worker_id)!;
    result.gross += Math.round(att.day_weight * att.rate_snapshot);

    if (att.day_weight === 1) result.days.hadir++;
    else if (att.day_weight === 1.5) result.days.lembur++;
    else if (att.day_weight === 0.5) result.days.setengah++;
    else if (att.day_weight === 0) result.days.absen++;
  }

  for (const adv of advances) {
    const result = workerMap.get(adv.worker_id);
    if (result) {
      result.advances += adv.amount;
    }
  }

  for (const result of workerMap.values()) {
    result.net = result.gross - result.advances;
  }

  return Array.from(workerMap.values());
}