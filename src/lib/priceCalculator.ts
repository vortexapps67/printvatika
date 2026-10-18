import { Product, ProductOption, PricingRule, FulfillmentType } from '../types';

export interface PriceBreakdown {
  basePrice: number;
  dimensionsAreaSqFt?: number;
  optionsTotal: number;
  optionsDetails: Array<{ name: string; key: string; value: string; label: string; cost: number }>;
  unitPrice: number;
  quantity: number;
  rawSubtotal: number;
  discountPercentage: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export function calculatePricing(
  product: Product,
  options: ProductOption[],
  rules: PricingRule[],
  selectedOptions: Record<string, string>,
  quantity: number,
  dimensions: { width: number; height: number } | undefined,
  fulfillmentType: FulfillmentType
): PriceBreakdown {
  const quantityNum = Number(quantity) || 1;
  let basePrice = Number(product.base_price);
  let optionsTotal = 0;
  const optionsDetails: PriceBreakdown['optionsDetails'] = [];

  let sqft = 1;
  const isDimensionProduct = product.slug === 'flex-banners' || options.some(o => o.type === 'dimensions');

  if (isDimensionProduct && dimensions) {
    const width = Number(dimensions.width) || 4;
    const height = Number(dimensions.height) || 3;
    sqft = width * height;
  }

  // Calculate pricing based on options
  options.forEach(opt => {
    const selectedVal = selectedOptions[opt.name];
    if (!selectedVal) return;

    if (opt.type === 'select') {
      const choice = opt.options_json.find(c => c.value === selectedVal);
      if (choice) {
        const mod = Number(choice.price_modifier) || 0;
        
        if (isDimensionProduct && opt.name === 'material') {
          // For banners, material is a per-square-foot cost modifier
          const cost = mod * sqft;
          optionsTotal += cost;
          optionsDetails.push({
            name: opt.display_name,
            key: opt.name,
            value: selectedVal,
            label: choice.label,
            cost: cost
          });
        } else {
          // Everything else is a flat add-on to the job (e.g. grommets, folding)
          optionsTotal += mod;
          optionsDetails.push({
            name: opt.display_name,
            key: opt.name,
            value: selectedVal,
            label: choice.label,
            cost: mod
          });
        }
      }
    }
  });

  // Calculate base unit price
  let unitPrice = 0;
  if (isDimensionProduct) {
    // base unit price = base_price per sqft * sqft + option add-ons
    // Option additions for flex-banners: Material (computed above per sqft) + Finishing (flat cost)
    unitPrice = basePrice * sqft;
  } else {
    unitPrice = basePrice + optionsTotal;
  }

  let rawSubtotal = 0;
  if (isDimensionProduct) {
    // Total flat cost = (base_price * sqft + material * sqft) * quantity + flat finishing
    const flatFinishing = optionsDetails
      .filter(d => d.key === 'finishing')
      .reduce((sum, d) => sum + d.cost, 0);
    
    // We already added flatFinishing inside optionDetails/optionsTotal, let's separate it
    const materialCost = optionsDetails
      .filter(d => d.key === 'material')
      .reduce((sum, d) => sum + d.cost, 0);

    const baseAndMaterial = (basePrice * sqft) + materialCost;
    rawSubtotal = (baseAndMaterial * quantityNum) + flatFinishing;
  } else {
    rawSubtotal = unitPrice * quantityNum;
  }

  // Calculate discount tier from pricing rules
  let discountFactor = 1.0;
  let matchedRule: PricingRule | undefined;

  // For banners, we check sqft volume. For other items, we check unit quantity.
  const lookupKey = isDimensionProduct ? 'sqft' : 'quantity';
  const lookupVal = isDimensionProduct ? sqft * quantityNum : quantityNum;

  // Find rules matching product slug and key
  const productRules = rules.filter(r => r.product_slug === product.slug && r.option_key === lookupKey);
  
  productRules.forEach(rule => {
    const minQty = Number(rule.tier_min_qty) || 0;
    if (lookupVal >= minQty) {
      if (!matchedRule || minQty > (matchedRule.tier_min_qty || 0)) {
        matchedRule = rule;
        discountFactor = Number(rule.tier_discount_factor) || 1.0;
      }
    }
  });

  const discountPercentage = Math.round((1 - discountFactor) * 100);
  
  // Apply discount to the raw subtotal (excluding flat finishing additions)
  let subtotal = 0;
  if (isDimensionProduct) {
    const flatFinishing = optionsDetails
      .filter(d => d.key === 'finishing')
      .reduce((sum, d) => sum + d.cost, 0);
    const discountable = rawSubtotal - flatFinishing;
    subtotal = (discountable * discountFactor) + flatFinishing;
  } else {
    subtotal = rawSubtotal * discountFactor;
  }

  // Delivery calculations
  const deliveryFee = fulfillmentType === 'delivery' ? 50.00 : 0.00; // Flat ₹50 delivery inside India
  const total = subtotal + deliveryFee;

  return {
    basePrice,
    dimensionsAreaSqFt: isDimensionProduct ? sqft : undefined,
    optionsTotal: isDimensionProduct ? optionsTotal : optionsTotal * quantityNum,
    optionsDetails,
    unitPrice: isDimensionProduct ? unitPrice : unitPrice,
    quantity: quantityNum,
    rawSubtotal,
    discountPercentage,
    subtotal: Math.max(0, Math.round(subtotal * 100) / 100),
    deliveryFee,
    total: Math.max(0, Math.round(total * 100) / 100)
  };
}
