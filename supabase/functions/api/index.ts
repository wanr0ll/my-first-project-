import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
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
const BREVO_SENDER_EMAIL = Deno.env.get("BREVO_SENDER_EMAIL") || Deno.env.get("SMTP_FROM") || "noreply@gha.gov.gh";
const BREVO_SENDER_NAME = Deno.env.get("BREVO_SENDER_NAME") || Deno.env.get("SMTP_FROM_NAME") || "Ghana Highway Authority";

async function sendEmailViaBrevo(to: string, subject: string, htmlContent: string): Promise<boolean> {
    if (!BREVO_API_KEY) {
        console.warn(`[Mail] BREVO_API_KEY not configured. Email to ${to} was not sent.`);
        return false;
    }

    try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": BREVO_API_KEY,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                sender: {
                    name: BREVO_SENDER_NAME,
                    email: BREVO_SENDER_EMAIL,
                },
                to: [{ email: to }],
                subject,
                htmlContent,
            }),
        });

        if (response.status === 201 || response.ok) {
            console.log(`[Mail] Email sent successfully to ${to} via Brevo`);
            return true;
        }

        const errText = await response.text();
        console.error(`[Mail] Brevo API error (Status ${response.status}):`, errText);
        return false;
    } catch (err: any) {
        console.error(`[Mail] Network error while sending email to ${to}:`, err.message);
        return false;
    }
}

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

// POST /auth/forgot-password
app.post("/auth/forgot-password", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { email } = body;

    if (!email) {
        return error(c, "Email is required", 400);
    }

    const { data: user } = await supabase
        .from("users")
        .select("id, name, email")
        .ilike("email", email.trim())
        .maybeSingle();

    if (!user) {
        // Return success for security to avoid email enumeration
        return success(c, null, "If your account is registered, you will receive reset instructions.");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await supabase
        .from("users")
        .update({
            reset_token: otp,
            reset_token_expiry: expiry,
        })
        .eq("id", user.id);

    const subject = "Password Reset Request - Ghana Highway Authority";
    const emailMessage = `
        <div style='font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);'>
            <table role='presentation' width='100%' border='0' cellspacing='0' cellpadding='0' style='background-color: #1e293b !important; background: #1e293b !important;'>
                <tr>
                    <td bgcolor='#1e293b' align='center' style='background-color: #1e293b !important; padding: 26px 12px; border-bottom: 4px solid #f59e0b; text-align: center;'>
                        <h1 style='color: #ffffff !important; margin: 0; font-size: 18px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 800; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;'>
                            Ghana Highway Authority
                        </h1>
                        <p style='color: #94a3b8 !important; margin: 6px 0 0; font-size: 12px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;'>
                            Asset Management System
                        </p>
                    </td>
                </tr>
            </table>
            <div style='padding: 40px 30px;'>
                <h2 style='color: #1e293b; margin: 0 0 20px; font-size: 20px;'>Password Reset Request</h2>
                <p style='color: #475569; line-height: 1.6; margin: 0 0 20px;'>Hello <strong>${user.name}</strong>,</p>
                <p style='color: #475569; line-height: 1.6; margin: 0 0 30px;'>We received a request to reset the password for your Ghana Highway Authority Asset Management System account. Please use the verification code below to proceed:</p>
                <div style='background-color: #f1f5f9; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 30px; border: 1px dashed #cbd5e1;'>
                    <span style='font-family: "Courier New", Courier, monospace; font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #2563eb;'>${otp}</span>
                </div>
                <p style='color: #64748b; font-size: 14px; margin: 0 0 10px;'>This code will expire in <strong>1 hour</strong>.</p>
                <p style='color: #64748b; font-size: 14px; margin: 0;'>If you did not request this reset, you can safely ignore this email.</p>
            </div>
            <div style='background-color: #f8fafc; padding: 25px 30px; border-top: 1px solid #e2e8f0; text-align: center;'>
                <p style='color: #94a3b8; font-size: 12px; margin: 0 0 10px;'>&copy; ${new Date().getFullYear()} Ghana Highway Authority. All rights reserved.</p>
            </div>
        </div>
    `;

    const mailSent = await sendEmailViaBrevo(user.email, subject, emailMessage);
    return success(c, { email_sent: mailSent }, "A password reset email has been sent to your registered address.");
});

// POST /auth/verify-reset-otp
app.post("/auth/verify-reset-otp", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { token } = body;

    if (!token) {
        return error(c, "OTP token is required", 400);
    }

    const { data: user } = await supabase
        .from("users")
        .select("id, email, reset_token_expiry")
        .eq("reset_token", token.trim())
        .maybeSingle();

    if (!user) {
        return error(c, "Invalid or expired OTP", 400);
    }

    if (user.reset_token_expiry && new Date(user.reset_token_expiry) < new Date()) {
        return error(c, "OTP has expired. Please request a new one.", 400);
    }

    return success(c, null, "OTP verified successfully");
});

// POST /auth/reset-password
app.post("/auth/reset-password", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { token, password } = body;

    if (!token || !password) {
        return error(c, "Token and new password are required", 400);
    }

    if (password.length < 8) {
        return error(c, "Password must be at least 8 characters", 400);
    }

    const { data: user } = await supabase
        .from("users")
        .select("id, reset_token_expiry")
        .eq("reset_token", token.trim())
        .maybeSingle();

    if (!user) {
        return error(c, "Invalid or expired reset token", 400);
    }

    if (user.reset_token_expiry && new Date(user.reset_token_expiry) < new Date()) {
        return error(c, "Reset token has expired. Please request a new one.", 400);
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const { error: updErr } = await supabase
        .from("users")
        .update({
            password: hashedPassword,
            reset_token: null,
            reset_token_expiry: null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

    if (updErr) {
        return error(c, `Failed to reset password: ${updErr.message}`, 500);
    }

    return success(c, null, "Password has been reset successfully. You can now login.");
});

// PUT & POST /auth/change-password
const handleChangePassword = async (c: any) => {
    const authUser = await authenticate(c);
    if (!authUser) return error(c, "Unauthorized", 401);

    const body = await c.req.json().catch(() => ({}));
    const { current_password, new_password } = body;

    if (!current_password || !new_password) {
        return error(c, "Current and new password are required", 400);
    }

    const { data: user } = await supabase
        .from("users")
        .select("id, password")
        .eq("id", authUser.id)
        .maybeSingle();

    if (!user) return error(c, "User not found", 404);

    const isMatch = bcrypt.compareSync(current_password, user.password);
    if (!isMatch) {
        return error(c, "Current password is incorrect", 401);
    }

    if (new_password.length < 8) {
        return error(c, "New password must be at least 8 characters", 400);
    }

    const hashedPassword = bcrypt.hashSync(new_password, 10);
    const { error: updErr } = await supabase
        .from("users")
        .update({
            password: hashedPassword,
            updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

    if (updErr) return error(c, updErr.message, 500);
    return success(c, null, "Password changed successfully");
};

app.put("/auth/change-password", handleChangePassword);
app.post("/auth/change-password", handleChangePassword);

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
    if (body.permissions !== undefined) {
        if (typeof body.permissions === "string") {
            try {
                updates.permissions = JSON.parse(body.permissions);
            } catch {
                updates.permissions = body.permissions;
            }
        } else {
            updates.permissions = body.permissions;
        }
    }
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

// Field mapping and schema whitelist for asset operations
const ASSET_FIELD_MAPPING: Record<string, string> = {
    majorCategory: "major_category",
    assetType: "asset_type",
    category: "category",
    subType: "sub_type",
    approvalStatus: "approval_status",
    ownerDivision: "owner_division",
    custodianName: "custodian_name",
    custodianID: "custodian_id",
    cost: "purchase_cost",
    purchaseDate: "purchase_date",
    lastService: "last_service_date",
    lastInspection: "last_inspection_date",
    serial: "serial_number",
    plate: "plate_number",
    chassis: "chassis_number",
    engine: "engine_number",
    usefulLife: "useful_life",
    residualValue: "residual_value",
    details: "notes",
    sizes: "sizes",
    color: "color",
    roomNo: "room_number",
    deskNo: "desk_number",
    roomName: "room_name",
    staffAssignedTo: "staff_assigned_to",
    staffID: "staff_id",
    type: "type",
    custodianAddress: "custodian_address",
    custodianMobile: "custodian_mobile",
    brandName: "brand_name",
    model: "model",
    assetTag: "asset_tag",
    hasAssetTag: "has_asset_tag",
    memorySize: "memory_size",
    processor: "processor",
    generation: "generation",
    storageSize: "storage_size",
    routeName: "route_name",
    quantity: "quantity",
    capacity: "capacity",
    expiryDate: "expiry_date",
    warrantyExpiry: "warranty_expiry",
    receiptUrl: "receipt_url",
    chairMaterial: "chair_material",
    workstationMaterial: "workstation_material",
    partitionMaterial: "partition_material",
    batteryType: "battery_type",
    runtime: "runtime",
    numberOfFloors: "number_of_floors",
    numberOfSeats: "number_of_seats",
    bankName: "bank_name",
    accountNumber: "account_number",
    accountType: "account_type",
    branch: "branch",
    currency: "currency",
    balanceAmount: "balance_amount",
    yearOfManufacture: "year_of_manufacture",
    fuelType: "fuel_type",
    transmission: "transmission",
    engineSize: "engine_size",
    mileage: "mileage",
    ipAddress: "ip_address",
    portCount: "port_count",
    printerType: "printer_type",
    scannerType: "scanner_type",
    licenseType: "license_type",
    softwareVersion: "software_version",
    licenseKey: "license_key",
    vendor: "vendor",
    createdBy: "created_by",
    createdAt: "created_at",
    updatedAt: "updated_at",
    // Land & Buildings and Infrastructure fields
    gpsCoordinates: "gps_coordinates",
    yearBuilt: "year_built",
    numRooms: "num_rooms",
    starRating: "star_rating",
    numUnits: "num_units",
    accommodationType: "accommodation_type",
    seatingCapacity: "seating_capacity",
    roadLength: "road_length",
    roadWidth: "road_width",
    surfaceType: "surface_type",
    bridgeLength: "bridge_length",
    bridgeWidth: "bridge_width",
    loadCapacity: "load_capacity",
    bridgeType: "bridge_type",
    numLanes: "num_lanes",
    interchangeType: "interchange_type",
    yearOfCommencement: "year_of_commencement",
    contractor: "contractor",
    supervisors: "supervisors",
    commissionedBy: "commissioned_by",
    lastMaintenanceType: "last_maintenance_type",
    lastMaintenanceDate: "last_maintenance_date",
    estimatedResidualLife: "estimated_residual_life",
    layerThickness: "layer_thickness",
};

const ALLOWED_ASSET_COLUMNS = new Set([
    "id", "name", "major_category", "asset_type", "category", "sub_type", "status",
    "division", "owner_division", "custodian_name", "custodian_id", "location",
    "purchase_date", "purchase_cost", "useful_life", "residual_value",
    "last_service_date", "last_inspection_date", "approval_status", "notes",
    "image", "serial_number", "plate_number", "chassis_number", "engine_number",
    "sizes", "color", "room_number", "desk_number", "room_name", "staff_assigned_to",
    "staff_id", "type", "custodian_address", "custodian_mobile", "brand_name",
    "model", "asset_tag", "has_asset_tag", "memory_size", "processor", "generation",
    "storage_size", "route_name", "quantity", "capacity", "expiry_date",
    "warranty_expiry", "receipt_url", "chair_material", "workstation_material",
    "partition_material", "battery_type", "runtime", "number_of_floors",
    "number_of_seats", "bank_name", "account_number", "account_type", "branch",
    "currency", "balance_amount", "year_of_manufacture", "fuel_type",
    "transmission", "engine_size", "mileage", "ip_address", "port_count",
    "printer_type", "scanner_type", "license_type", "software_version",
    "license_key", "vendor", "created_at", "updated_at", "created_by",
    "gps_coordinates", "year_built", "num_rooms", "star_rating", "num_units",
    "accommodation_type", "seating_capacity", "road_length", "road_width",
    "surface_type", "bridge_length", "bridge_width", "load_capacity",
    "bridge_type", "num_lanes", "interchange_type", "year_of_commencement",
    "contractor", "supervisors", "commissioned_by", "last_maintenance_type",
    "last_maintenance_date", "estimated_residual_life", "layer_thickness"
]);

const NUMERIC_COLUMNS = new Set([
    "purchase_cost", "useful_life", "residual_value", "quantity",
    "balance_amount", "year_of_manufacture", "year_built", "num_rooms",
    "num_units", "year_of_commencement"
]);

const DATE_COLUMNS = new Set([
    "purchase_date", "last_service_date", "last_inspection_date",
    "expiry_date", "warranty_expiry", "last_maintenance_date"
]);

function sanitizeAssetPayload(data: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};

    for (const [rawKey, rawVal] of Object.entries(data)) {
        const key = ASSET_FIELD_MAPPING[rawKey] || rawKey;
        if (!ALLOWED_ASSET_COLUMNS.has(key)) {
            continue; // Skip fields not present in schema
        }

        let val = rawVal;
        if (val === "" || val === undefined) {
            val = null;
        } else if (NUMERIC_COLUMNS.has(key)) {
            const num = Number(val);
            val = isNaN(num) ? null : num;
        } else if (DATE_COLUMNS.has(key) && val) {
            if (typeof val === "string" && (val.startsWith("0000") || val.trim() === "")) {
                val = null;
            }
        }

        cleaned[key] = val;
    }

    return cleaned;
}

// POST /assets
app.post("/assets", async (c) => {
    const authUser = await authenticate(c);
    if (!authUser) return error(c, "Unauthorized", 401);

    const body = await c.req.json().catch(() => ({}));
    if (!body.name || !body.category) {
        return error(c, "Name and category are required", 400);
    }

    const assetId = body.id || generateId("AST");
    const rawAsset = {
        ...body,
        id: assetId,
        major_category: body.majorCategory || body.major_category || "Fixed Asset",
        asset_type: body.assetType || body.asset_type || "Moveable",
        approval_status: body.approval_status || body.approvalStatus || "Pending",
        created_by: authUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    const newAsset = sanitizeAssetPayload(rawAsset);

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

    const updates = sanitizeAssetPayload({
        ...body,
        updated_at: new Date().toISOString(),
    });
    delete updates.id;

    if (Object.keys(updates).length === 0) {
        return error(c, "No valid fields provided for update", 400);
    }

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
