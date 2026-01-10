import type { SeedFunction } from './types.js';

/**
 * Load a seed by name.
 * Seeds are located in src/seeds/{name}.ts and export a `seed` function.
 */
export async function loadSeed(seedName: string | null): Promise<SeedFunction> {
  const name = seedName || 'default';

  try {
    const module = await import(`./${name}.js`);

    if (typeof module.seed !== 'function') {
      throw new Error(`Seed '${name}' does not export a 'seed' function`);
    }

    return module.seed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ERR_MODULE_NOT_FOUND') {
      throw new Error(
        `Seed '${name}' not found. Create src/seeds/${name}.ts or use SEED_NAME=default`
      );
    }
    throw error;
  }
}

export type { SeedFunction } from './types.js';
export { callTool } from './types.js';
