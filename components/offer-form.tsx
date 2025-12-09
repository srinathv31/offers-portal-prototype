"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { OfferType } from "@/lib/db/schema";

interface OfferFormProps {
  initialValues?: {
    name: string;
    type: OfferType;
    vendor: string;
    parameters: Record<string, unknown>;
    hasProgressTracking: boolean;
    progressTarget: {
      targetAmount?: number;
      category?: string;
      vendor?: string;
      timeframeDays?: number;
    } | null;
    effectiveFrom?: string;
    effectiveTo?: string;
  };
  onSubmit: (data: {
    name: string;
    type: OfferType;
    vendor?: string | null;
    parameters: Record<string, unknown>;
    hasProgressTracking: boolean;
    progressTarget?: {
      targetAmount?: number;
      category?: string;
      vendor?: string;
      timeframeDays?: number;
    } | null;
    effectiveFrom?: string;
    effectiveTo?: string;
  }) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
}

const OFFER_TYPES: { value: OfferType; label: string }[] = [
  { value: "POINTS_MULTIPLIER", label: "Points Multiplier" },
  { value: "CASHBACK", label: "Cashback" },
  { value: "DISCOUNT", label: "Discount" },
  { value: "BONUS", label: "Bonus" },
];

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function OfferForm({
  initialValues,
  onSubmit,
  submitLabel = "Create Offer",
  loading = false,
}: OfferFormProps) {
  const [name, setName] = useState(initialValues?.name || "");
  const [type, setType] = useState<OfferType>(initialValues?.type || "POINTS_MULTIPLIER");
  const [vendor, setVendor] = useState(initialValues?.vendor || "");
  const [hasProgressTracking, setHasProgressTracking] = useState(
    initialValues?.hasProgressTracking || false
  );
  const [effectiveFrom, setEffectiveFrom] = useState(initialValues?.effectiveFrom || "");
  const [effectiveTo, setEffectiveTo] = useState(initialValues?.effectiveTo || "");

  // Parameters for POINTS_MULTIPLIER
  const [multiplier, setMultiplier] = useState<string>(
    initialValues?.parameters?.multiplier?.toString() || ""
  );
  const [basePoints, setBasePoints] = useState<string>(
    initialValues?.parameters?.basePoints?.toString() || "1"
  );
  const [pmCategory, setPmCategory] = useState(
    (typeof initialValues?.parameters?.category === "string" 
      ? initialValues.parameters.category 
      : "") || ""
  );
  const [pmMinPurchase, setPmMinPurchase] = useState<string>(
    initialValues?.parameters?.minPurchase?.toString() || ""
  );

  // Parameters for CASHBACK
  const [cashbackPercent, setCashbackPercent] = useState<string>(
    initialValues?.parameters?.cashbackPercent?.toString() || ""
  );
  const [maxCashback, setMaxCashback] = useState<string>(
    initialValues?.parameters?.maxCashback?.toString() || ""
  );
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(
    (Array.isArray(initialValues?.parameters?.daysOfWeek) 
      ? initialValues.parameters.daysOfWeek as string[]
      : []) || []
  );

  // Parameters for DISCOUNT
  const [discountPercent, setDiscountPercent] = useState<string>(
    initialValues?.parameters?.discountPercent?.toString() || ""
  );
  const [maxDiscount, setMaxDiscount] = useState<string>(
    initialValues?.parameters?.maxDiscount?.toString() || ""
  );
  const [discountMinPurchase, setDiscountMinPurchase] = useState<string>(
    initialValues?.parameters?.minPurchase?.toString() || ""
  );

  // Parameters for BONUS
  const [bonusPoints, setBonusPoints] = useState<string>(
    initialValues?.parameters?.bonusPoints?.toString() || ""
  );
  const [minSpend, setMinSpend] = useState<string>(
    initialValues?.parameters?.minSpend?.toString() || ""
  );
  const [timeframe, setTimeframe] = useState(
    (typeof initialValues?.parameters?.timeframe === "string" 
      ? initialValues.parameters.timeframe 
      : "") || ""
  );

  // Progress tracking fields
  const [targetAmount, setTargetAmount] = useState<string>(
    initialValues?.progressTarget?.targetAmount
      ? (initialValues.progressTarget.targetAmount / 100).toString()
      : ""
  );
  const [ptCategory, setPtCategory] = useState(initialValues?.progressTarget?.category || "");
  const [ptVendor, setPtVendor] = useState(initialValues?.progressTarget?.vendor || "");
  const [timeframeDays, setTimeframeDays] = useState<string>(
    initialValues?.progressTarget?.timeframeDays?.toString() || ""
  );

  const toggleDayOfWeek = (day: string) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parameters: Record<string, unknown> = {};

    // Build parameters based on offer type
    if (type === "POINTS_MULTIPLIER") {
      if (multiplier) parameters.multiplier = parseFloat(multiplier);
      if (basePoints) parameters.basePoints = parseInt(basePoints);
      if (pmCategory) parameters.category = pmCategory;
      if (pmMinPurchase) parameters.minPurchase = parseFloat(pmMinPurchase);
    } else if (type === "CASHBACK") {
      if (cashbackPercent) parameters.cashbackPercent = parseFloat(cashbackPercent);
      if (maxCashback) parameters.maxCashback = parseFloat(maxCashback);
      if (daysOfWeek.length > 0) parameters.daysOfWeek = daysOfWeek;
    } else if (type === "DISCOUNT") {
      if (discountPercent) parameters.discountPercent = parseFloat(discountPercent);
      if (maxDiscount) parameters.maxDiscount = parseFloat(maxDiscount);
      if (discountMinPurchase) parameters.minPurchase = parseFloat(discountMinPurchase);
    } else if (type === "BONUS") {
      if (bonusPoints) parameters.bonusPoints = parseInt(bonusPoints);
      if (minSpend) parameters.minSpend = parseFloat(minSpend);
      if (timeframe) parameters.timeframe = timeframe;
    }

    const progressTarget = hasProgressTracking
      ? {
          targetAmount: targetAmount ? Math.round(parseFloat(targetAmount) * 100) : undefined,
          category: ptCategory || undefined,
          vendor: ptVendor || undefined,
          timeframeDays: timeframeDays ? parseInt(timeframeDays) : undefined,
        }
      : null;

    const data = {
      name,
      type,
      vendor: vendor || null,
      parameters,
      hasProgressTracking,
      progressTarget,
      effectiveFrom: effectiveFrom || undefined,
      effectiveTo: effectiveTo || undefined,
    };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Core details about the offer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Offer Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Amazon 3× Points"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Offer Type *</Label>
            <Select value={type} onValueChange={(value) => setType(value as OfferType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OFFER_TYPES.map((offerType) => (
                  <SelectItem key={offerType.value} value={offerType.value}>
                    {offerType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor (Optional)</Label>
            <Input
              id="vendor"
              placeholder="e.g., Amazon, Target, Starbucks"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Type-Specific Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>Offer Parameters</CardTitle>
          <CardDescription>Configure the details for this {type.replace(/_/g, " ").toLowerCase()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {type === "POINTS_MULTIPLIER" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="multiplier">Multiplier *</Label>
                  <Input
                    id="multiplier"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 3"
                    value={multiplier}
                    onChange={(e) => setMultiplier(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="basePoints">Base Points</Label>
                  <Input
                    id="basePoints"
                    type="number"
                    placeholder="e.g., 1"
                    value={basePoints}
                    onChange={(e) => setBasePoints(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pmCategory">Category</Label>
                <Input
                  id="pmCategory"
                  placeholder="e.g., Online Shopping, Groceries"
                  value={pmCategory}
                  onChange={(e) => setPmCategory(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pmMinPurchase">Minimum Purchase ($)</Label>
                <Input
                  id="pmMinPurchase"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 25"
                  value={pmMinPurchase}
                  onChange={(e) => setPmMinPurchase(e.target.value)}
                />
              </div>
            </>
          )}

          {type === "CASHBACK" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cashbackPercent">Cashback Percent *</Label>
                  <Input
                    id="cashbackPercent"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 5"
                    value={cashbackPercent}
                    onChange={(e) => setCashbackPercent(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxCashback">Max Cashback ($)</Label>
                  <Input
                    id="maxCashback"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 50"
                    value={maxCashback}
                    onChange={(e) => setMaxCashback(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Days of Week (Optional)</Label>
                <div className="grid grid-cols-4 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div
                      key={day}
                      className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                        daysOfWeek.includes(day)
                          ? "border-primary bg-primary/10"
                          : "hover:border-muted-foreground/50"
                      }`}
                      onClick={() => toggleDayOfWeek(day)}
                    >
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          daysOfWeek.includes(day)
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {daysOfWeek.includes(day) && (
                          <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className="text-sm">{day.substring(0, 3)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {type === "DISCOUNT" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountPercent">Discount Percent *</Label>
                  <Input
                    id="discountPercent"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 10"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDiscount">Max Discount ($)</Label>
                  <Input
                    id="maxDiscount"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 100"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountMinPurchase">Minimum Purchase ($)</Label>
                <Input
                  id="discountMinPurchase"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 50"
                  value={discountMinPurchase}
                  onChange={(e) => setDiscountMinPurchase(e.target.value)}
                />
              </div>
            </>
          )}

          {type === "BONUS" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bonusPoints">Bonus Points *</Label>
                  <Input
                    id="bonusPoints"
                    type="number"
                    placeholder="e.g., 500"
                    value={bonusPoints}
                    onChange={(e) => setBonusPoints(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minSpend">Minimum Spend ($)</Label>
                  <Input
                    id="minSpend"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 50"
                    value={minSpend}
                    onChange={(e) => setMinSpend(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeframe">Timeframe</Label>
                <Input
                  id="timeframe"
                  placeholder="e.g., 30 days, 1 month"
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Progress Tracking */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Progress Tracking</CardTitle>
              <CardDescription>Configure if this offer has trackable progress goals</CardDescription>
            </div>
            <Button
              type="button"
              variant={hasProgressTracking ? "default" : "outline"}
              size="sm"
              onClick={() => setHasProgressTracking(!hasProgressTracking)}
            >
              {hasProgressTracking ? "Enabled" : "Disabled"}
            </Button>
          </div>
        </CardHeader>
        {hasProgressTracking && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetAmount">Target Amount ($)</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 1000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeframeDays">Timeframe (Days)</Label>
                <Input
                  id="timeframeDays"
                  type="number"
                  placeholder="e.g., 90"
                  value={timeframeDays}
                  onChange={(e) => setTimeframeDays(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ptCategory">Category</Label>
                <Input
                  id="ptCategory"
                  placeholder="e.g., Groceries"
                  value={ptCategory}
                  onChange={(e) => setPtCategory(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ptVendor">Vendor</Label>
                <Input
                  id="ptVendor"
                  placeholder="e.g., Amazon"
                  value={ptVendor}
                  onChange={(e) => setPtVendor(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Effective Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Effective Dates (Optional)</CardTitle>
          <CardDescription>Set when this offer is valid</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="effectiveFrom">Effective From</Label>
              <Input
                id="effectiveFrom"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="effectiveTo">Effective To</Label>
              <Input
                id="effectiveTo"
                type="date"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button type="submit" disabled={loading || !name.trim()} className="gap-2 flex-1">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              {submitLabel}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

