'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductOption, PricingRule, DesignConfig } from '../types';
import { useCart } from '../context/CartContext';
import { PreviewCanvas } from './PreviewCanvas';
import { calculatePricing, PriceBreakdown } from '../lib/priceCalculator';
import { payable } from '../lib/catalog';
import { validateUploadedFile, FileValidationResult } from '../lib/fileValidation';
import {
  Info,
  ShoppingCart,
  AlertTriangle,
  UploadCloud,
  FileCheck,
  ArrowLeft,
  X,
  Crosshair,
} from 'lucide-react';
import Link from 'next/link';
import { Badge, Button, Panel, PanelHead, SpecRow } from './ui/press';
import { SITE } from '../lib/site';

interface ProductCustomizerProps {
  product: Product;
  options: ProductOption[];
  pricingRules: PricingRule[];
}

export const ProductCustomizer: React.FC<ProductCustomizerProps> = ({
  product,
  options,
  pricingRules
}) => {
  const router = useRouter();
  const { addToCart } = useCart();

  // 1. Initial State Setup
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState<number>(100);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 4, height: 3 });
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    type: string;
    base64: string;
  } | null>(null);
  
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  const [validation, setValidation] = useState<FileValidationResult | null>(null);
  const [ackWarning, setAckWarning] = useState<boolean>(false);
  const [canvasPreviewUrl, setCanvasPreviewUrl] = useState<string>('');
  const [designConfig, setDesignConfig] = useState<DesignConfig>({
    x: 0,
    y: 0,
    scale: 0.5,
    rotation: 0,
    side: 'front'
  });

  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);

  // Set default configurations on mount
  useEffect(() => {
    const defaults: Record<string, string> = {};
    options.forEach(opt => {
      if (opt.type === 'select' && opt.options_json.length > 0) {
        defaults[opt.name] = opt.options_json[0].value;
      }
    });
    setSelectedOptions(defaults);

    // Initial default quantities matching standard product runs
    const defaultQtys: Record<string, number> = {
      'business-cards': 250,
      't-shirts': 5,
      'flex-banners': 1,
      'flyers': 500,
      'posters': 5,
      'brochures': 250,
      'stickers': 100,
      'custom-print': 1
    };
    // The shop's own suggested run size wins when the database provides one.
    setQuantity(product.default_qty ?? defaultQtys[product.slug] ?? 100);
  }, [options, product]);

  // Sync pricing calculations whenever options change
  useEffect(() => {
    const breakdown = calculatePricing(
      product,
      options,
      pricingRules,
      selectedOptions,
      quantity,
      dimensions,
      'pickup' // base subtotal checkout pricing (excludes shipping which is added in cart)
    );
    setPriceBreakdown(breakdown);
  }, [selectedOptions, quantity, dimensions, product, options, pricingRules]);

  // Handle Option selection change
  const handleOptionChange = (name: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [name]: value }));
  };

  // Handle image upload and read file specs
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileMeta = {
      name: file.name,
      size: file.size,
      type: file.type
    };

    // First validate structure type & size
    const initialVal = validateUploadedFile(fileMeta, product.slug);
    if (!initialVal.isValid) {
      setValidation(initialVal);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const base64Str = event.target?.result as string;
      setImageSrc(base64Str);

      // Extract pixel dimensions for resolution validation
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const fullValidation = validateUploadedFile(fileMeta, product.slug, {
          pixelWidth: img.width,
          pixelHeight: img.height,
          bannerWidthFt: product.slug === 'flex-banners' ? dimensions.width : undefined,
          bannerHeightFt: product.slug === 'flex-banners' ? dimensions.height : undefined
        });

        setValidation(fullValidation);
        setUploadedFile({
          ...fileMeta,
          base64: base64Str
        });
        setAckWarning(false); // require re-acknowledgement for new file
      };
    };
  };

  // Clear upload
  const handleRemoveFile = () => {
    setUploadedFile(null);
    setImageSrc(undefined);
    setValidation(null);
    setAckWarning(false);
    setCanvasPreviewUrl('');
  };

  // Sync from canvas output
  const handleCanvasChange = (conf: DesignConfig, previewBase64: string) => {
    setDesignConfig(conf);
    setCanvasPreviewUrl(previewBase64);
  };

  const handleAddToCart = () => {
    // 1. Check if design file is uploaded (except for custom quotation details)
    if (!uploadedFile && product.slug !== 'custom-print') {
      alert('Please upload your graphic design file to proceed.');
      return;
    }

    // 2. Validate acknowledgement check for warnings
    if (validation && validation.warnings.length > 0 && !ackWarning) {
      alert('Please review and acknowledge the file warnings before placing order.');
      return;
    }

    if (!priceBreakdown) return;

    // 3. Construct cart items object
    addToCart({
      product,
      quantity,
      selected_options: {
        ...selectedOptions,
        ...(product.slug === 'flex-banners' ? { size: `${dimensions.width}×${dimensions.height} Ft` } : {})
      },
      dimensions: product.slug === 'flex-banners' ? dimensions : undefined,
      original_file: uploadedFile || undefined,
      preview_base64: canvasPreviewUrl || undefined,
      design_config: designConfig,
      unit_price: priceBreakdown.unitPrice,
      total_price: priceBreakdown.subtotal
    });

    // Go to shopping cart
    router.push('/cart');
  };

  /* Quantity tiers and their discounts come from the shop's own pricing rules
     (i.e. the live database), so the picker can never offer a quantity the
     press has not actually priced. The static map is only a fallback for a
     local JSON database with no rules loaded. */
  const fallbackTiers: Record<string, number[]> = {
    'business-cards': [100, 250, 500, 1000],
    't-shirts': [1, 5, 10, 25, 50, 100],
    'flex-banners': [1, 2, 5, 10],
    'flyers': [100, 500, 1000, 5000],
    'posters': [1, 5, 10, 50],
    'brochures': [50, 100, 500, 1000],
    'stickers': [50, 100, 250, 500, 1000]
  };

  const tierDiscount = new Map<number, number>();
  pricingRules
    .filter(r => r.option_key !== 'sqft' && r.tier_min_qty > 0)
    .forEach(r => {
      const pct = Math.round((1 - r.tier_discount_factor) * 100);
      if (pct > (tierDiscount.get(r.tier_min_qty) ?? 0)) tierDiscount.set(r.tier_min_qty, pct);
    });

  const ruleTiers = Array.from(tierDiscount.keys()).sort((a, b) => a - b);
  const tiers = ruleTiers.length ? ruleTiers : fallbackTiers[product.slug] ?? [];

  /* A base price of zero is the shop's way of saying "we quote this by hand"
     (bespoke printing), so the cost sheet shows an honest placeholder instead
     of a row of ₹0.00 totals that read like a free job. */
  const isQuoteProduct = !((priceBreakdown?.basePrice ?? product.base_price) > 0);

return (
    <div className="space-y-6">
      <Link
        href="/catalog"
        className="group inline-flex items-center gap-2 font-mono text-label font-medium uppercase tracking-wider2 text-ink-500 transition-colors hover:text-ink-950"
      >
        <ArrowLeft
          size={14}
          className="transition-transform group-hover:-translate-x-0.5"
          aria-hidden="true"
        />
        Back to catalog
      </Link>

      <div className="grid items-start gap-8 lg:grid-cols-12">
        {/* ---- Proof canvas ---- */}
        <div className="sticky top-20 flex flex-col gap-4 lg:col-span-5">
          <div className="flex items-center gap-2.5">
            <Crosshair size={14} className="text-primary-500" aria-hidden="true" />
            <h2 className="label-caps">Live proof</h2>
          </div>
          <PreviewCanvas
            productSlug={product.slug}
            imageSrc={imageSrc}
            dimensions={dimensions}
            selectedOptions={selectedOptions}
            onChange={handleCanvasChange}
          />
        </div>

        {/* ---- Configuration ---- */}
        <div className="lg:col-span-7">
          <Panel flush>
            {/* Header */}
            <div className="border-b border-ink-200 p-5 sm:p-6">
              <Badge tone="accent">{product.category}</Badge>
              <h1 className="mt-3 text-title-l">{product.name}</h1>
              <p className="mt-2 text-body leading-relaxed text-ink-500">{product.description}</p>
            </div>

            <div className="space-y-7 p-5 sm:p-6">
              {/* Specification options */}
              {options.map(opt => (
                <section key={opt.id}>
                  <h3 className="label-caps mb-3">{opt.display_name}</h3>

                  {opt.type === 'select' && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {opt.options_json.map(choice => {
                        const active = selectedOptions[opt.name] === choice.value;
                        const delta = choice.price_modifier ?? 0;
                        return (
                          <button
                            key={choice.value}
                            type="button"
                            onClick={() => handleOptionChange(opt.name, choice.value)}
                            aria-pressed={active}
                            className={
                              active
                                ? 'flex flex-col rounded-lg border-2 border-primary-500 bg-primary-50/60 p-3 text-left transition-colors'
                                : 'flex flex-col rounded-lg border border-ink-200 bg-white p-3 text-left transition-colors hover:border-ink-400'
                            }
                          >
                            <span className="font-display text-body font-bold text-ink-950">
                              {choice.label}
                            </span>
                            <span
                              className={`tnum mt-1.5 font-mono text-micro ${
                                delta === 0 ? 'text-ink-400' : active ? 'text-primary-600' : 'text-ink-500'
                              }`}
                            >
                              {delta === 0
                                ? 'Included'
                                : `${delta > 0 ? '+' : '−'} ₹${Math.abs(delta).toFixed(2)}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {opt.type === 'dimensions' && (
                    <div className="rounded-xl border border-ink-200 bg-ink-50 p-4">
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <label
                            htmlFor={`${opt.name}-w`}
                            className="label-caps mb-1.5 block"
                          >
                            Width (ft)
                          </label>
                          <input
                            id={`${opt.name}-w`}
                            type="number"
                            min="2"
                            max="30"
                            value={dimensions.width}
                            onChange={e =>
                              setDimensions(prev => ({
                                ...prev,
                                width: Math.max(1, parseInt(e.target.value) || 1),
                              }))
                            }
                            className="tnum font-display text-title font-bold"
                          />
                        </div>
                        <span
                          className="pb-3 font-display text-title text-ink-300"
                          aria-hidden="true"
                        >
                          ×
                        </span>
                        <div className="flex-1">
                          <label
                            htmlFor={`${opt.name}-h`}
                            className="label-caps mb-1.5 block"
                          >
                            Height (ft)
                          </label>
                          <input
                            id={`${opt.name}-h`}
                            type="number"
                            min="2"
                            max="30"
                            value={dimensions.height}
                            onChange={e =>
                              setDimensions(prev => ({
                                ...prev,
                                height: Math.max(1, parseInt(e.target.value) || 1),
                              }))
                            }
                            className="tnum font-display text-title font-bold"
                          />
                        </div>
                      </div>
                      <p className="tnum mt-3 border-t border-ink-200 pt-3 font-mono text-body-s text-ink-600">
                        {dimensions.width}′ × {dimensions.height}′ ={' '}
                        <strong className="text-ink-950">
                          {dimensions.width * dimensions.height} sq ft
                        </strong>
                      </p>
                    </div>
                  )}

                  {opt.type === 'text' && (
                    <textarea
                      rows={4}
                      value={selectedOptions[opt.name] || ''}
                      onChange={e => handleOptionChange(opt.name, e.target.value)}
                      aria-label={opt.display_name}
                      placeholder="Paper GSM, quantities, shapes or anything else we should know…"
                    />
                  )}
                </section>
              ))}

              {/* ---- Quantity ---- */}
              <section>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="label-caps">Quantity</h3>
                  <span className="tnum font-mono text-label font-medium text-primary-600">
                    {quantity} {quantity === 1 ? 'unit' : 'units'}
                  </span>
                </div>

                {tiers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tiers.map(qty => {
                      const active = quantity === qty;
                      const pct = tierDiscount.get(qty) ?? 0;
                      return (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => setQuantity(qty)}
                          aria-pressed={active}
                          className={
                            active
                              ? 'tnum rounded-full bg-primary-500 px-4 py-2 font-mono text-label font-medium text-white transition-colors'
                              : 'tnum rounded-full border border-ink-200 bg-white px-4 py-2 font-mono text-label font-medium text-ink-600 transition-colors hover:border-ink-950 hover:text-ink-950'
                          }
                        >
                          <span className="block">{qty}</span>
                          {pct > 0 && (
                            <span
                              className={`block text-micro font-semibold ${
                                active ? 'text-white/80' : 'text-primary-600'
                              }`}
                            >
                              save {pct}%
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label htmlFor="custom-qty" className="label-caps">
                    Custom
                  </label>
                  <input
                    id="custom-qty"
                    type="number"
                    min="1"
                    max="100000"
                    value={quantity}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10);
                      setQuantity(isNaN(val) || val < 1 ? 1 : val);
                    }}
                    className="tnum w-32 font-display text-title font-bold"
                  />
                  <span className="font-mono text-micro uppercase tracking-wider2 text-ink-400">
                    units · tier discount applies automatically
                  </span>
                </div>
              </section>

              {/* ---- Artwork upload ---- */}
              {product.slug !== 'custom-print' && (
                <section>
                  <h3 className="label-caps mb-3">Artwork</h3>

                  {!uploadedFile ? (
                    <div className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-ink-300 bg-ink-50 px-6 py-10 text-center transition-colors hover:border-primary-500 hover:bg-primary-50/40">
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.pdf,.svg"
                        onChange={handleFileUpload}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        aria-label="Upload design file"
                      />
                      <UploadCloud
                        size={28}
                        className="mx-auto mb-3 text-ink-400 transition-colors group-hover:text-primary-500"
                        aria-hidden="true"
                      />
                      <span className="block font-display text-body font-bold text-ink-900">
                        Drop your file here, or click to choose
                      </span>
                      <span className="mt-1.5 block font-mono text-micro uppercase tracking-wider2 text-ink-400">
                        PNG · JPG · JPEG · PDF · SVG — max 20 MB
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                          <FileCheck size={17} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <span className="block truncate font-mono text-body-s font-medium text-ink-900">
                            {uploadedFile.name}
                          </span>
                          <span className="tnum block font-mono text-micro text-ink-500">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-white hover:text-red-600"
                        aria-label="Remove uploaded file"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  )}

                  {/* Validation messages */}
                  {validation && (
                    <div className="mt-3 space-y-2">
                      {validation.errors.map((err, i) => (
                        <div
                          key={i}
                          role="alert"
                          className="flex items-start gap-2.5 rounded-lg border border-red-300 bg-red-50 p-3.5 text-body-s font-medium text-red-700"
                        >
                          <X size={15} className="mt-0.5 flex-none" aria-hidden="true" />
                          <span>{err}</span>
                        </div>
                      ))}

                      {validation.warnings.map((warn, i) => (
                        <div
                          key={i}
                          className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-3.5"
                        >
                          <div className="flex items-start gap-2.5 text-body-s font-medium text-amber-900">
                            <AlertTriangle size={15} className="mt-0.5 flex-none" aria-hidden="true" />
                            <span>{warn}</span>
                          </div>
                          <label className="flex cursor-pointer items-start gap-2.5 text-body-s text-ink-700">
                            <input
                              type="checkbox"
                              checked={ackWarning}
                              onChange={e => setAckWarning(e.target.checked)}
                              className="mt-0.5"
                            />
                            I understand the resolution is below 300 DPI and want to proceed anyway.
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* ---- Cost sheet ---- */}
            {priceBreakdown && (
              <div className="border-t border-ink-200 bg-ink-50 p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="label-caps">Cost sheet</h3>
                  <Badge tone="accent">{isQuoteProduct ? 'Priced by hand' : 'Price rules applied'}</Badge>
                </div>

                {isQuoteProduct ? (
                  <>
                    <dl className="divide-y divide-ink-200 border-y border-ink-200">
                      <SpecRow label="Pricing" value="Custom quote" />
                      <SpecRow
                        label={`Quantity · ${quantity} ${quantity === 1 ? 'unit' : 'units'}`}
                        value="—"
                      />
                    </dl>
                    <p className="mt-4 text-body-s leading-relaxed text-ink-500">
                      Bespoke work is priced by hand. Send the job across and we will quote it
                      before anything is printed.
                    </p>
                  </>
                ) : (
                  <>
                    <dl className="divide-y divide-ink-200 border-y border-ink-200">
                      <SpecRow
                        label="Base unit price"
                        value={`₹${priceBreakdown.basePrice.toFixed(2)}${
                          product.slug === 'flex-banners' ? ' / sq ft' : ''
                        }`}
                      />

                      {!!priceBreakdown.dimensionsAreaSqFt && (
                        <SpecRow
                          label="Print area"
                          value={`${dimensions.width}′ × ${dimensions.height}′ = ${priceBreakdown.dimensionsAreaSqFt} sq ft`}
                        />
                      )}

                      {priceBreakdown.optionsDetails.map((opt, i) => (
                        <SpecRow key={i} label={`${opt.name} · ${opt.label}`} value={`₹${opt.cost.toFixed(2)}`} />
                      ))}

                      <SpecRow label="Unit subtotal" value={`₹${priceBreakdown.unitPrice.toFixed(2)}`} />
                      <SpecRow
                        label={`Quantity · ${priceBreakdown.quantity} units`}
                        value={`₹${priceBreakdown.rawSubtotal.toFixed(2)}`}
                      />

                      {priceBreakdown.discountPercentage > 0 && (
                        <SpecRow
                          label={`Bulk tier · ${priceBreakdown.discountPercentage}% off`}
                          value={
                            <span className="text-emerald-700">
                              − ₹{(priceBreakdown.rawSubtotal - priceBreakdown.subtotal).toFixed(2)}
                            </span>
                          }
                        />
                      )}
                    </dl>
                  </>
                )}

                <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <span className="label-caps">
                      {isQuoteProduct ? 'Total' : 'Subtotal · excl. delivery'}
                    </span>
                    <span className="tnum mt-1.5 block font-display text-display-s font-bold tracking-tight text-ink-950">
                      {isQuoteProduct ? 'To be quoted' : `₹${payable(priceBreakdown.subtotal)}`}
                    </span>
                  </div>

                  <Button type="button" onClick={handleAddToCart} size="lg" plate>
                    <ShoppingCart size={16} aria-hidden="true" />
                    Add to cart
                  </Button>
                </div>
              </div>
            )}
          </Panel>

          {/* Fulfillment notice */}
          <p className="mt-4 flex items-start gap-2.5 rounded-xl border border-ink-200/80 bg-white p-4 text-body-s leading-relaxed text-ink-500 shadow-card">
            <Info size={15} className="mt-0.5 flex-none text-ink-400" aria-hidden="true" />
            <span>
              Delivery is a flat ₹{SITE.deliveryCharge} anywhere in India, or collect free from the
              counter — you choose at checkout. Your original file is archived intact so the press
              runs exactly what you uploaded.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};