"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import { useRouter } from "next/navigation";

interface PublishButtonProps {
  campaignId: string;
}

export function PublishButton({ campaignId }: PublishButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePublish = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/publish`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Failed to publish: ${error.error}`);
        return;
      }

      const result = await response.json();
      router.refresh();
      
      if (result.status === "LIVE") {
        alert("Campaign published successfully!");
      } else {
        alert("Approvals triggered. Waiting for approvals to complete.");
      }
    } catch (error) {
      console.error("Error publishing campaign:", error);
      alert("Failed to publish campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handlePublish} disabled={loading}>
      <Rocket className="mr-2 h-4 w-4" />
      {loading ? "Publishing..." : "Publish"}
    </Button>
  );
}

