import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function getSecretKey() {
  const current = Deno.env.get("SUPABASE_SECRET_KEYS");

  if (current) {
    try {
      const parsed = JSON.parse(current);

      if (parsed?.default) {
        return parsed.default as string;
      }
    } catch {
      // Fall through to the legacy variable below.
    }
  }

  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
}

async function getShare(admin: any, token: string) {
  const { data, error } = await admin
    .from("collection_shares")
    .select(
      "id,user_id,scope_type,collection_id,share_token,is_enabled,show_photos,show_estimated_value,show_purchase_price,show_purchase_date,show_value_difference,updated_at",
    )
    .eq("share_token", token)
    .eq("is_enabled", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function getCollectionInfo(admin: any, share: any) {
  if (share.scope_type !== "collection") {
    return {
      name: "Collection",
      description: null,
      memberIds: null as string[] | null,
    };
  }

  const { data: collection, error: collectionError } = await admin
    .from("collections")
    .select("id,user_id,name,description")
    .eq("id", share.collection_id)
    .eq("user_id", share.user_id)
    .maybeSingle();

  if (collectionError) {
    throw collectionError;
  }

  if (!collection) {
    return null;
  }

  const { data: members, error: membersError } = await admin
    .from("collection_members")
    .select("item_id")
    .eq("collection_id", share.collection_id);

  if (membersError) {
    throw membersError;
  }

  return {
    name: collection.name || "Collection",
    description: collection.description || null,
    memberIds: (members || []).map((member: any) => member.item_id),
  };
}

async function getAllowedImageItemIds(
  admin: any,
  share: any,
  requestedIds: string[],
) {
  if (!requestedIds.length) {
    return [];
  }

  const { data: ownedItems, error: ownedError } = await admin
    .from("collection_items")
    .select("id")
    .eq("user_id", share.user_id)
    .eq("category", "game")
    .in("id", requestedIds);

  if (ownedError) {
    throw ownedError;
  }

  const ownedIds = (ownedItems || []).map((item: any) => item.id);

  if (share.scope_type !== "collection" || !ownedIds.length) {
    return ownedIds;
  }

  const { data: members, error: membersError } = await admin
    .from("collection_members")
    .select("item_id")
    .eq("collection_id", share.collection_id)
    .in("item_id", ownedIds);

  if (membersError) {
    throw membersError;
  }

  const membership = new Set(
    (members || []).map((member: any) => member.item_id),
  );

  return ownedIds.filter((id: string) => membership.has(id));
}

async function handleImageRequest(
  admin: any,
  share: any,
  body: any,
) {
  if (!share.show_photos) {
    return jsonResponse({ images: [] });
  }

  const requestedIds = [
    ...new Set(
      (Array.isArray(body?.item_ids) ? body.item_ids : [])
        .map((value: unknown) => String(value || "").trim())
        .filter((value: string) => UUID_PATTERN.test(value)),
    ),
  ].slice(0, 48);

  if (!requestedIds.length) {
    return jsonResponse({ images: [] });
  }

  const allowedIds = await getAllowedImageItemIds(
    admin,
    share,
    requestedIds,
  );

  if (!allowedIds.length) {
    return jsonResponse({ images: [] });
  }

  const full = Boolean(body?.full);
  let imageQuery = admin
    .from("item_images")
    .select(
      "item_id,image_type,storage_path,thumbnail_path,disc_number,sort_order",
    )
    .in("item_id", allowedIds)
    .order("sort_order", { ascending: true });

  if (!full) {
    imageQuery = imageQuery.in("image_type", [
      "front",
      "disc",
      "cartridge",
    ]);
  }

  const { data: images, error: imagesError } = await imageQuery;

  if (imagesError) {
    throw imagesError;
  }

  const imagesWithPath = (images || []).map((image: any) => ({
    ...image,
    delivery_path:
      !full && image.thumbnail_path
        ? image.thumbnail_path
        : image.storage_path,
  }));

  const paths = [
    ...new Set(
      imagesWithPath.map((image: any) => image.delivery_path).filter(Boolean),
    ),
  ];
  const signedUrlByPath = new Map<string, string>();

  if (paths.length > 0) {
    const { data: signed, error: signedError } = await admin.storage
      .from("item-images")
      .createSignedUrls(paths, 3600);

    if (signedError) {
      console.error(
        "Shelfmark shared-collection signed URL creation:",
        signedError,
      );
    } else {
      (signed || []).forEach((entry: any) => {
        if (entry.path && entry.signedUrl) {
          signedUrlByPath.set(entry.path, entry.signedUrl);
        }
      });
    }
  }

  return jsonResponse({
    images: imagesWithPath
      .map((image: any) => {
        const signedUrl = signedUrlByPath.get(image.delivery_path);

        if (!signedUrl) {
          return null;
        }

        return {
          item_ref: image.item_id,
          image_type: image.image_type,
          disc_number: image.disc_number,
          sort_order: image.sort_order,
          signedUrl,
        };
      })
      .filter(Boolean),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json().catch(() => null);
    const token = String(body?.token || "").trim();

    if (!UUID_PATTERN.test(token)) {
      return jsonResponse({ error: "Share unavailable" }, 404);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const secretKey = getSecretKey();

    if (!supabaseUrl || !secretKey) {
      console.error(
        "Shelfmark shared-collection: missing Supabase environment variables",
      );
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const admin = createClient(supabaseUrl, secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const share = await getShare(admin, token);

    if (!share) {
      return jsonResponse({ error: "Share unavailable" }, 404);
    }

    if (body?.action === "images") {
      return await handleImageRequest(admin, share, body);
    }

    const collectionInfo = await getCollectionInfo(admin, share);

    if (!collectionInfo) {
      return jsonResponse({ error: "Share unavailable" }, 404);
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("username")
      .eq("id", share.user_id)
      .maybeSingle();

    let collectionItems: any[] = [];

    if (
      collectionInfo.memberIds === null ||
      collectionInfo.memberIds.length > 0
    ) {
      let itemsQuery = admin
        .from("collection_items")
        .select(
          "id,title,condition,completeness,region,country,purchase_date,purchase_price,estimated_value,created_at",
        )
        .eq("user_id", share.user_id)
        .eq("category", "game")
        .order("title", { ascending: true });

      if (collectionInfo.memberIds !== null) {
        itemsQuery = itemsQuery.in("id", collectionInfo.memberIds);
      }

      const { data, error } = await itemsQuery;

      if (error) {
        throw error;
      }

      collectionItems = data || [];
    }

    const itemIds = collectionItems.map((item) => item.id);
    const gamesByItemId = new Map<string, any>();

    if (itemIds.length > 0) {
      const { data: games, error: gamesError } = await admin
        .from("games")
        .select(
          "item_id,platform,release_year,genre,game_type,edition,developer,publisher,media_type,media_format,case_format,custom_case_width,custom_case_height,disc_count",
        )
        .in("item_id", itemIds);

      if (gamesError) {
        throw gamesError;
      }

      (games || []).forEach((game: any) => {
        gamesByItemId.set(game.item_id, game);
      });
    }

    const items = collectionItems
      .map((item) => {
        const game = gamesByItemId.get(item.id);

        if (!game) {
          return null;
        }

        const purchasePrice = share.show_purchase_price
          ? item.purchase_price
          : null;
        const estimatedValue = share.show_estimated_value
          ? item.estimated_value
          : null;
        const valueDifference =
          share.show_value_difference &&
          item.purchase_price !== null &&
          item.purchase_price !== undefined &&
          item.estimated_value !== null &&
          item.estimated_value !== undefined
            ? Number(item.estimated_value) - Number(item.purchase_price)
            : null;

        return {
          item_ref: item.id,
          title: item.title,
          condition: item.condition,
          completeness: item.completeness,
          region: item.region,
          country: item.country,
          purchase_date: share.show_purchase_date ? item.purchase_date : null,
          purchase_price: purchasePrice,
          estimated_value: estimatedValue,
          value_difference: valueDifference,
          game: {
            platform: game.platform,
            release_year: game.release_year,
            genre: game.genre,
            game_type: game.game_type,
            edition: game.edition,
            developer: game.developer,
            publisher: game.publisher,
            media_type: game.media_type,
            media_format: game.media_format,
            case_format: game.case_format,
            custom_case_width: game.custom_case_width,
            custom_case_height: game.custom_case_height,
            disc_count: game.disc_count,
          },
          images: [],
        };
      })
      .filter(Boolean);

    return jsonResponse({
      share: {
        scope_type: share.scope_type,
        name: collectionInfo.name,
        description: collectionInfo.description,
        owner_username:
          String(profile?.username || "").trim() || "Shelfmark collector",
        show_photos: share.show_photos,
        show_estimated_value: share.show_estimated_value,
        show_purchase_price: share.show_purchase_price,
        show_purchase_date: share.show_purchase_date,
        show_value_difference: share.show_value_difference,
        updated_at: share.updated_at,
      },
      items,
    });
  } catch (error) {
    console.error("Shelfmark shared-collection unexpected error:", error);
    return jsonResponse({ error: "Unable to load share" }, 500);
  }
});
