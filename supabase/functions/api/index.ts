import { Hono } from "jsr:@hono/hono";
import { cors } from "jsr:@hono/hono/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import bcrypt from "npm:bcryptjs";
import jwt from "npm:jsonwebtoken";

const app = new Hono();

// ============================================================
// 1. Environment & Supabase Client
// ============================================================
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const JWT_SECRET = Deno.env.get("JWT_SECRET") || "gha_asset_manager_secret_key_2026";
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") || "";

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn("Notice: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined in Edge Function environment.");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

// ============================================================
// 2. CORS Middleware
// ============================================================
app.use(
    "*",
    cors({
        origin: "*",
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
        exposeHeaders: ["Content-Length"],
        maxAge: 86400,
    })
);

// Helper response functions
const success = (c: any, data: any = null, message = "Success", status = 200, pagination: any = null) => {
    const payload: any = { success: true, message, data };
    if (pagination) payload.pagination = pagination;
    return c.json(payload, status);
};

const error = (c: any, message = "Error", status = 400, errors: any = null) => {
    return c.json({ success: false, message, errors, data: null }, status);
};

// Authentication helper
const authenticate = async (c: any) => {
    const authHeader = c.req.header("Authorization") || c.req.header("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return decoded;
    } catch {
        return null;
    }
};

// ID generator
const generateId = (prefix = "AST") => {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

// ============================================================
// 3. Health Check
// ============================================================
const handleHealth = (c: any) => {
    return success(
        c,
        {
            status: "ok",
            service: "gha-asset-manager-supabase-edge",
            timestamp: new Date().toISOString(),
        },
        "API is healthy (Supabase Edge Function)"
    );
};

app.get("/", handleHealth);
app.get("/health", handleHealth);
app.get("/api", handleHealth);
app.get("/api/health", handleHealth);

// ============================================================
// 4. Authentication Endpoints
// ============================================================

// POST /auth/login
app.post("/auth/login", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
        return error(c, "Email and password are required", 400);
    }

    const { data: user, error: dbErr } = await supabase
        .from("users")
        .select("*")
        .ilike("email", email.trim())
        .maybeSingle();

    if (dbErr || !user) {
        return error(c, "Invalid credentials", 401);
    }

    // Verify password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
        return error(c, "Invalid credentials", 401);
    }

    if (user.email_verified === false || user.email_verified === 0) {
        return error(c, "Please verify your email address to activate your account.", 403);
    }

    if (user.status === "pending") {
        return error(c, "Your account is pending approval. Please contact an administrator.", 403);
    }

    if (user.status === "suspended") {
        return error(c, "Your account has been suspended. Please contact an administrator.", 403);
    }

    // Update last_active timestamp
    supabase
        .from("users")
        .update({ last_active: new Date().toISOString() })
        .eq("id", user.id)
        .then(() => {});

    // Generate JWT
    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            division: user.division,
            name: user.name,
        },
        JWT_SECRET,
        { expiresIn: "24h" }
    );

    return success(
        c,
        {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                division: user.division,
                status: user.status,
                permissions: user.permissions || null,
                profile_image: user.profile_image || null,
            },
            token,
            expires_in: 86400,
        },
        "Login successful"
    );
});

// POST /auth/register
app.post("/auth/register", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { name, email, password, role = "Worker", division = "General", position = null, phone = null } = body;

    if (!name || !email || !password) {
        return error(c, "Name, email and password are required", 400);
    }

    // Check duplicate
    const { data: existing } = await supabase
        .from("users")
        .select("id")
        .ilike("email", email.trim())
        .maybeSingle();

    if (existing) {
        return error(c, "Email already exists", 409);
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userId = generateId("USR");

    const newUser = {
        id: userId,
        name,
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role,
        division,
        position,
        phone,
        status: "active",
        email_verified: true, // Auto-verified for seamless onboard
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    const { error: insertErr } = await supabase.from("users").insert(newUser);
    if (insertErr) {
        return error(c, `Registration failed: ${insertErr.message}`, 500);
    }

    const token = jwt.sign(
        { id: userId, email: newUser.email, role: newUser.role, name: newUser.name },
        JWT_SECRET,
        { expiresIn: "24h" }
    );

    return success(
        c,
        {
            user: {
                id: userId,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                division: newUser.division,
            },
            token,
        },
        "Registration successful",
        201
    );
});

// GET /auth/me
app.get("/auth/me", async (c) => {
    const user = await authenticate(c);
    if (!user) return error(c, "Unauthorized", 401);

    const { data: dbUser } = await supabase
        .from("users")
        .select("id, name, email, role, division, position, phone, status, profile_image, permissions, created_at")
        .eq("id", user.id)
        .maybeSingle();

    if (!dbUser) return error(c, "User not found", 404);

    // Return the user object flat (same shape as login response) to match what AuthContext expects
    return success(c, dbUser);
});

// POST /auth/logout
app.post("/auth/logout", (c) => {
    return success(c, null, "Logged out successfully");
});

// ============================================================
// 5. User Management Endpoints
// ============================================================

// GET /users
app.get("/users", async (c) => {
    const authUser = await authenticate(c);
    if (!authUser) return error(c, "Unauthorized", 401);

    const query = c.req.query();
    const id = query.id;

    if (id) {
        const { data: user, error: uErr } = await supabase
            .from("users")
            .select("id, name, email, role, division, position, phone, status, profile_image, permissions, created_at, last_active")
            .eq("id", id)
            .maybeSingle();

        if (uErr || !user) return error(c, "User not found", 404);
        return success(c, user);
    }

    const page = parseInt(query.page || "1", 10);
    const perPage = parseInt(query.per_page || "10", 10);
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let dbQuery = supabase
        .from("users")
        .select("id, name, email, role, division, position, phone, status, profile_image, permissions, created_at, last_active", { count: "exact" });

    if (query.role) dbQuery = dbQuery.eq("role", query.role);
    if (query.division) dbQuery = dbQuery.eq("division", query.division);
    if (query.status) dbQuery = dbQuery.eq("status", query.status);
    if (query.search) {
        dbQuery = dbQuery.or(`name.ilike.%${query.search}%,email.ilike.%${query.search}%`);
    }

    const { data: users, count, error: qErr } = await dbQuery
        .order("created_at", { ascending: false })
        .range(from, to);

    if (qErr) return error(c, qErr.message, 500);

    const total = count || 0;
    return success(c, users, "Users retrieved successfully", 200, {
        total,
        page,
        per_page: perPage,
        total_pages: Math.ceil(total / perPage),
    });
});

// POST /users
app.post("/users", async (c) => {
    const authUser = await authenticate(c);
    if (!authUser) return error(c, "Unauthorized", 401);

    const body = await c.req.json().catch(() => ({}));
    const { name, email, password, role = "Worker", division = "General", position = null, phone = null } = body;

    if (!name || !email || !password) {
        return error(c, "Name, email and password are required", 400);
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userId = generateId("USR");

    const newUser = {
        id: userId,
        name,
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role,
        division,
        position,
        phone,
        status: "active",
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    const { error: insertErr } = await supabase.from("users").insert(newUser);
    if (insertErr) return error(c, insertErr.message, 500);

    return success(c, { id: userId }, "User created successfully", 201);
});

// PUT /users
app.put("/users", async (c) => {
    const authUser = await authenticate(c);
    if (!authUser) return error(c, "Unauthorized", 401);

    const body = await c.req.json().catch(() => ({}));
    const id = body.id || c.req.query("id");
    if (!id) return error(c, "User ID is required", 400);

    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.role !== undefined) updates.role = body.role;
    if (body.division !== undefined) updates.division = body.division;
    if (body.position !== undefined) updates.position = body.position;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.status !== undefined) updates.status = body.status;
    if (body.password) updates.password = bcrypt.hashSync(body.password, 10);
    updates.updated_at = new Date().toISOString();

    const { error: updErr } = await supabase.from("users").update(updates).eq("id", id);
    if (updErr) return error(c, updErr.message, 500);

    return success(c, null, "User updated successfully");
});

// DELETE /users/:id
app.delete("/users/:id", async (c) => {
    const authUser = await authenticate(c);
    if (!authUser) return error(c, "Unauthorized", 401);

    const id = c.req.param("id");
    if (!id) return error(c, "User ID is required", 400);

    const { error: delErr } = await supabase.from("users").delete().eq("id", id);
    if (delErr) return error(c, delErr.message, 500);

    return success(c, null, "User deleted successfully");
});

// POST /users/ping
app.post("/users/ping", async (c) => {
    const authUser = await authenticate(c);
    if (!authUser) return error(c, "Unauthorized", 401);

    await supabase
        .from("users")
        .update({ last_active: new Date().toISOString() })
        .eq("id", authUser.id);

    return success(c, null, "Ping updated");
});

// POST /users/upload_profile
app.post("/users/upload_profile", async (c) => {
    const authUser = await authenticate(c);
    if (!authUser) return error(c, "Unauthorized", 401);

    const body = await c.req.json().catch(() => ({}));
    const profileImage = body.profile_image;
    if (!profileImage) return error(c, "profile_image base64 data required", 400);

    const { error: updErr } = await supabase
        .from("users")
        .update({ profile_image: profileImage, updated_at: new Date().toISOString() })
        .eq("id", authUser.id);

    if (updErr) return error(c, updErr.message, 500);

    return success(c, { profile_image: profileImage }, "Profile picture updated successfully");
});

// ============================================================
// 6. Asset Management Endpoints
// ============================================================

// GET /assets and /assets/:category
const handleGetAssets = async (c: any) => {
    const authUser = await authenticate(c);
    if (!authUser) return error(c, "Unauthorized", 401);

    const query = c.req.query();
    const id = query.id;

    if (id) {
        const { data: asset, error: aErr } = await supabase
            .from("assets")
            .select("*")
            .eq("id", id)
            .maybeSingle();

        if (aErr || !asset) return error(c, "Asset not found", 404);
        return success(c, asset);
    }

    const page = parseInt(query.page || "1", 10);
    const perPage = parseInt(query.per_page || "1000", 10);
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let dbQuery = supabase.from("assets").select("*", { count: "exact" });

    const categoryParam = c.req.param("category") || query.category;
    if (categoryParam && categoryParam !== "all") {
        dbQuery = dbQuery.eq("category", categoryParam);
    }

    if (query.majorCategory || query.major_category) {
        dbQuery = dbQuery.eq("major_category", query.majorCategory || query.major_category);
    }
    if (query.status) dbQuery = dbQuery.eq("status", query.status);
    if (query.division) dbQuery = dbQuery.eq("division", query.division);
    if (query.search) {
        dbQuery = dbQuery.or(`name.ilike.%${query.search}%,id.ilike.%${query.search}%,serial_number.ilike.%${query.search}%`);
    }

    const { data: assets, count, error: qErr } = await dbQuery
        .order("created_at", { ascending: false })
        .range(from, to);

    if (qErr) return error(c, qErr.message, 500);

    const total = count || 0;
    return success(c, assets || [], "Assets retrieved successfully", 200, {
        total,
        page,
        per_page: perPage,
        total_pages: Math.ceil(total / perPage),
    });
};

app.get("/assets", handleGetAssets);
app.get("/assets/:category", handleGetAssets);

// POST /assets
app.post("/assets", async (c) => {
    const authUser = await authenticate(c);
    if (!authUser) return error(c, "Unauthorized", 401);

    const body = await c.req.json().catch(() => ({}));
    if (!body.name || !body.category) {
        return error(c, "Name and category are required", 400);
    }

    const assetId = body.id || generateId("AST");
    const newAsset = {
        ...body,
        id: assetId,
        major_category: body.majorCategory || body.major_category || "Fixed Asset",
        asset_type: body.assetType || body.asset_type || "Moveable",
        approval_status: "Pending",
        created_by: authUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    // Clean camelCase duplicate props
    delete (newAsset as any).majorCategory;
    delete (newAsset as any).assetType;

    const { error: insErr } = await supabase.from("assets").insert(newAsset);
    if (insErr) return error(c, insErr.message, 500);

    // Audit log
    supabase
        .from("asset_history")
        .insert({
            asset_id: assetId,
            asset_type: newAsset.asset_type || "Asset",
            action: "Asset Registered",
            description: `New asset '${newAsset.name}' registered by ${authUser.name || authUser.email}`,
            performed_by: authUser.id,
        })
        .then(() => {});

    return success(c, { id: assetId }, "Asset created successfully", 201);
});

// PUT /assets and PUT /assets/transfer
app.put("/assets", async (c) => {
    const authUser = await authenticate(c);
    if (!authUser) return error(c, "Unauthorized", 401);

    const body = await c.req.json().catch(() => ({}));
    const id = body.id || c.req.query("id");
    if (!id) return error(c, "Asset ID is required", 400);

    const updates = {
        ...body,
        updated_at: new Date().toISOString(),
    };
    delete updates.id;

    const { error: updErr } = await supabase.from("assets").update(updates).eq("id", id);
    if (updErr) return error(c, updErr.message, 500);

    return success(c, null, "Asset updated successfully");
});

app.put("/assets/transfer", async (c) => {
    const authUser = await authenticate(c);
    if (!authUser) return error(c, "Unauthorized", 401);

    const body = await c.req.json().catch(() => ({}));
    const id = body.id || c.req.query("id");
    if (!id) return error(c, "Asset ID is required", 400);

    const updates = {
        division: body.division,
        location: body.location,
        custodian_name: body.custodianName || body.custodian_name,
        updated_at: new Date().toISOString(),
    };

    const { error: updErr } = await supabase.from("assets").update(updates).eq("id", id);
    if (updErr) return error(c, updErr.message, 500);

    // Audit log
    supabase
        .from("asset_history")
        .insert({
            asset_id: id,
            asset_type: "Asset",
            action: "Asset Transferred",
            description: `Asset transferred to division '${body.division}', location '${body.location}'`,
            performed_by: authUser.id,
        })
        .then(() => {});

    return success(c, null, "Asset transferred successfully");
});

// DELETE /assets and /assets/:category
const handleDeleteAsset = async (c: any) => {
    const authUser = await authenticate(c);
    if (!authUser) return error(c, "Unauthorized", 401);

    const id = c.req.param("id") || c.req.query("id");
    if (!id) return error(c, "Asset ID is required", 400);

    const { error: delErr } = await supabase.from("assets").delete().eq("id", id);
    if (delErr) return error(c, delErr.message, 500);

    return success(c, null, "Asset deleted successfully");
};

app.delete("/assets", handleDeleteAsset);
app.delete("/assets/:category", handleDeleteAsset);
app.delete("/assets/:category/:id", handleDeleteAsset);

// POST /assets/import (Bulk Import)
app.post("/assets/import", async (c) => {
    const authUser = await authenticate(c);
    if (!authUser) return error(c, "Unauthorized", 401);

    const body = await c.req.json().catch(() => ({}));
    const assetsList = body.assets;

    if (!Array.isArray(assetsList) || assetsList.length === 0) {
        return error(c, "No assets provided", 400);
    }

    const formattedAssets = assetsList.map((a: any) => ({
        ...a,
        id: a.id || generateId("AST"),
        major_category: a.majorCategory || a.major_category || "Fixed Asset",
        asset_type: a.assetType || a.asset_type || "Moveable",
        approval_status: "Pending",
        created_by: authUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }));

    const { error: insErr } = await supabase.from("assets").insert(formattedAssets);
    if (insErr) return error(c, insErr.message, 500);

    return success(
        c,
        { total: formattedAssets.length, success: formattedAssets.length },
        `Successfully imported ${formattedAssets.length} assets`
    );
});

// ============================================================
// 7. Maintenance Tasks Endpoints
// ============================================================

// GET /maintenance
app.get("/maintenance", async (c) => {
    const authUser = await authenticate(c);
    if (!authUser) return error(c, "Unauthorized", 401);

    const query = c.req.query();
    const id = query.id;

    if (id) {
        const { data: task, error: tErr } = await supabase
            .from("maintenance_tasks")
            .select("*")
            .eq("id", id)
            .maybeSingle();

        if (tErr || !task) return error(c, "Task not found", 404);
        return success(c, task);
    }

    const page = parseInt(query.page || "1", 10);
    const perPage = parseInt(query.per_page || "50", 10);
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let dbQuery = supabase.from("maintenance_tasks").select("*", { count: "exact" });
    if (query.status) dbQuery = dbQuery.eq("status", query.status);
    if (query.priority) dbQuery = dbQuery.eq("priority", query.priority);
    if (query.asset_id) dbQuery = dbQuery.eq("asset_id", query.asset_id);

    const { data: tasks, count, error: qErr } = await dbQuery
        .order("created_at", { ascending: false })
        .range(from, to);

    if (qErr) return error(c, qErr.message, 500);

    const total = count || 0;
    return success(c, tasks || [], "Tasks retrieved successfully", 200, {
        total,
        page,
        per_page: perPage,
        total_pages: Math.ceil(total / perPage),
    });
});

// POST /maintenance
app.post("/maintenance", async (c) => {
    const authUser = await authenticate(c);
    if (!authUser) return error(c, "Unauthorized", 401);

    const body = await c.req.json().catch(() => ({}));
    const taskId = body.id || generateId("MT");

    const newTask = {
        ...body,
        id: taskId,
        created_by: authUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    const { error: insErr } = await supabase.from("maintenance_tasks").insert(newTask);
    if (insErr) return error(c, insErr.message, 500);

    return success(c, { id: taskId }, "Maintenance task created successfully", 201);
});

// PUT /maintenance/:id
app.put("/maintenance/:id", async (c) => {
    const authUser = await authenticate(c);
    if (!authUser) return error(c, "Unauthorized", 401);

    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));

    const updates = { ...body, updated_at: new Date().toISOString() };
    delete updates.id;

    const { error: updErr } = await supabase.from("maintenance_tasks").update(updates).eq("id", id);
    if (updErr) return error(c, updErr.message, 500);

    return success(c, null, "Maintenance task updated successfully");
});

// DELETE /maintenance/:id
app.delete("/maintenance/:id", async (c) => {
    const authUser = await authenticate(c);
    if (!authUser) return error(c, "Unauthorized", 401);

    const id = c.req.param("id");
    const { error: delErr } = await supabase.from("maintenance_tasks").delete().eq("id", id);
    if (delErr) return error(c, delErr.message, 500);

    return success(c, null, "Maintenance task deleted successfully");
});

// ============================================================
// 8. History & Activity Endpoints
// ============================================================
const handleGetHistory = async (c: any) => {
    const authUser = await authenticate(c);
    if (!authUser) return error(c, "Unauthorized", 401);

    const limit = parseInt(c.req.query("limit") || "50", 10);
    const assetId = c.req.query("asset_id");

    let dbQuery = supabase.from("asset_history").select("*, users(name)");
    if (assetId) dbQuery = dbQuery.eq("asset_id", assetId);

    const { data: logs, error: hErr } = await dbQuery
        .order("performed_at", { ascending: false })
        .limit(limit);

    if (hErr) return error(c, hErr.message, 500);

    const formatted = (logs || []).map((l: any) => ({
        ...l,
        performed_by_name: l.users?.name || "System",
    }));

    return success(c, formatted, "Activity retrieved successfully");
};

app.get("/history", handleGetHistory);
app.get("/activity", handleGetHistory);

// ============================================================
// 9. Notifications Endpoints
// ============================================================
app.get("/notifications", async (c) => {
    const authUser = await authenticate(c);
    if (!authUser) return error(c, "Unauthorized", 401);

    const { data: notifs, error: nErr } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(50);

    if (nErr) return error(c, nErr.message, 500);

    return success(c, notifs || [], "Notifications retrieved");
});

app.put("/notifications/read-all", async (c) => {
    const authUser = await authenticate(c);
    if (!authUser) return error(c, "Unauthorized", 401);

    await supabase.from("notifications").update({ is_read: true }).eq("user_id", authUser.id);
    return success(c, null, "All notifications marked as read");
});

app.put("/notifications/:id/read", async (c) => {
    const authUser = await authenticate(c);
    if (!authUser) return error(c, "Unauthorized", 401);

    const id = c.req.param("id");
    await supabase.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", authUser.id);
    return success(c, null, "Notification marked as read");
});

// ============================================================
// 10. Legacy Query Param Dispatcher (?request=path)
// ============================================================
// If someone accesses /?request=auth/login or /api?request=assets
app.all("*", async (c) => {
    const reqParam = c.req.query("request");
    if (reqParam) {
        const cleanPath = reqParam.startsWith("/") ? reqParam : `/${reqParam}`;
        const newReq = new Request(new URL(cleanPath, c.req.url).toString(), {
            method: c.req.method,
            headers: c.req.raw.headers,
            body: c.req.raw.body,
        });
        return app.fetch(newReq);
    }
    return error(c, `Endpoint not found: ${c.req.method} ${c.req.path}`, 404);
});

// Export default for Supabase Edge Runtime with path normalization
Deno.serve(async (req: Request) => {
    const url = new URL(req.url);
    const originalPath = url.pathname;
    let normalizedPath = originalPath;

    // Strip Supabase Edge Function prefixes if present (/functions/v1/api or /api)
    if (normalizedPath.startsWith("/functions/v1/api")) {
        normalizedPath = normalizedPath.slice("/functions/v1/api".length);
    } else if (normalizedPath.startsWith("/functions/v1")) {
        normalizedPath = normalizedPath.slice("/functions/v1".length);
    } else if (normalizedPath.startsWith("/api")) {
        normalizedPath = normalizedPath.slice("/api".length);
    }

    if (!normalizedPath || normalizedPath === "") {
        normalizedPath = "/";
    }

    if (normalizedPath !== originalPath) {
        url.pathname = normalizedPath;
        const rewrittenReq = new Request(url.toString(), {
            method: req.method,
            headers: req.headers,
            body: (req.method === "GET" || req.method === "HEAD") ? undefined : req.body,
        });
        return app.fetch(rewrittenReq);
    }

    return app.fetch(req);
});
