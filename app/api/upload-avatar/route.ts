import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth"; 
import { prisma } from "@/app/lib/prisma";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with service role key
// so it can bypass RLS policies
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { error: "Only JPEG, PNG, WebP and GIF files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size — max 2MB
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return Response.json(
        { error: "File must be smaller than 2MB" },
        { status: 400 }
      );
    }

    // Create unique filename using user ID
    const ext = file.name.split(".").pop();
    const fileName = `${session.user.id}.${ext}`;

    // Convert file to buffer
    const buffer = await file.arrayBuffer();

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true, // overwrite if exists
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return Response.json({ error: "Upload failed" }, { status: 500 });
    }

    // Get the public URL
    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const avatarUrl = data.publicUrl;

    // Save URL to user in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl },
    });

    return Response.json({ success: true, avatarUrl });

  } catch (error) {
    console.error("Avatar upload error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}