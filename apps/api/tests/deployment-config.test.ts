import { describe, it, expect, beforeAll } from 'vitest';

describe('Production Edge Deployment Configuration ($0 Cloudflare Budget)', () => {
  let rootDir: string;
  let apiWranglerPath: string;
  let webRoutesJsonPath: string;
  let webRedirectsPath: string;
  let rootPackageJsonPath: string;
  let fs: {
    existsSync(path: string): boolean;
    readFileSync(path: string, encoding: string): string;
  };

  beforeAll(async () => {
    // @ts-expect-error Dynamic Node path import in Vitest environment
    const path = (await import('node:path')) as {
      resolve(...paths: string[]): string;
      join(...paths: string[]): string;
    };
    // @ts-expect-error Dynamic Node fs import in Vitest environment
    fs = (await import('node:fs')) as {
      existsSync(path: string): boolean;
      readFileSync(path: string, encoding: string): string;
    };

    rootDir = ((globalThis as any).process?.cwd?.() as string) || '';
    apiWranglerPath = path.join(rootDir, 'apps/api/wrangler.toml');
    webRoutesJsonPath = path.join(rootDir, 'apps/web/public/_routes.json');
    webRedirectsPath = path.join(rootDir, 'apps/web/public/_redirects');
    rootPackageJsonPath = path.join(rootDir, 'package.json');
  });

  it('should have a valid Cloudflare Workers wrangler.toml configuration for API', () => {
    expect(fs.existsSync(apiWranglerPath)).toBe(true);
    const content = fs.readFileSync(apiWranglerPath, 'utf8');

    // Required Cloudflare Workers edge configuration properties
    expect(content).toContain('name = "travel-platform-api"');
    expect(content).toContain('main = "src/index.ts"');
    expect(content).toContain('compatibility_date =');
    expect(content).toContain('nodejs_compat');
    expect(content).toContain('NODE_ENV = "production"');
    expect(content).toContain('DEFAULT_CURRENCY = "USD"');
    expect(content).toContain('SUPABASE_URL');
  });

  it('should have a valid Cloudflare Pages _routes.json configuration for Web SPA', () => {
    expect(fs.existsSync(webRoutesJsonPath)).toBe(true);
    const raw = fs.readFileSync(webRoutesJsonPath, 'utf8');
    const parsed = JSON.parse(raw);

    expect(parsed.version).toBe(1);
    expect(Array.isArray(parsed.include)).toBe(true);
    expect(parsed.include).toContain('/*');
    expect(Array.isArray(parsed.exclude)).toBe(true);
    expect(parsed.exclude.length).toBeGreaterThan(0);
  });

  it('should have SPA rewrite rule in _redirects for client-side routing', () => {
    expect(fs.existsSync(webRedirectsPath)).toBe(true);
    const content = fs.readFileSync(webRedirectsPath, 'utf8');
    expect(content).toMatch(/\/\*\s+\/index\.html\s+200/);
  });

  it('should define deploy scripts in root package.json for zero-friction deployment', () => {
    expect(fs.existsSync(rootPackageJsonPath)).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));

    expect(pkg.scripts).toBeDefined();
    expect(pkg.scripts['deploy:api']).toBeDefined();
    expect(pkg.scripts['deploy:api']).toContain('wrangler deploy');
    expect(pkg.scripts['deploy:web']).toBeDefined();
    expect(pkg.scripts['deploy:web']).toContain('wrangler pages deploy');
  });
});
