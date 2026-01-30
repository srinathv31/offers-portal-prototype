import { Suspense } from "react";
import { getAllDocuments } from "@/lib/db";
import { getSignedUrl } from "@/lib/supabase/storage";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentsTable } from "./documents-table";

export const dynamic = "force-dynamic";

async function DocumentsContent() {
  const documents = await getAllDocuments();

  const documentsWithUrls = await Promise.all(
    documents.map(async (doc) => {
      let downloadUrl: string | null = null;
      try {
        downloadUrl = await getSignedUrl(doc.storagePath);
      } catch {
        // ignore signing errors
      }
      return {
        ...doc,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        downloadUrl,
        linkedOffers: doc.offerDisclosures.map((od) => ({
          id: od.offer.id,
          name: od.offer.name,
        })),
      };
    })
  );

  return <DocumentsTable initialDocuments={documentsWithUrls} />;
}

function DocumentsSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<DocumentsSkeleton />}>
        <DocumentsContent />
      </Suspense>
    </div>
  );
}
