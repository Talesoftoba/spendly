import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth"; 
import { prisma } from "@/app/lib/prisma"; 
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check env vars exist
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing Supabase env vars");
    return Response.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file || typeof file === "string") {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { error: "Only JPEG, PNG, WebP or GIF allowed" },
        { status: 400 }
      );
    }

    // Validate size — 2MB max
    if (file.size > 2 * 1024 * 1024) {
      return Response.json(
        { error: "File must be smaller than 2MB" },
        { status: 400 }
      );
    }

    // Use user ID as filename so each user only ever has one avatar
    const ext = file.name.split(".").pop() ?? "jpg";
    const fileName = `${session.user.id}.${ext}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload — upsert:true overwrites existing avatar
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return Response.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    // Add cache buster so the browser shows the new image immediately
    const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;

    // Save to database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl },
    });

    return Response.json({ success: true, avatarUrl });

  } catch (error) {
    console.error("Avatar upload error:", error);
    return Response.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}