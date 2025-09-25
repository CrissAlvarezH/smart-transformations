import { PGliteWorkerOptions, worker } from '@electric-sql/pglite/worker'
import { PGlite } from '@electric-sql/pglite';

worker({
  async init(options: PGliteWorkerOptions) {
    const db = new PGlite({
      ...options,
      extensions: {
        ...options.extensions,
      },
    });

    return db;
  }
});
