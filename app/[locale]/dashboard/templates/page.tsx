import { setRequestLocale } from "next-intl/server";
import { PhoneMockup, EmptyPhoneMockup } from "@/components/dashboard/phone-mockup";

// Each template has a relevant Unsplash photo as background
const templates = [
  {
    id: "barbecue",
    name: "Barbecue",
    primaryColor: "#c0392b",
    secondaryColor: "#e74c3c",
    textColor: "text-white",
    iconName: "Flame",
    backgroundImage: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80",
  },
  {
    id: "barber",
    name: "Barber Shop",
    primaryColor: "#2c2c2c",
    secondaryColor: "#aaaaaa",
    textColor: "text-white",
    iconName: "Scissors",
    backgroundImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80",
  },
  {
    id: "bike",
    name: "Bike rental",
    primaryColor: "#4a4a4a",
    secondaryColor: "#888888",
    textColor: "text-white",
    iconName: "Bike",
    backgroundImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
  },
  {
    id: "billiard",
    name: "Billiard club",
    primaryColor: "#7b3f00",
    secondaryColor: "#27ae60",
    textColor: "text-white",
    iconName: "CircleDot",
    backgroundImage: "https://images.unsplash.com/photo-1615438658906-bcd44a7c9c2c?w=400&q=80",
  },
  {
    id: "bowling",
    name: "Bowling",
    primaryColor: "#1a237e",
    secondaryColor: "#7986cb",
    textColor: "text-white",
    iconName: "CircleDot",
    backgroundImage: "https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=400&q=80",
  },
  {
    id: "breakfast",
    name: "Breakfast",
    primaryColor: "#f39c12",
    secondaryColor: "#f1c40f",
    textColor: "text-gray-900",
    iconName: "Croissant",
    backgroundImage: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80",
  },
  {
    id: "atv",
    name: "ATV rental",
    primaryColor: "#4a3424",
    secondaryColor: "#8b6547",
    textColor: "text-white",
    iconName: "Gamepad2",
    backgroundImage: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&q=80",
  },
  {
    id: "art",
    name: "Art",
    primaryColor: "#5c3d2e",
    secondaryColor: "#e8c39e",
    textColor: "text-white",
    iconName: "Paintbrush",
    backgroundImage: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80",
  },
  {
    id: "bags",
    name: "Bags & Accessories",
    primaryColor: "#795548",
    secondaryColor: "#b88c5f",
    textColor: "text-white",
    iconName: "ShoppingBag",
    backgroundImage: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80",
  },
  {
    id: "bakery",
    name: "Bakery",
    primaryColor: "#8d6e63",
    secondaryColor: "#e6c27a",
    textColor: "text-white",
    iconName: "Croissant",
    backgroundImage: "https://images.unsplash.com/photo-1549931319-a545dcf3bc7f?w=400&q=80",
  },
  {
    id: "bar",
    name: "Bar",
    primaryColor: "#4527a0",
    secondaryColor: "#7e57c2",
    textColor: "text-white",
    iconName: "Wine",
    backgroundImage: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&q=80",
  },
  {
    id: "cafe",
    name: "Café",
    primaryColor: "#4e342e",
    secondaryColor: "#bcaaa4",
    textColor: "text-white",
    iconName: "Coffee",
    backgroundImage: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
  },
  {
    id: "gym",
    name: "Gym",
    primaryColor: "#212121",
    secondaryColor: "#ff5722",
    textColor: "text-white",
    iconName: "Dumbbell",
    backgroundImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80",
  },
  {
    id: "restaurant",
    name: "Restaurant",
    primaryColor: "#b71c1c",
    secondaryColor: "#ef9a9a",
    textColor: "text-white",
    iconName: "Utensils",
    backgroundImage: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80",
  },
  {
    id: "salon",
    name: "Salon",
    primaryColor: "#880e4f",
    secondaryColor: "#f48fb1",
    textColor: "text-white",
    iconName: "Scissors",
    backgroundImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80",
  },
  {
    id: "spa",
    name: "Spa & Wellness",
    primaryColor: "#2e7d32",
    secondaryColor: "#a5d6a7",
    textColor: "text-white",
    iconName: "Flower2",
    backgroundImage: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80",
  },
  {
    id: "bookstore",
    name: "Bookstore",
    primaryColor: "#3e2723",
    secondaryColor: "#a1887f",
    textColor: "text-white",
    iconName: "BookOpen",
    backgroundImage: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&q=80",
  },
  {
    id: "music",
    name: "Music School",
    primaryColor: "#1a237e",
    secondaryColor: "#7986cb",
    textColor: "text-white",
    iconName: "Music",
    backgroundImage: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=80",
  },
  {
    id: "petshop",
    name: "Pet Shop",
    primaryColor: "#1b5e20",
    secondaryColor: "#81c784",
    textColor: "text-white",
    iconName: "Dog",
    backgroundImage: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80",
  },
  {
    id: "gaming",
    name: "Gaming",
    primaryColor: "#0d0d0d",
    secondaryColor: "#7c3aed",
    textColor: "text-white",
    iconName: "Gamepad2",
    backgroundImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80",
  },
  {
    id: "pizza",
    name: "Pizza",
    primaryColor: "#e65100",
    secondaryColor: "#ff8f00",
    textColor: "text-white",
    iconName: "Pizza",
    backgroundImage: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80",
  },
  {
    id: "fashion",
    name: "Fashion",
    primaryColor: "#1c1c1c",
    secondaryColor: "#c0a080",
    textColor: "text-white",
    iconName: "Shirt",
    backgroundImage: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80",
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
        <span className="rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--muted)]">
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
