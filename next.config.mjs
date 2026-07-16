/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "contestimg.wish.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "3bc01d2807fb1bc0d25c-a86d2521f1af8989841b9619f5314be5.ssl.cf1.rackcdn.com" },
      { protocol: "https", hostname: "d3t32hsnjxo7q6.cloudfront.net" },
      { protocol: "https", hostname: "imancosmetics.com" },
      { protocol: "https", hostname: "s3.amazonaws.com" },
      { protocol: "https", hostname: "static-assets.glossier.com" },
      { protocol: "https", hostname: "www.benefitcosmetics.com" },
      { protocol: "https", hostname: "www.clinique.com" },
      { protocol: "https", hostname: "www.dior.com" },
      { protocol: "https", hostname: "www.fentybeauty.com" },
      { protocol: "https", hostname: "www.nyxcosmetics.com" },
      { protocol: "https", hostname: "www.purpicks.com" },
      { protocol: "https", hostname: "www.smashbox.com" },
    ],
  },
};

export default nextConfig;
