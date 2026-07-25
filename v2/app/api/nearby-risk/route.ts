import { nearbySchema } from "@/lib/schema";
import { json, parseBody } from "@/lib/route-utils";

export const runtime = "nodejs";

type Point = { latitude: number; longitude: number; name?: string };
type LocatedPoint = Point & { distanceMeters: number };
type CachedResult = { expiresAt: number; places: LocatedPoint[] };

const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
const CACHE_TTL_MS = 5 * 60_000;
const cache = new Map<string, CachedResult>();

function distanceMeters(a: Point, b: Point): number {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const lat1 = a.latitude * rad;
  const lat2 = b.latitude * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

async function queryMirror(endpoint: string, origin: Point): Promise<Point[]> {
  const query = `[out:json][timeout:15];nwr["shop"~"alcohol|wine"](around:1000,${origin.latitude},${origin.longitude});out center tags 10;`;
  const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Thunai-Recovery-App/1.0",
    },
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`overpass_${response.status}`);

  const body = (await response.json()) as {
    elements?: Array<{
      lat?: number;
      lon?: number;
      center?: { lat?: number; lon?: number };
      tags?: { name?: string };
    }>;
  };
  return (body.elements ?? []).flatMap((element) => {
    const latitude = element.lat ?? element.center?.lat;
    const longitude = element.lon ?? element.center?.lon;
    return latitude == null || longitude == null
      ? []
      : [{ latitude, longitude, name: element.tags?.name ?? "Wine shop" }];
  });
}

async function findPlaces(origin: Point): Promise<LocatedPoint[]> {
  const key = `${origin.latitude.toFixed(2)},${origin.longitude.toFixed(2)}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.places;

  const places = await Promise.any(
    OVERPASS_MIRRORS.map((endpoint) => queryMirror(endpoint, origin)),
  );
  const located = places
    .map((place) => ({
      ...place,
      distanceMeters: Math.round(distanceMeters(origin, place)),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
  cache.set(key, { places: located, expiresAt: Date.now() + CACHE_TTL_MS });
  return located;
}

export async function POST(req: Request) {
  const parsed = await parseBody(req, nearbySchema);
  if (!parsed.ok) return parsed.res;
  const origin = parsed.data;

  try {
    const places = await findPlaces(origin);
    const nearest = places[0];
    return json({
      nearby: Boolean(nearest && nearest.distanceMeters <= 200),
      distanceMeters: nearest?.distanceMeters,
      placeName: nearest?.name,
      places: places.slice(0, 5),
    });
  } catch {
    return json({
      nearby: false,
      unavailable: true,
      places: [],
    });
  }
}
