import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",

  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,

    headers: {
      ...corsHeaders,

      "Content-Type": "application/json",
    },
  });
}

function getEnvironmentKey(jsonName: string, legacyName: string) {
  const jsonValue = Deno.env.get(jsonName);

  if (jsonValue) {
    try {
      const parsed = JSON.parse(jsonValue);

      if (parsed?.default) {
        return parsed.default;
      }
    } catch {
      /* Fall through. */
    }
  }

  return Deno.env.get(legacyName) || "";
}

async function collectStoragePaths(
  supabaseAdmin: ReturnType<typeof createClient>,
  prefix: string,
) {
  const paths: string[] = [];

  let offset = 0;

  while (true) {
    const { data, error } = await supabaseAdmin.storage
      .from("item-images")
      .list(prefix, {
        limit: 1000,
        offset,

        sortBy: {
          column: "name",
          order: "asc",
        },
      });

    if (error) {
      throw error;
    }

    const entries = data || [];

    for (const entry of entries) {
      const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;

      /*
        Supabase returns folder entries
        with id === null.
      */

      if (entry.id === null) {
        const nested = await collectStoragePaths(supabaseAdmin, fullPath);

        paths.push(...nested);
      } else {
        paths.push(fullPath);
      }
    }

    if (entries.length < 1000) {
      break;
    }

    offset += entries.length;
  }

  return paths;
}

async function removeStorageFiles(
  supabaseAdmin: ReturnType<typeof createClient>,
  paths: string[],
) {
  const batchSize = 1000;

  for (let index = 0; index < paths.length; index += batchSize) {
    const batch = paths.slice(index, index + batchSize);

    const { error } = await supabaseAdmin.storage
      .from("item-images")
      .remove(batch);

    if (error) {
      throw error;
    }
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      {
        error: "Method not allowed.",
      },
      405,
    );
  }

  try {
    const authorization = request.headers.get("Authorization");

    if (!authorization) {
      return jsonResponse(
        {
          error: "Authentication required.",
        },
        401,
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    const publishableKey = getEnvironmentKey(
      "SUPABASE_PUBLISHABLE_KEYS",
      "SUPABASE_ANON_KEY",
    );

    const secretKey = getEnvironmentKey(
      "SUPABASE_SECRET_KEYS",
      "SUPABASE_SERVICE_ROLE_KEY",
    );

    if (!supabaseUrl || !publishableKey || !secretKey) {
      throw new Error("Supabase environment is incomplete.");
    }

    /* ==================================
         AUTHENTICATE CALLER
      ================================== */

    const supabaseUser = createClient(supabaseUrl, publishableKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },

      auth: {
        persistSession: false,

        autoRefreshToken: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return jsonResponse(
        {
          error: "Invalid account session.",
        },
        401,
      );
    }

    /* ==================================
         ADMIN CLIENT
      ================================== */

    const supabaseAdmin = createClient(supabaseUrl, secretKey, {
      auth: {
        persistSession: false,

        autoRefreshToken: false,
      },
    });

    /* ==================================
         REMOVE STORAGE
      ================================== */

    const storagePaths = await collectStoragePaths(supabaseAdmin, user.id);

    if (storagePaths.length) {
      await removeStorageFiles(supabaseAdmin, storagePaths);
    }

    /* ==================================
         COLLECTION DATA
      ================================== */

    const { error: collectionError } = await supabaseAdmin
      .from("collection_items")
      .delete()
      .eq("user_id", user.id);

    if (collectionError) {
      throw collectionError;
    }

    /*
        games + item_images should already
        disappear through your existing
        collection_items cascades.
      */

    /* ==================================
         PROFILE
      ================================== */

    const profileById = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", user.id);

    /*
        Some schemas use user_id instead
        of id for profiles. If yours does,
        fall back to that field.
      */

    if (profileById.error) {
      const profileByUserId = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("user_id", user.id);

      if (profileByUserId.error) {
        console.warn("Profile row cleanup failed:", profileByUserId.error);
      }
    }

    /* ==================================
         AUTH USER
      ================================== */

    const { error: deleteUserError } =
      await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      throw deleteUserError;
    }

    return jsonResponse({
      deleted: true,
    });
  } catch (error) {
    console.error("Shelfmark account deletion error:", error);

    return jsonResponse(
      {
        error: "The account could not be deleted.",
      },
      500,
    );
  }
});
