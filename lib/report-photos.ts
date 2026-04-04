import { createClient } from "@/lib/supabase/client";
import type { PhotoItem } from "@/lib/report-templates/types";

const BUCKET = "report-photos";

function generatePath(tenantId: string, reportId: string, sectionId: string, fieldId: string, filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
    const id = crypto.randomUUID();
    return `${tenantId}/${reportId}/${sectionId}/${fieldId}/${id}.${ext}`;
}

export async function uploadReportPhoto(
    file: File,
    tenantId: string,
    reportId: string,
    sectionId: string,
    fieldId: string
): Promise<PhotoItem> {
    const supabase = createClient();
    const path = generatePath(tenantId, reportId, sectionId, fieldId, file.name);

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

    return {
        url: urlData.publicUrl,
        filename: file.name,
    };
}

export async function deleteReportPhoto(url: string): Promise<void> {
    const supabase = createClient();

    const bucketUrl = supabase.storage.from(BUCKET).getPublicUrl("").data.publicUrl;
    const path = url.replace(bucketUrl, "").replace(/^\//, "");

    if (path) {
        await supabase.storage.from(BUCKET).remove([path]);
    }
}
