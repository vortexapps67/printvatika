'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductOption, PricingRule, DesignConfig } from '../types';
import { useCart } from '../context/CartContext';
import { PreviewCanvas } from './PreviewCanvas';
import { calculatePricing, PriceBreakdown } from '../lib/priceCalculator';
import { validateUploadedFile, FileValidationResult } from '../lib/fileValidation';
import {
  Info,
  ShoppingCart,
  AlertTriangle,
  UploadCloud,
  FileCheck,
  Tag,
  ArrowLeft,
  X
} from 'lucide-react';
import Link from 'next/link';

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
    setQuantity(defaultQtys[product.slug] || 100);
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

  // Helper lists of standard tier choices
  const quantityTiers: Record<string, number[]> = {
    'business-cards': [100, 250, 500, 1000],
    't-shirts': [1, 5, 10, 50, 100],
    'flex-banners': [1, 2, 5, 10],
    'flyers': [100, 500, 1000, 5000],
    'posters': [1, 5, 10, 50, 100],
    'brochures': [100, 250, 500, 1000],
    'stickers': [50, 100, 250, 500, 1000]
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link href="/catalog" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 font-semibold text-sm">
        <ArrowLeft size={16} /> Back to Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Interactive Preview Editor (Canvas) */}
        <div className="lg:col-span-5 flex flex-col items-center gap-4 sticky top-20">
          <h2 className="font-bold text-slate-800 text-base self-start">
            Interactive Print Mockup
          </h2>
          <PreviewCanvas
            productSlug={product.slug}
            imageSrc={imageSrc}
            dimensions={dimensions}
            selectedOptions={selectedOptions}
            onChange={handleCanvasChange}
          />
        </div>

        {/* Right Side: Configuration & Form options */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header Title */}
          <div>
            <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
              {product.category}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              {product.name}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="border-t border-slate-100 my-6"></div>

          {/* Specification Configurations */}
          <div className="space-y-6">
            {options.map(opt => (
              <div key={opt.id} className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
                  {opt.display_name}
                </label>

                {/* Option Type select dropdown */}
                {opt.type === 'select' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {opt.options_json.map(choice => (
                      <button
                        key={choice.value}
                        type="button"
                        onClick={() => handleOptionChange(opt.name, choice.value)}
                        className={`flex flex-col text-left p-3.5 border rounded-xl transition-all ${
                          selectedOptions[opt.name] === choice.value
                            ? 'border-primary-600 bg-primary-50/40 ring-1 ring-primary-600 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-900">{choice.label}</span>
                        {choice.price_modifier && choice.price_modifier !== 0 ? (
                          <span className="text-[10px] text-slate-500 font-medium mt-1">
                            {choice.price_modifier > 0 ? `+ ₹${choice.price_modifier}` : `- ₹${Math.abs(choice.price_modifier)}`}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium mt-1">Base Included</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Option Type custom banner dimension boxes */}
                {opt.type === 'dimensions' && (
                  <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Width (Feet)</span>
                      <input
                        type="number"
                        min="2"
                        max="30"
                        value={dimensions.width}
                        onChange={e => setDimensions(prev => ({ ...prev, width: Math.max(1, parseInt(e.target.value) || 1) }))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                    <div className="text-slate-400 font-bold self-end pb-2">×</div>
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Height (Feet)</span>
                      <input
                        type="number"
                        min="2"
                        max="30"
                        value={dimensions.height}
                        onChange={e => setDimensions(prev => ({ ...prev, height: Math.max(1, parseInt(e.target.value) || 1) }))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                )}

                {/* Option Type custom text instructions */}
                {opt.type === 'text' && (
                  <textarea
                    rows={4}
                    value={selectedOptions[opt.name] || ''}
                    onChange={e => handleOptionChange(opt.name, e.target.value)}
                    placeholder="Enter custom specifications (paper GSM, quantities, shapes, or printing notes)..."
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                )}
              </div>
            ))}

            {/* Quantity Selector Option */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Select or Enter Quantity
                </label>
                <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-200/60">
                  {quantity} {quantity === 1 ? 'unit' : 'units'} selected
                </span>
              </div>

              {quantityTiers[product.slug] && (
                <div className="flex flex-wrap gap-2.5">
                  {quantityTiers[product.slug].map(qty => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setQuantity(qty)}
                      className={`px-4 py-2 border text-xs sm:text-sm font-bold rounded-xl transition-all ${
                        quantity === qty
                          ? 'border-primary-600 bg-primary-600 text-white shadow-md'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      {qty} units
                    </button>
                  ))}
                </div>
              )}

              {/* Custom Quantity Input Field */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-xs font-bold text-slate-700 shrink-0">
                  Custom Quantity:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={quantity}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10);
                      setQuantity(isNaN(val) || val < 1 ? 1 : val);
                    }}
                    className="w-32 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g. 350"
                  />
                  <span className="text-[11px] text-slate-500">
                    units (volume discount calculates automatically)
                  </span>
                </div>
              </div>
            </div>

            {/* Design File Uploader Section */}
            {product.slug !== 'custom-print' && (
              <div className="space-y-3 pt-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Upload Design File
                </label>

                {!uploadedFile ? (
                  <div className="border-2 border-dashed border-slate-200 hover:border-primary-500 rounded-2xl p-6 text-center transition-all bg-slate-50/50 cursor-pointer relative">
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf,.svg"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <UploadCloud className="mx-auto text-slate-400 mb-2" size={32} />
                    <span className="block text-xs sm:text-sm font-bold text-slate-700">
                      Click to upload design file
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-1">
                      PNG, JPG, JPEG, PDF, SVG (Max 20MB)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 shrink-0">
                        <FileCheck size={20} />
                      </div>
                      <div className="text-left overflow-hidden">
                        <span className="block text-xs font-bold text-slate-800 truncate">
                          {uploadedFile.name}
                        </span>
                        <span className="block text-[10px] text-slate-500 font-medium">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* Validation Warnings Panel */}
                {validation && (
                  <div className="space-y-2">
                    {/* Hard error lists */}
                    {validation.errors.map((err, i) => (
                      <div key={i} className="flex items-start gap-2 border border-red-200 bg-red-50 text-red-700 text-xs font-bold p-3.5 rounded-xl">
                        <X size={16} className="mt-0.5 shrink-0" />
                        <span>{err}</span>
                      </div>
                    ))}
                    
                    {/* Soft warnings list */}
                    {validation.warnings.map((warn, i) => (
                      <div key={i} className="flex flex-col border border-amber-200 bg-amber-50 text-amber-800 text-xs p-3.5 rounded-xl space-y-2">
                        <div className="flex items-start gap-2 font-bold">
                          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                          <span>{warn}</span>
                        </div>
                        <label className="flex items-center gap-2 pl-6 mt-1 font-semibold text-[10px] text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={ackWarning}
                            onChange={e => setAckWarning(e.target.checked)}
                            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                          />
                          I understand and want to proceed with this file resolution.
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 my-6"></div>

          {/* Pricing Summary Panel & Add to Cart */}
          {priceBreakdown && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 text-sm">Live Cost Estimation</span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
                  <Tag size={10} /> Active Price Rules
                </span>
              </div>

              {/* Specs Breakdown */}
              <div className="space-y-2 text-xs text-slate-500 border-b border-slate-200 pb-3 font-medium">
                <div className="flex justify-between">
                  <span>Base Unit Price:</span>
                  <span>₹{priceBreakdown.basePrice.toFixed(2)}{product.slug === 'flex-banners' && ' / sqft'}</span>
                </div>

                {priceBreakdown.dimensionsAreaSqFt && (
                  <div className="flex justify-between text-slate-700">
                    <span>Banner Size Area:</span>
                    <span>{dimensions.width}′ × {dimensions.height}′ = {priceBreakdown.dimensionsAreaSqFt} Sq.Ft.</span>
                  </div>
                )}

                {priceBreakdown.optionsDetails.map((opt, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{opt.name} ({opt.label}):</span>
                    <span>₹{opt.cost.toFixed(2)}</span>
                  </div>
                ))}

                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Unit Subtotal:</span>
                  <span>₹{priceBreakdown.unitPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Quantity Subtotal ({priceBreakdown.quantity} units):</span>
                  <span>₹{priceBreakdown.rawSubtotal.toFixed(2)}</span>
                </div>

                {priceBreakdown.discountPercentage > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 font-bold">
                    <span>Bulk Tier Discount ({priceBreakdown.discountPercentage}% off):</span>
                    <span>- ₹{(priceBreakdown.rawSubtotal - priceBreakdown.subtotal).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-end border-t border-slate-200 pt-3">
                  <div>
                    <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">Subtotal (Excl. delivery)</span>
                    <span className="text-2xl font-extrabold text-slate-900 leading-none">
                      ₹{priceBreakdown.subtotal.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm"
                  >
                    <ShoppingCart size={16} />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Notice */}
          <div className="flex gap-2 items-start text-[11px] text-slate-400 bg-slate-50 border border-slate-100 rounded-xl p-3 font-medium">
            <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
            <span>
              Delivery fees (₹50 flat within Jaipur & India) or Store Pickup will be chosen during checkout. Original design files are archived securely for printing press operators.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
