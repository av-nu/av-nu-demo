export type Interest = {
  id: string;
  label: string;
  image: string;
};

// Interest categories for the personalization onboarding. Images are mapped to
// the closest available catalog photo for a graphical, Pinterest-style picker.
export const interests: Interest[] = [
  { id: "womens-fashion", label: "Women's Fashion", image: "/products/_pool/victoria-priessnitz-UR-0lB0sDTA-unsplash.jpg" },
  { id: "mens-fashion", label: "Men's Fashion", image: "/products/_pool/james-lewis-GeXsUpTSYFg-unsplash.jpg" },
  { id: "kids-toys", label: "Kids Toys & Games", image: "/products/_pool/curated-lifestyle-iw0VRtZS0E4-unsplash3.jpg" },
  { id: "pets", label: "Pets", image: "/products/_pool/andrej-lisakov-megMgyWXwck-unsplash.jpg" },
  { id: "kids-fashion", label: "Kids Fashion", image: "/products/_pool/mitchell-luo-GYNNykpWOU4-unsplash2.jpg" },
  { id: "food", label: "Food", image: "/products/_pool/pablo-merchan-montes--JfwKVjInI0-unsplash.jpg" },
  { id: "beverages", label: "Beverages", image: "/products/_pool/getty-images-ZXEv4N7xXjg-unsplash.jpg" },
  { id: "art", label: "Art", image: "/products/_pool/karolina-grabowska-fpz3RrJtoh8-unsplash.jpg" },
  { id: "home-decor", label: "Home Decor", image: "/products/_pool/planet-volumes-VD9oRt9v4Yo-unsplash.jpg" },
  { id: "jewelry", label: "Jewelry", image: "/products/_pool/daiga-ellaby-eKBG7QgDQq0-unsplash.jpg" },
  { id: "accessories", label: "Accessories", image: "/products/_pool/bundo-kim-oQnnY4mLZmE-unsplash.jpg" },
  { id: "fitness", label: "Fitness", image: "/products/_pool/sayan-majhi-lWVgBTkXtCU-unsplash.jpg" },
  { id: "health-beauty", label: "Health & Beauty", image: "/products/_pool/mockup-free-BBUbUMxC_rc-unsplash.jpg" },
  { id: "baby", label: "Baby Products", image: "/products/_pool/curated-lifestyle-4_-N5jH7WPM-unsplash1.jpg" },
  { id: "outdoor-recreation", label: "Outdoor / Recreation", image: "/products/_pool/jose-m-ayala-abXRpkfW6MA-unsplash.jpg" },
];
