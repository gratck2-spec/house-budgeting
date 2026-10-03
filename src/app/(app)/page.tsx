import { getSettings, getExpensesByCategory } from './actions';
import { RingkasanClient } from './ringkasan-client';

export default async function HomePage() {
  const [settings, categoryData] = await Promise.all([
    getSettings(),
    getExpensesByCategory(),
  ]);

  return (
    <RingkasanClient
      totalBudget={settings.total_budget}
      categoryData={categoryData}
    />
  );
}