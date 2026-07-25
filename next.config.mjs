/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      // La landing es un HTML estático servido desde public/. El rewrite se
      // resuelve antes que el filesystem para que "/" apunte al archivo.
      beforeFiles: [{ source: "/", destination: "/index.html" }],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [
      {
        source: "/assets/img/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
