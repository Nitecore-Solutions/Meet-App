import { query, queryOne, type Queryable } from "../db";
import type { UserRow } from "../domain/types";
import { nowIso, randomId } from "../utils/crypto";
import { badRequest, notFound } from "../utils/errors";
import { getAvatarForUser, listUserPhotos, type UserPhoto } from "./media";

export type PublicProfile = {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  relationshipStatus: string | null;
  lookingFor: string | null;
  profession: string | null;
  education: string | null;
  drinking: string | null;
  smoking: string | null;
  eating: string | null;
  zodiac: string | null;
  languages: string[];
  interests: string[];
  online: boolean;
  verified: boolean;
  emailVerified: boolean;
  facebookVerified: boolean;
  isPlus: boolean;
  plusExpiresAt: string | null;
  lastActiveAt: string | null;
  distanceKm: number | null;
  mutualInterests: string[];
  avatarUrl: string | null;
  avatar: { id: string | null; url: string; kind: string } | null;
  photos: UserPhoto[];
  joinedAt: string;
};

export type OwnProfile = PublicProfile & {
  email: string;
  interestedIn: string | null;
  hidden: Record<string, boolean>;
  preferences: {
    minAge: number;
    maxAge: number;
    city: string | null;
    showPhotosOnly: boolean;
    showOtherCities: boolean;
    radiusKm: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type UserUpdate = {
  name?: string;
  age?: number | null;
  gender?: string | null;
  city?: string | null;
  state?: string | null;
  bio?: string | null;
  relationshipStatus?: string | null;
  lookingFor?: string | null;
  profession?: string | null;
  education?: string | null;
  drinking?: string | null;
  smoking?: string | null;
  eating?: string | null;
  zodiac?: string | null;
  languages?: string[];
  interests?: string[];
  interestedIn?: string | null;
  minAge?: number;
  maxAge?: number;
  showPhotosOnly?: boolean;
  showOtherCities?: boolean;
  radiusKm?: number;
  hiddenFields?: Record<string, boolean>;
  isOnline?: boolean;
  avatarUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type CreateUserInput = {
  email: string;
  passwordHash: string;
  name?: string;
  emailVerified?: boolean;
};

function parseArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseObject(value: unknown): Record<string, boolean> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, boolean>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, boolean>)
        : {};
    } catch {
      return {};
    }
  }
  return {};
}

function effectivePlus(user: UserRow) {
  return Boolean(
    user.is_plus && user.plus_expires_at && new Date(user.plus_expires_at).getTime() > Date.now()
  );
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKm(a: UserRow, b: UserRow) {
  if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) {
    return null;
  }
  const radius = 6371;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * radius * Math.asin(Math.sqrt(h)) * 10) / 10;
}

function sanitizeName(name?: string) {
  const value = name?.trim();
  return value ? value.slice(0, 80) : "New member";
}

export async function createUserRecord(
  client: Queryable,
  input: CreateUserInput
): Promise<UserRow> {
  const createdAt = nowIso();
  const result = await client.query<UserRow>(
    `INSERT INTO users
      (id, email, password_hash, email_verified, name,
       is_online, last_active_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, FALSE, NULL, $6, $6)
     RETURNING *`,
    [
      randomId(),
      input.email,
      input.passwordHash,
      Boolean(input.emailVerified),
      sanitizeName(input.name),
      createdAt,
    ]
  );
  const row = result.rows[0];
  if (!row) throw new Error("Could not create user");
  return row;
}

export async function createUser(input: CreateUserInput) {
  return queryOne<UserRow>(
    `INSERT INTO users
      (id, email, password_hash, email_verified, name,
       is_online, last_active_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, FALSE, NULL, $6, $6)
     RETURNING *`,
    [
      randomId(),
      input.email,
      input.passwordHash,
      Boolean(input.emailVerified),
      sanitizeName(input.name),
      nowIso(),
    ]
  ).then((row) => {
    if (!row) throw new Error("Could not create user");
    return row;
  });
}

export async function findUserById(id: string) {
  return queryOne<UserRow>("SELECT * FROM users WHERE id = $1", [id]);
}

export async function findUserByEmail(email: string) {
  return queryOne<UserRow>("SELECT * FROM users WHERE email = $1", [email]);
}

export async function requireUserById(id: string) {
  const user = await findUserById(id);
  if (!user) throw notFound("USER_NOT_FOUND", "That profile could not be found.");
  return user;
}

export async function serializePublicProfile(
  user: UserRow,
  viewer?: UserRow
): Promise<PublicProfile> {
  const hidden = parseObject(user.hidden_fields);
  const avatar = await getAvatarForUser(user);
  const photos = await listUserPhotos(user.id);
  const languages = hidden.languages ? [] : parseArray(user.languages);
  const interests = hidden.interests ? [] : parseArray(user.interests);
  const viewerInterests = viewer ? parseArray(viewer.interests) : [];
  return {
    id: user.id,
    name: user.name,
    age: hidden.age ? null : user.age,
    gender: hidden.gender ? null : user.gender,
    city: hidden.city ? null : user.city,
    state: hidden.city ? null : user.state,
    bio: user.bio,
    relationshipStatus: hidden.relationship ? null : user.relationship_status,
    lookingFor: hidden.relationship ? null : user.looking_for,
    profession: hidden.profession ? null : user.profession,
    education: hidden.education ? null : user.education,
    drinking: user.drinking,
    smoking: user.smoking,
    eating: user.eating,
    zodiac: user.zodiac,
    languages,
    interests,
    online: Boolean(user.is_online),
    verified: Boolean(user.verified),
    emailVerified: Boolean(user.email_verified),
    facebookVerified: Boolean(user.facebook_verified),
    isPlus: effectivePlus(user),
    plusExpiresAt: user.plus_expires_at,
    lastActiveAt: user.last_active_at,
    distanceKm: viewer ? distanceKm(viewer, user) : null,
    mutualInterests: viewerInterests.filter((interest) => interests.includes(interest)),
    avatarUrl: avatar?.url ?? null,
    avatar,
    photos,
    joinedAt: user.created_at,
  };
}

export async function serializeOwnProfile(user: UserRow): Promise<OwnProfile> {
  const base = await serializePublicProfile(user);
  return {
    ...base,
    email: user.email,
    emailVerified: Boolean(user.email_verified),
    interestedIn: user.interested_in,
    hidden: parseObject(user.hidden_fields),
    preferences: {
      minAge: user.min_age,
      maxAge: user.max_age,
      city: user.city,
      showPhotosOnly: Boolean(user.show_photos_only),
      showOtherCities: Boolean(user.show_other_cities),
      radiusKm: user.radius_km,
    },
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

export async function getOwnProfile(userId: string) {
  return serializeOwnProfile(await requireUserById(userId));
}

const UPDATE_COLUMNS: Record<keyof UserUpdate, string> = {
  name: "name",
  age: "age",
  gender: "gender",
  city: "city",
  state: "state",
  bio: "bio",
  relationshipStatus: "relationship_status",
  lookingFor: "looking_for",
  profession: "profession",
  education: "education",
  drinking: "drinking",
  smoking: "smoking",
  eating: "eating",
  zodiac: "zodiac",
  languages: "languages",
  interests: "interests",
  interestedIn: "interested_in",
  minAge: "min_age",
  maxAge: "max_age",
  showPhotosOnly: "show_photos_only",
  showOtherCities: "show_other_cities",
  radiusKm: "radius_km",
  hiddenFields: "hidden_fields",
  isOnline: "is_online",
  avatarUrl: "avatar_url",
  latitude: "latitude",
  longitude: "longitude",
};

const JSON_FIELDS = new Set<keyof UserUpdate>(["languages", "interests", "hiddenFields"]);

export async function updateUser(userId: string, patch: UserUpdate) {
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [key, value] of Object.entries(patch) as [keyof UserUpdate, unknown][]) {
    if (value === undefined) continue;
    const column = UPDATE_COLUMNS[key];
    if (!column) continue;
    let storedValue = value;
    if (JSON_FIELDS.has(key)) storedValue = JSON.stringify(value);
    if (key === "name") {
      const name = String(value).trim();
      if (!name) throw badRequest("INVALID_NAME", "Please enter your name.");
      storedValue = name.slice(0, 80);
    }
    params.push(storedValue);
    sets.push(`${column} = $${params.length}`);
  }
  if (sets.length === 0) return getOwnProfile(userId);

  params.push(nowIso(), userId);
  const updated = await queryOne<UserRow>(
    `UPDATE users SET ${sets.join(", ")}, updated_at = $${params.length - 1}
     WHERE id = $${params.length}
     RETURNING *`,
    params
  );
  if (!updated) throw notFound("USER_NOT_FOUND", "That profile could not be found.");
  return serializeOwnProfile(updated);
}

export async function touchUser(userId: string, online: boolean) {
  await query(
    "UPDATE users SET is_online = $1, last_active_at = $2 WHERE id = $3",
    [online, nowIso(), userId]
  );
}

type DiscoveryFilters = {
  limit?: number;
  offset?: number;
  minAge?: number;
  maxAge?: number;
  city?: string;
  showPhotosOnly?: boolean;
  showOtherCities?: boolean;
};

export async function discoverProfiles(userId: string, filters: DiscoveryFilters = {}) {
  const viewer = await requireUserById(userId);
  const limit = Math.min(Math.max(filters.limit ?? 20, 1), 50);
  const offset = Math.max(filters.offset ?? 0, 0);
  const minAge = filters.minAge ?? viewer.min_age ?? 18;
  const maxAge = filters.maxAge ?? viewer.max_age ?? 99;
  const city = filters.city ?? viewer.city;
  const showOtherCities = filters.showOtherCities ?? viewer.show_other_cities;
  const showPhotosOnly = filters.showPhotosOnly ?? viewer.show_photos_only;

  const clauses = [
    "u.id <> $1",
    `NOT EXISTS (
      SELECT 1 FROM blocks b
      WHERE (b.blocker_id = $1 AND b.blocked_id = u.id)
         OR (b.blocked_id = $1 AND b.blocker_id = u.id)
    )`,
    `NOT EXISTS (SELECT 1 FROM passes p WHERE p.from_user_id = $1 AND p.to_user_id = u.id)`,
    `NOT EXISTS (SELECT 1 FROM likes l WHERE l.from_user_id = $1 AND l.to_user_id = u.id)`,
    "(u.age IS NULL OR u.age >= $2)",
    "(u.age IS NULL OR u.age <= $3)",
  ];
  const params: unknown[] = [userId, minAge, maxAge];

  if (city && !showOtherCities) {
    params.push(city);
    clauses.push(`u.city = $${params.length}`);
  }
  if (showPhotosOnly) {
    clauses.push(
      `(u.avatar_url IS NOT NULL OR u.avatar_media_id IS NOT NULL OR EXISTS (
        SELECT 1 FROM user_photos up WHERE up.user_id = u.id
      ))`
    );
  }
  if (viewer.interested_in === "women") clauses.push("u.gender = 'woman'");
  if (viewer.interested_in === "men") clauses.push("u.gender = 'man'");
  if (viewer.gender) {
    params.push(viewer.gender);
    const index = params.length;
    clauses.push(
      `(u.interested_in IS NULL OR u.interested_in = 'everyone'
        OR (u.interested_in = 'women' AND $${index} = 'woman')
        OR (u.interested_in = 'men' AND $${index} = 'man'))`
    );
  }

  params.push(limit + 1, offset);
  const rows = await query<UserRow>(
    `SELECT u.* FROM users u
     WHERE ${clauses.join("\nAND ")}
     ORDER BY u.is_online DESC, u.last_active_at DESC NULLS LAST, u.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const profiles = await Promise.all(
    rows.rows.slice(0, limit).map((row) => serializePublicProfile(row, viewer))
  );
  return {
    profiles,
    nextOffset: rows.rows.length > limit ? offset + limit : null,
  };
}

export async function getPublicProfile(userId: string, viewerId: string) {
  const viewer = await requireUserById(viewerId);
  const user = await requireUserById(userId);
  if (userId !== viewerId) {
    const blocked = await queryOne<{ blocker_id: string }>(
      `SELECT blocker_id FROM blocks
       WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
      [viewerId, userId]
    );
    if (blocked) throw notFound("USER_NOT_FOUND", "That profile could not be found.");
  }
  return serializePublicProfile(user, viewer);
}

export async function userHasPhoto(userId: string) {
  const row = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS (
      SELECT 1 FROM users u
      LEFT JOIN user_photos up ON up.user_id = u.id
      WHERE u.id = $1 AND (u.avatar_url IS NOT NULL OR u.avatar_media_id IS NOT NULL OR up.id IS NOT NULL)
    ) AS exists`,
    [userId]
  );
  return Boolean(row?.exists);
}
