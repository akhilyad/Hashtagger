import type {NextConfig} from 'next';

const isGithubPages = process.env.GITHUB_PAGES === 'true';
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'Hashtagger';
const basePath = isGithubPages ? `/${repoName}` : '';
const isStandalone = process.env.NEXT_STANDALONE === 'true';

// Demo checkout grants paid plans without any payment. It exists only for the
// static GitHub Pages export (no API routes); refuse any other production build.
// (`next dev` sets NODE_ENV=development, so local demo runs still work.)
if (
  process.env.NEXT_PUBLIC_PAYMENTS_DEMO === 'true' &&
  !isGithubPages &&
  process.env.NODE_ENV === 'production'
) {
  throw new Error(
    'NEXT_PUBLIC_PAYMENTS_DEMO=true is only allowed for the GitHub Pages static export (GITHUB_PAGES=true). ' +
      'Demo checkout grants paid plans for free without a real payment, so it must not be enabled in a ' +
      'production server build. Unset NEXT_PUBLIC_PAYMENTS_DEMO or build with GITHUB_PAGES=true.'
  );
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: isGithubPages,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // GitHub Pages: static export. NEXT_STANDALONE=true: Docker/Cloud Run bundle. Default: regular `next start`.
  output: isGithubPages ? 'export' : isStandalone ? 'standalone' : undefined,
  basePath: basePath || undefined,
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
