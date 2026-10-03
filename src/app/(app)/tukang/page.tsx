import { getWorkers } from './actions';
import { TukangClient } from './tukang-client';

export default async function TukangPage() {
  const workers = await getWorkers();
  return <TukangClient workers={workers} />;
}