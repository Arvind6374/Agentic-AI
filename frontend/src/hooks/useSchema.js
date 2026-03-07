import { useState, useEffect } from 'react';
import { getSchema } from '../utils/api';

export function useSchema() {
  const [schema, setSchema] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSchema()
      .then(data => { setSchema(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { schema, loading };
}
