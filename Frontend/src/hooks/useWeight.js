import { useEffect, useState } from 'react';
import { weightApi } from '../api/weight';

export function useWeight() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const data = await weightApi.list();
    setHistory(data.reverse());
    setLoading(false);
  };

  const create = data => weightApi.create(data).then(refresh);
  const update = (id, data) => weightApi.update(id, data).then(refresh);
  const remove = id => weightApi.remove(id).then(refresh);

  useEffect(() => { refresh(); }, []);

  return { history, loading, create, update, remove, refresh };
}

