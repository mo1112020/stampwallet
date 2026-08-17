import { setRequestLocale } from "next-intl/server";
import { PhoneMockup, EmptyPhoneMockup } from "@/components/dashboard/phone-mockup";

// Each template's photo is originally sourced from Unsplash, but mirrored
// into this app's own card-backgrounds Storage bucket and served from
// walletos.online (see scripts run for this — the Storage path is
// templates/<id>.jpg) rather than hotlinking images.unsplash.com directly.
// Two reasons: hotlinked Unsplash photos can (and did — see the billiard/
// bakery comments below) simply get deleted out from under us with no
// warning, and a template picked as a program's card background used to
// leave that program permanently dependent on Unsplash staying up, instead
// of on infrastructure we control.
const templates = [
  {
    id: "barbecue",
    name: "Barbecue",
    primaryColor: "#c0392b",
    secondaryColor: "#e74c3c",
    textColor: "text-white",
    iconName: "Flame",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/barbecue.jpg",
  },
  {
    id: "barber",
    name: "Barber Shop",
    primaryColor: "#2c2c2c",
    secondaryColor: "#aaaaaa",
    textColor: "text-white",
    iconName: "Scissors",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/barber.jpg",
  },
  {
    id: "bike",
    name: "Bike rental",
    primaryColor: "#4a4a4a",
    secondaryColor: "#888888",
    textColor: "text-white",
    iconName: "Bike",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/bike.jpg",
  },
  {
    id: "billiard",
    name: "Billiard club",
    primaryColor: "#7b3f00",
    secondaryColor: "#27ae60",
    textColor: "text-white",
    iconName: "CircleDot",
    // Was photo-1615438658906-bcd44a7c9c2c — that Unsplash photo was
    // deleted (404 from images.unsplash.com), swapped for a live one.
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/billiard.jpg",
  },
  {
    id: "bowling",
    name: "Bowling",
    primaryColor: "#1a237e",
    secondaryColor: "#7986cb",
    textColor: "text-white",
    iconName: "CircleDot",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/bowling.jpg",
  },
  {
    id: "breakfast",
    name: "Breakfast",
    primaryColor: "#f39c12",
    secondaryColor: "#f1c40f",
    textColor: "text-gray-900",
    iconName: "Croissant",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/breakfast.jpg",
  },
  {
    id: "atv",
    name: "ATV rental",
    primaryColor: "#4a3424",
    secondaryColor: "#8b6547",
    textColor: "text-white",
    iconName: "Gamepad2",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/atv.jpg",
  },
  {
    id: "art",
    name: "Art",
    primaryColor: "#5c3d2e",
    secondaryColor: "#e8c39e",
    textColor: "text-white",
    iconName: "Paintbrush",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/art.jpg",
  },
  {
    id: "bags",
    name: "Bags & Accessories",
    primaryColor: "#795548",
    secondaryColor: "#b88c5f",
    textColor: "text-white",
    iconName: "ShoppingBag",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/bags.jpg",
  },
  {
    id: "bakery",
    name: "Bakery",
    primaryColor: "#8d6e63",
    secondaryColor: "#e6c27a",
    textColor: "text-white",
    iconName: "Croissant",
    // Was photo-1549931319-a545dcf3bc7f — that Unsplash photo was
    // deleted (404 from images.unsplash.com), swapped for a live one.
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/bakery.jpg",
  },
  {
    id: "bar",
    name: "Bar",
    primaryColor: "#4527a0",
    secondaryColor: "#7e57c2",
    textColor: "text-white",
    iconName: "Wine",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/bar.jpg",
  },
  {
    id: "cafe",
    name: "Café",
    primaryColor: "#4e342e",
    secondaryColor: "#bcaaa4",
    textColor: "text-white",
    iconName: "Coffee",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/cafe.jpg",
  },
  {
    id: "gym",
    name: "Gym",
    primaryColor: "#212121",
    secondaryColor: "#ff5722",
    textColor: "text-white",
    iconName: "Dumbbell",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/gym.jpg",
  },
  {
    id: "restaurant",
    name: "Restaurant",
    primaryColor: "#b71c1c",
    secondaryColor: "#ef9a9a",
    textColor: "text-white",
    iconName: "Utensils",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/restaurant.jpg",
  },
  {
    id: "salon",
    name: "Salon",
    primaryColor: "#880e4f",
    secondaryColor: "#f48fb1",
    textColor: "text-white",
    iconName: "Scissors",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/salon.jpg",
  },
  {
    id: "spa",
    name: "Spa & Wellness",
    primaryColor: "#2e7d32",
    secondaryColor: "#a5d6a7",
    textColor: "text-white",
    iconName: "Flower2",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/spa.jpg",
  },
  {
    id: "bookstore",
    name: "Bookstore",
    primaryColor: "#3e2723",
    secondaryColor: "#a1887f",
    textColor: "text-white",
    iconName: "BookOpen",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/bookstore.jpg",
  },
  {
    id: "music",
    name: "Music School",
    primaryColor: "#1a237e",
    secondaryColor: "#7986cb",
    textColor: "text-white",
    iconName: "Music",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/music.jpg",
  },
  {
    id: "petshop",
    name: "Pet Shop",
    primaryColor: "#1b5e20",
    secondaryColor: "#81c784",
    textColor: "text-white",
    iconName: "Dog",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/petshop.jpg",
  },
  {
    id: "gaming",
    name: "Gaming",
    primaryColor: "#0d0d0d",
    secondaryColor: "#7c3aed",
    textColor: "text-white",
    iconName: "Gamepad2",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/gaming.jpg",
  },
  {
    id: "pizza",
    name: "Pizza",
    primaryColor: "#e65100",
    secondaryColor: "#ff8f00",
    textColor: "text-white",
    iconName: "Pizza",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/pizza.jpg",
  },
  {
    id: "fashion",
    name: "Fashion",
    primaryColor: "#1c1c1c",
    secondaryColor: "#c0a080",
    textColor: "text-white",
    iconName: "Shirt",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/fashion.jpg",
  },
  {
    id: "nail-salon",
    name: "Nail Salon",
    primaryColor: "#ad1457",
    secondaryColor: "#f8bbd0",
    textColor: "text-white",
    iconName: "Sparkles",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/nail-salon.jpg",
  },
  {
    id: "yoga",
    name: "Yoga Studio",
    primaryColor: "#00695c",
    secondaryColor: "#80cbc4",
    textColor: "text-white",
    iconName: "Leaf",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/yoga.jpg",
  },
  {
    id: "car-wash",
    name: "Car Wash",
    primaryColor: "#01579b",
    secondaryColor: "#4fc3f7",
    textColor: "text-white",
    iconName: "Droplets",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/car-wash.jpg",
  },
  {
    id: "ice-cream",
    name: "Ice Cream Shop",
    primaryColor: "#6a1b9a",
    secondaryColor: "#ce93d8",
    textColor: "text-white",
    iconName: "IceCreamCone",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/ice-cream.jpg",
  },
  {
    id: "sushi",
    name: "Sushi Restaurant",
    primaryColor: "#263238",
    secondaryColor: "#4dd0e1",
    textColor: "text-white",
    iconName: "Fish",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/sushi.jpg",
  },
  {
    id: "florist",
    name: "Florist",
    primaryColor: "#33691e",
    secondaryColor: "#c5e1a5",
    textColor: "text-white",
    iconName: "Flower",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/florist.jpg",
  },
  {
    id: "tattoo",
    name: "Tattoo Studio",
    primaryColor: "#1a1a1a",
    secondaryColor: "#e53935",
    textColor: "text-white",
    iconName: "PenTool",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/tattoo.jpg",
  },
  {
    id: "jewelry",
    name: "Jewelry Store",
    primaryColor: "#4a148c",
    secondaryColor: "#d4af37",
    textColor: "text-white",
    iconName: "Gem",
    backgroundImage: "https://www.walletos.online/storage/v1/object/public/card-backgrounds/templates/jewelry.jpg",
  },
];

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div>
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">Templates</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Pick a template to get started quickly, or build from scratch.
          </p>
        </div>
        <span className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--muted)]">
          {templates.length} templates
        </span>
      </div>

      <div className="flex flex-wrap gap-8">
        {/* From scratch */}
        <EmptyPhoneMockup locale={locale} />

        {/* All templates */}
        {templates.map((tpl) => (
          <PhoneMockup
            key={tpl.id}
            name={tpl.name}
            primaryColor={tpl.primaryColor}
            secondaryColor={tpl.secondaryColor}
            textColor={tpl.textColor}
            iconName={tpl.iconName}
            backgroundImage={tpl.backgroundImage}
            isTemplate={true}
            actionText="Open"
            actionHref={`/${locale}/dashboard/programs/new?name=${encodeURIComponent(tpl.name)}&primaryColor=${encodeURIComponent(tpl.primaryColor)}&secondaryColor=${encodeURIComponent(tpl.secondaryColor)}&iconName=${encodeURIComponent(tpl.iconName)}&backgroundImage=${encodeURIComponent(tpl.backgroundImage)}`}
          />
        ))}
      </div>
    </div>
  );
}
