// Raw Lucide icon path data for every icon offered in the program-form.tsx
// icon picker, imported directly from each icon's own module rather than
// through the `lucide-react` React component (Next.js's App Router build
// rejects any `react-dom/server` import reachable from a route — see
// heroImage.ts — so icons can't be rendered via React on the server here).
//
// The PascalCase name each icon is picked by does NOT reliably derive its
// kebab-case file name by simple regex: "IceCream" resolves to
// "ice-cream-cone.mjs" (not "ice-cream.mjs"), "Home" resolves to
// "house.mjs", and "Gamepad2"/"Flower2" need a hyphen before the trailing
// digit. Every mapping below was checked against lucide-react's own barrel
// export file (dist/esm/lucide-react.mjs) rather than derived by guessing.
import { __iconNode as Coffee } from "lucide-react/dist/esm/icons/coffee.mjs";
import { __iconNode as Pizza } from "lucide-react/dist/esm/icons/pizza.mjs";
import { __iconNode as Croissant } from "lucide-react/dist/esm/icons/croissant.mjs";
import { __iconNode as Utensils } from "lucide-react/dist/esm/icons/utensils.mjs";
import { __iconNode as Beer } from "lucide-react/dist/esm/icons/beer.mjs";
import { __iconNode as Wine } from "lucide-react/dist/esm/icons/wine.mjs";
import { __iconNode as Apple } from "lucide-react/dist/esm/icons/apple.mjs";
import { __iconNode as Soup } from "lucide-react/dist/esm/icons/soup.mjs";
import { __iconNode as IceCream } from "lucide-react/dist/esm/icons/ice-cream-cone.mjs";
import { __iconNode as Sandwich } from "lucide-react/dist/esm/icons/sandwich.mjs";
import { __iconNode as Dumbbell } from "lucide-react/dist/esm/icons/dumbbell.mjs";
import { __iconNode as Bike } from "lucide-react/dist/esm/icons/bike.mjs";
import { __iconNode as Gamepad2 } from "lucide-react/dist/esm/icons/gamepad-2.mjs";
import { __iconNode as CircleDot } from "lucide-react/dist/esm/icons/circle-dot.mjs";
import { __iconNode as Flame } from "lucide-react/dist/esm/icons/flame.mjs";
import { __iconNode as Zap } from "lucide-react/dist/esm/icons/zap.mjs";
import { __iconNode as ShoppingBag } from "lucide-react/dist/esm/icons/shopping-bag.mjs";
import { __iconNode as Scissors } from "lucide-react/dist/esm/icons/scissors.mjs";
import { __iconNode as Shirt } from "lucide-react/dist/esm/icons/shirt.mjs";
import { __iconNode as Ticket } from "lucide-react/dist/esm/icons/ticket.mjs";
import { __iconNode as Gift } from "lucide-react/dist/esm/icons/gift.mjs";
import { __iconNode as Car } from "lucide-react/dist/esm/icons/car.mjs";
import { __iconNode as Music } from "lucide-react/dist/esm/icons/music.mjs";
import { __iconNode as BookOpen } from "lucide-react/dist/esm/icons/book-open.mjs";
import { __iconNode as Paintbrush } from "lucide-react/dist/esm/icons/paintbrush.mjs";
import { __iconNode as Camera } from "lucide-react/dist/esm/icons/camera.mjs";
import { __iconNode as Flower2 } from "lucide-react/dist/esm/icons/flower-2.mjs";
import { __iconNode as Leaf } from "lucide-react/dist/esm/icons/leaf.mjs";
import { __iconNode as Star } from "lucide-react/dist/esm/icons/star.mjs";
import { __iconNode as Heart } from "lucide-react/dist/esm/icons/heart.mjs";
import { __iconNode as Smile } from "lucide-react/dist/esm/icons/smile.mjs";
import { __iconNode as Dog } from "lucide-react/dist/esm/icons/dog.mjs";
import { __iconNode as Globe } from "lucide-react/dist/esm/icons/globe.mjs";
import { __iconNode as Home } from "lucide-react/dist/esm/icons/house.mjs";
import { __iconNode as Sun } from "lucide-react/dist/esm/icons/sun.mjs";
import { __iconNode as Moon } from "lucide-react/dist/esm/icons/moon.mjs";

export type IconNode = [string, Record<string, string>][];

const ICON_NODES: Record<string, IconNode> = {
  Coffee, Pizza, Croissant, Utensils, Beer, Wine, Apple, Soup, IceCream, Sandwich,
  Dumbbell, Bike, Gamepad2, CircleDot, Flame, Zap,
  ShoppingBag, Scissors, Shirt, Ticket, Gift, Car,
  Music, BookOpen, Paintbrush, Camera, Flower2, Leaf,
  Star, Heart, Smile, Dog, Globe, Home, Sun, Moon,
};

export function getIconNode(iconName: string): IconNode {
  return ICON_NODES[iconName] ?? Star;
}
