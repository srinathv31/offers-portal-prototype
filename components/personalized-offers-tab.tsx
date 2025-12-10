"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OfferTypeBadge } from "@/components/offer-type-badge";
import {
  Mail,
  Smartphone,
  FileText,
  Store,
  Sparkles,
  CheckCircle,
  Clock,
  Send,
  Eye,
  MousePointerClick,
  AlertCircle,
  Loader2,
  ChevronRight,
  Zap,
} from "lucide-react";
import { format } from "date-fns";
import type { OfferType, AccountTier } from "@/lib/db/schema";

// Types matching the API response
type PersonalizedChannel = "EMAIL" | "IN_APP" | "LETTER" | "IN_STORE";
type OutreachStatus = "QUEUED" | "SENT" | "DELIVERED" | "ENGAGED" | "EXPIRED";
type Urgency = "LOW" | "MEDIUM" | "HIGH";

interface OutreachRecord {
  id: string;
  channel: PersonalizedChannel;
  offerName: string;
  offerType: OfferType;
  status: OutreachStatus;
  sentAt: string;
  deliveredAt?: string;
  engagedAt?: string;
  message: string;
  linkedCampaignId?: string;
  linkedCampaignName?: string;
}

interface PersonalizedOfferSuggestion {
  id: string;
  offerName: string;
  offerType: OfferType;
  reasoning: string;
  recommendedChannels: PersonalizedChannel[];
  linkedCampaignId?: string;
  linkedCampaignName?: string;
  urgency: Urgency;
  estimatedValue: number;
}

interface PersonalizedOffersTabProps {
  accountId: string;
  firstName: string;
  tier: AccountTier;
}

// Channel configuration
const channelConfig: Record<
  PersonalizedChannel,
  { icon: React.ReactNode; label: string; className: string }
> = {
  EMAIL: {
    icon: <Mail className="h-4 w-4" />,
    label: "Email",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  },
  IN_APP: {
    icon: <Smartphone className="h-4 w-4" />,
    label: "In-App",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  },
  LETTER: {
    icon: <FileText className="h-4 w-4" />,
    label: "Letter",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  },
  IN_STORE: {
    icon: <Store className="h-4 w-4" />,
    label: "In-Store",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  },
};

// Status configuration
const statusConfig: Record<
  OutreachStatus,
  { icon: React.ReactNode; label: string; className: string }
> = {
  QUEUED: {
    icon: <Clock className="h-3.5 w-3.5" />,
    label: "Queued",
    className: "text-gray-600 dark:text-gray-400",
  },
  SENT: {
    icon: <Send className="h-3.5 w-3.5" />,
    label: "Sent",
    className: "text-blue-600 dark:text-blue-400",
  },
  DELIVERED: {
    icon: <Eye className="h-3.5 w-3.5" />,
    label: "Delivered",
    className: "text-indigo-600 dark:text-indigo-400",
  },
  ENGAGED: {
    icon: <MousePointerClick className="h-3.5 w-3.5" />,
    label: "Engaged",
    className: "text-green-600 dark:text-green-400",
  },
  EXPIRED: {
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    label: "Expired",
    className: "text-muted-foreground",
  },
};

// Urgency configuration
const urgencyConfig: Record<Urgency, { label: string; className: string }> = {
  HIGH: {
    label: "High Priority",
    className: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  },
  MEDIUM: {
    label: "Medium",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  },
  LOW: {
    label: "Low",
    className:
      "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  },
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function PersonalizedOffersTab({
  accountId,
  firstName,
  tier,
}: PersonalizedOffersTabProps) {
  const [outreachHistory, setOutreachHistory] = useState<OutreachRecord[]>([]);
  const [suggestions, setSuggestions] = useState<PersonalizedOfferSuggestion[]>(
    []
  );
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [queuedOffers, setQueuedOffers] = useState<Set<string>>(new Set());
  const [selectedChannels, setSelectedChannels] = useState<
    Record<string, PersonalizedChannel>
  >({});

  // Fetch outreach history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(
          `/api/accounts/${accountId}/personalized-offers`
        );
        if (res.ok) {
          const data = await res.json();
          setOutreachHistory(data.outreachHistory || []);
        }
      } catch (error) {
        console.error("Failed to fetch outreach history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [accountId]);

  // Analyze account and generate suggestions
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch(
        `/api/accounts/${accountId}/personalized-offers`,
        {
          method: "POST",
        }
      );
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setHasAnalyzed(true);

        // Initialize selected channels for each suggestion
        const initialChannels: Record<string, PersonalizedChannel> = {};
        for (const suggestion of data.suggestions || []) {
          initialChannels[suggestion.id] = suggestion.recommendedChannels[0];
        }
        setSelectedChannels(initialChannels);
      }
    } catch (error) {
      console.error("Failed to analyze account:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Queue an offer (mock action)
  const handleQueueOffer = (suggestion: PersonalizedOfferSuggestion) => {
    const channel =
      selectedChannels[suggestion.id] || suggestion.recommendedChannels[0];

    // Add to queued set
    setQueuedOffers((prev) => new Set(prev).add(suggestion.id));

    // Add to outreach history at the top
    const newRecord: OutreachRecord = {
      id: `queued-${suggestion.id}-${Date.now()}`,
      channel,
      offerName: suggestion.offerName,
      offerType: suggestion.offerType,
      status: "QUEUED",
      sentAt: new Date().toISOString(),
      message: `Personalized offer queued for ${firstName} via ${channelConfig[
        channel
      ].label.toLowerCase()}.`,
      linkedCampaignId: suggestion.linkedCampaignId,
      linkedCampaignName: suggestion.linkedCampaignName,
    };

    setOutreachHistory((prev) => [newRecord, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* AI Analysis Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            AI-Powered Personalization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Analyze {firstName}&apos;s spending patterns and transaction history
            to generate personalized offer recommendations tailored specifically
            for this{" "}
            <Badge variant="outline" className="mx-1">
              {tier}
            </Badge>
            tier account.
          </p>

          {!hasAnalyzed ? (
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing Account...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze Account & Suggest Offers
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  {suggestions.length} personalized offers suggested
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Re-analyze"
                  )}
                </Button>
              </div>

              {/* Suggestions Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                {suggestions.map((suggestion) => {
                  const isQueued = queuedOffers.has(suggestion.id);
                  const urgency = urgencyConfig[suggestion.urgency];
                  const selectedChannel =
                    selectedChannels[suggestion.id] ||
                    suggestion.recommendedChannels[0];

                  return (
                    <div
                      key={suggestion.id}
                      className={cn(
                        "p-4 rounded-lg border space-y-3 transition-all",
                        isQueued
                          ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                          : "bg-card hover:border-primary/50"
                      )}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-sm">
                              {suggestion.offerName}
                            </h4>
                            <Badge className={cn("text-xs", urgency.className)}>
                              {urgency.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <OfferTypeBadge type={suggestion.offerType} />
                            <span className="text-xs text-muted-foreground">
                              Est. value:{" "}
                              {formatCurrency(suggestion.estimatedValue)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Reasoning */}
                      <p className="text-xs text-muted-foreground">
                        {suggestion.reasoning}
                      </p>

                      {/* Campaign Link */}
                      {suggestion.linkedCampaignName && (
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-muted-foreground">
                            Linked to:
                          </span>
                          <Link
                            href={`/campaigns/${suggestion.linkedCampaignId}`}
                            className="text-primary hover:underline"
                          >
                            {suggestion.linkedCampaignName}
                          </Link>
                        </div>
                      )}

                      {/* Channel Selection & Action */}
                      {!isQueued ? (
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <div className="flex gap-1">
                            {suggestion.recommendedChannels.map((channel) => {
                              const config = channelConfig[channel];
                              const isSelected = selectedChannel === channel;
                              return (
                                <button
                                  key={channel}
                                  onClick={() =>
                                    setSelectedChannels((prev) => ({
                                      ...prev,
                                      [suggestion.id]: channel,
                                    }))
                                  }
                                  className={cn(
                                    "p-1.5 rounded-md transition-all",
                                    isSelected
                                      ? config.className
                                      : "text-muted-foreground hover:bg-muted"
                                  )}
                                  title={config.label}
                                >
                                  {config.icon}
                                </button>
                              );
                            })}
                          </div>
                          <Button
                            size="sm"
                            className="ml-auto gap-1.5"
                            onClick={() => handleQueueOffer(suggestion)}
                          >
                            <Zap className="h-3.5 w-3.5" />
                            Queue via {channelConfig[selectedChannel].label}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 pt-2 border-t text-green-600 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Queued via {channelConfig[selectedChannel].label}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outreach History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Personalized Outreach History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : outreachHistory.length === 0 ? (
            <div className="py-8 text-center">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No personalized outreach history yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Use the AI analysis above to generate and queue personalized
                offers
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

              <div className="space-y-6">
                {outreachHistory.map((record, index) => {
                  const channel = channelConfig[record.channel];
                  const status = statusConfig[record.status];

                  return (
                    <div key={record.id} className="relative flex gap-4">
                      {/* Timeline dot */}
                      <div
                        className={cn(
                          "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background",
                          record.status === "ENGAGED"
                            ? "border-green-500"
                            : record.status === "QUEUED"
                            ? "border-gray-400"
                            : "border-blue-500"
                        )}
                      >
                        <span className={channel.className.split(" ")[1]}>
                          {channel.icon}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                className={cn("text-xs", channel.className)}
                              >
                                {channel.label}
                              </Badge>
                              <OfferTypeBadge type={record.offerType} />
                              <div
                                className={cn(
                                  "flex items-center gap-1 text-xs",
                                  status.className
                                )}
                              >
                                {status.icon}
                                <span>{status.label}</span>
                              </div>
                            </div>
                            <h4 className="font-medium mt-1">
                              {record.offerName}
                            </h4>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(record.sentAt), "MMM d, yyyy")}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground mt-1">
                          {record.message}
                        </p>

                        {/* Timeline details */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {record.deliveredAt && (
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              Delivered{" "}
                              {format(new Date(record.deliveredAt), "h:mm a")}
                            </span>
                          )}
                          {record.engagedAt && (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <MousePointerClick className="h-3 w-3" />
                              Engaged{" "}
                              {format(new Date(record.engagedAt), "MMM d")}
                            </span>
                          )}
                        </div>

                        {/* Campaign Link */}
                        {record.linkedCampaignName && (
                          <Link
                            href={`/campaigns/${record.linkedCampaignId}`}
                            className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                          >
                            Part of: {record.linkedCampaignName}
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
