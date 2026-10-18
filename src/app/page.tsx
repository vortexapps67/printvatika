import React from 'react';
import Link from 'next/link';
import { DbClient } from '../lib/db';
import { ProductCard } from '../components/ProductCard';
import { Hero } from '../components/Hero';
import { CategoryTiles } from '../components/CategoryTiles';
import { OfferTickets } from '../components/OfferTickets';
import { PromoBanners } from '../components/PromoBanners';
import { dealsBySlug } from '../lib/catalog';
import { bestsellersOf, isBestseller } from '../lib/merch';
import {
  Badge,
  ButtonLink,
  ColourStrip,
  Panel,
  RegistrationMark,
  SectionHead,
} from '../components/ui/press';
import { SITE } from '../lib/site';
import {
  UploadCloud,
  SlidersHorizontal,
  CreditCard,
  Truck,
  Star,
  ArrowRight,
  Quote,
  MapPin,
  Clock,
  BadgeCheck,
  PackageCheck,
  Tag,
} from 'lucide-react';

export const revalidate = 0;

export default async function HomePage() {
  const [products, rules] = await Promise.all([
    DbClient.getProducts(),
    DbClient.getAllPricingRules(),
  ]);

  /* Every "save X%" badge on this page is derived from the real quantity
     tiers, so a deal promised on the storefront is a deal the checkout
     honours. */
  const deals = dealsBySlug(rules);
  const dealProducts = products
    .filter(p => deals[p.slug])
    .sort((a, b) => (deals[b.slug]?.pct ?? 0) - (deals[a.slug]?.pct ?? 0))
    .slice(0, 4);
  const deepest = Math.max(0, ...Object.values(deals).map(d => d.pct));
  const bestsellers = bestsellersOf(products);

  /* The four promises that actually decide whether someone orders from a
     local press rather than a national portal: how fast, how cheap to
     collect, whether they can check it first, and what delivery costs. */
  const promises = [
    {
      Icon: Clock,
      title: '24–48 hour dispatch',
      body: 'Standard runs leave the press inside two working days. Bulk jobs get a date at order time.',
    },
    {
      Icon: PackageCheck,
      title: 'Free counter pickup',
      body: `Collect from ${SITE.street} with nothing added to the price. No minimum order.`,
    },
    {
      Icon: BadgeCheck,
      title: 'Proof before you pay',
      body: 'Position your artwork on the real trim size, check it on screen, and approve that exact file.',
    },
    {
      Icon: Truck,
      title: `Flat ₹${SITE.deliveryCharge} courier`,
      body: 'Home delivery across India at one flat rate, shown before payment. No zone pricing.',
    },
  ];

  /* Numbered, because this genuinely is an ordered sequence — the order of
     these four steps is the order the work happens in. */
  const steps = [
    {
      icon: <SlidersHorizontal size={19} />,
      title: 'Set the spec',
      desc: 'Pick the product, then choose stock, finish, size and quantity. Pricing updates on every choice.',
    },
    {
      icon: <UploadCloud size={19} />,
      title: 'Place your artwork',
      desc: 'Drop in a PNG, JPG or PDF. Drag it into position, scale and rotate it against the real trim size.',
    },
    {
      icon: <CreditCard size={19} />,
      title: 'Approve and pay',
      desc: 'The proof is saved with the order so the press runs the file you checked. Pay by UPI or card.',
    },
    {
      icon: <Truck size={19} />,
      title: 'Collect or courier',
      desc: 'Collect free from the counter near Saket Metro, or have it couriered. Status updates on WhatsApp.',
    },
  ];

  const reviews = [
    {
      quote:
        'Ordered 500 double-sided matte cards. The canvas let me line the logo up against the trim edge before I paid, which is the part that usually goes wrong.',
      name: 'Rajesh Sharma',
      role: 'Proprietor, Sharma Sweets',
    },
    {
      quote:
        'We print every shop banner and flex poster here. Setting exact feet rather than guessing at pixel sizes means the banner fits the frame first time.',
      name: 'Amit Choudhary',
      role: 'Director, Choudhary Electronics',
    },
    {
      quote:
        'The cotton tees have not faded after a dozen washes. Uploading from my phone works fine, and free pickup from the counter is quicker than any courier.',
      name: 'Pooja Verma',
      role: 'Manager, Vatika Co-operative Bank',
    },
  ];

  const faqs = [
    {
      q: 'What file formats do you accept?',
      a: 'PNG, JPG, JPEG and PDF. For business cards and banners, send a high-resolution PDF or PNG so the type stays sharp at 300 DPI.',
    },
    {
      q: 'How does the resolution check work?',
      a: 'When you upload artwork, we compare the pixel dimensions against the finished print size at 300 DPI. If it falls short we show a warning and explain the expected quality — you can still go ahead.',
    },
    {
      q: 'Can I collect my order from the counter?',
      a: `Yes. Choose store pickup at checkout and collect free from ${SITE.street}, once the order status reaches Ready for pickup.`,
    },
    {
      q: 'Is the file I upload the file you print?',
      a: 'Yes. The on-screen canvas is only a preview of placement. We store your original uploaded file untouched, and the press runs that exact file.',
    },
    {
      q: 'What does delivery cost?',
      a: `A flat ₹${SITE.deliveryCharge} for home delivery anywhere in India, free for store pickup. The charge is shown before you pay.`,
    },
    {
      q: `How does the ${deepest}% bulk discount work?`,
      a: 'Quantity tiers are built into every product. Raise the count and the per-piece rate drops automatically — the price in the basket is the price on the invoice, with nothing to claim back.',
    },
  ];

  return (
    <>
      {/* ---- Storefront hero: rotating banners, then search ---- */}
      <Hero products={products} />

      {/* ---- Promise strip: what the press guarantees ---- */}
      <section aria-label="What the press guarantees" className="border-b border-ink-200 bg-white">
        <div className="mx-auto max-w-sheet px-4 sm:px-6 lg:px-8">
          <ul className="grid gap-px overflow-hidden border-x border-ink-200 bg-ink-200 sm:grid-cols-2 lg:grid-cols-4">
            {promises.map(({ Icon, title, body }) => (
              <li key={title} className="bg-white p-5 sm:p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h2 className="mt-4 font-display text-title font-bold leading-tight text-ink-950">
                  {title}
                </h2>
                <p className="mt-2 text-body-s leading-relaxed text-ink-500">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- Shop by department ---- */}
      <section aria-label="Shop by category" className="mx-auto max-w-sheet px-4 pt-16 sm:px-6 sm:pt-20 lg:px-8">
        <SectionHead
          eyebrow="Shop by department"
          title="Start from what you need printed"
          lede="Five departments under one roof. Pick one and you are straight into the products that belong in it."
          action={
            <Link
              href="/catalog"
              className="group inline-flex items-center gap-2 font-mono text-label font-semibold uppercase tracking-wider2 text-primary-600 transition-colors hover:text-primary-700"
            >
              All products
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          }
        />

        <div className="mt-9">
          <CategoryTiles products={products} />
        </div>
      </section>

      {/* ---- Bestsellers: the four lines that leave the counter most ---- */}
      <section aria-label="Bestsellers" className="mx-auto max-w-sheet px-4 pt-14 sm:px-6 sm:pt-16 lg:px-8">
        <SectionHead
          eyebrow="Bestsellers"
          title="What leaves the counter most"
          lede="Four lines that between them cover most of what a new shop needs, in the order the counter actually prints them."
          action={
            <Link
              href="/catalog"
              className="group inline-flex items-center gap-2 font-mono text-label font-semibold uppercase tracking-wider2 text-primary-600 transition-colors hover:text-primary-700"
            >
              Browse all eight
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          }
        />

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {bestsellers.map(product => (
            <ProductCard key={product.id} product={product} compact bestseller />
          ))}
        </div>
      </section>

      {/* ---- Offers, drawn as tickets ---- */}
      <OfferTickets />

      {/* ---- Deals of the week ---- */}
      <section
        aria-label="Deals of the week"
        className="border-y border-ink-200 bg-white"
      >
        <div className="mx-auto max-w-sheet px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <SectionHead
            eyebrow="Deals"
            title={`Up to ${deepest}% off in bulk`}
            lede="These are the deepest quantity tiers in the catalog right now. They apply themselves as you raise the count — no code, no claim-back."
            action={
              <ButtonLink href="/catalog" variant="outline" size="md">
                Shop all products
                <ArrowRight size={14} aria-hidden="true" />
              </ButtonLink>
            }
          />

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dealProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                deal={deals[product.slug]}
                bestseller={isBestseller(product.slug)}
              />
            ))}
          </div>

          {/* Deal ledger — the tiers spelled out, rather than implied. */}
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {dealProducts.map(product => {
              const deal = deals[product.slug];
              if (!deal) return null;
              return (
                <li
                  key={product.slug}
                  className="flex items-center gap-3 rounded-xl border border-ink-200 bg-ink-50/60 px-4 py-3"
                >
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-white text-primary-600 shadow-card">
                    <Tag size={15} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-body font-bold text-ink-950">
                      {product.name}
                    </span>
                    <span className="mt-0.5 block font-mono text-micro uppercase tracking-wider2 text-ink-500">
                      {deal.pct}% off at {deal.minQty}+
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ---- Banner block: departments and job types ---- */}
      <div className="pt-14 sm:pt-16">
        <PromoBanners />
      </div>

      {/* ---- The full catalog, all eight lines ---- */}
      <section className="border-y border-ink-200 bg-white">
        <div className="mx-auto max-w-sheet px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <SectionHead
            eyebrow="The catalog"
            title="Everything the press runs"
            lede="Every line is configurable down to the stock weight and finished size, and priced live as you change it."
            action={
              <ButtonLink href="/catalog" variant="outline" size="md">
                Filter and sort
                <ArrowRight size={14} aria-hidden="true" />
              </ButtonLink>
            }
          />

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                deal={deals[product.slug]}
                bestseller={isBestseller(product.slug)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ---- How it works ---- */}
      <section className="mx-auto max-w-sheet px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <SectionHead
          eyebrow="The workflow"
          title="Four steps, in order"
          lede="A print job has a fixed sequence. This is it, and nothing happens out of turn."
        />

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="flex flex-col rounded-xl border border-ink-200 bg-white p-6 shadow-card transition-shadow duration-200 hover:shadow-card-hover"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-950 text-white">
                  {step.icon}
                </span>
                {/* Ghosted step number, held at ink-400 because 22px/900 is
                    large text and the bare minimum here is 3:1. */}
                <span className="tnum font-display text-lead-l font-black text-ink-400">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-5 font-display text-title font-bold text-ink-950">{step.title}</h3>
              <p className="mt-2 text-body-s leading-relaxed text-ink-500">{step.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---- Why / capability ---- */}
      <section className="border-y border-ink-200 bg-white">
        <div className="mx-auto max-w-sheet px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-4">
              <SectionHead
                eyebrow="Why here"
                title="A press you can walk up to"
                lede="No courier-only warehouse and no anonymous factory. The counter is on Himmat Singh Marg, and the people who run the machine are the people you order from."
              />
              <div className="mt-7">
                <ButtonLink href="/catalog" size="lg" variant="ink">
                  Browse products
                  <ArrowRight size={16} aria-hidden="true" />
                </ButtonLink>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
              {[
                {
                  title: 'Proof before payment',
                  body: 'The placement canvas exports an exact preview of the trimmed sheet. What you approve is stored against the order as the print-ready file.',
                  tag: 'Every order',
                },
                {
                  title: 'Stock you can hold',
                  body: 'Come in and feel the difference between a 300 GSM matte and a gloss laminate before you commit to 1,000 of them.',
                  tag: 'Counter',
                },
                {
                  title: 'Bulk pricing built in',
                  body: 'Quantity tiers apply automatically as you raise the count, so the number in the basket is the number on the invoice.',
                  tag: 'Automatic',
                },
                {
                  title: 'Status on WhatsApp',
                  body: 'When the press moves your job to printing, ready or out for delivery, you get a message — no portal login required.',
                  tag: 'Auto',
                },
              ].map(f => (
                <div
                  key={f.title}
                  className="rounded-xl border border-ink-200 bg-white p-6 shadow-card"
                >
                  <Badge tone="outline">{f.tag}</Badge>
                  <h3 className="mt-4 font-display text-title font-bold text-ink-950">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-body-s leading-relaxed text-ink-500">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---- Reviews ---- */}
      <section className="bg-ink-950 text-white">
        <div className="mx-auto max-w-sheet px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex items-center gap-2.5">
            <RegistrationMark className="text-primary-500" />
            <span className="label-caps text-ink-400">From the counter</span>
          </div>
          {/* The colour is explicit on purpose: the global h1–h6 rule sets
              ink-950, which would beat the white inherited from the section. */}
          <h2 className="mt-3 max-w-2xl text-title-l text-white sm:text-display-s">
            What repeat customers say
          </h2>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {reviews.map(r => (
              <figure
                key={r.name}
                className="flex flex-col rounded-xl border border-ink-800 bg-ink-900 p-6"
              >
                <div
                  className="flex gap-0.5 text-press-yellow"
                  role="img"
                  aria-label="5 out of 5 stars"
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} fill="currentColor" aria-hidden="true" />
                  ))}
                </div>
                <Quote size={22} className="mt-5 flex-none text-ink-700" aria-hidden="true" />
                <blockquote className="mt-3 flex-1 text-body leading-relaxed text-ink-300">
                  {r.quote}
                </blockquote>
                <figcaption className="mt-6 border-t border-ink-800 pt-4">
                  <span className="block font-display text-body font-bold text-white">{r.name}</span>
                  <span className="mt-0.5 block font-mono text-micro uppercase tracking-wider2 text-ink-400">
                    {r.role}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
        <ColourStrip />
      </section>

      {/* ---- Visit ---- */}
      <section id="visit" className="mx-auto max-w-sheet px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <SectionHead
              eyebrow="Find us"
              title="Come see the stock"
              lede="Inspect card weights, compare laminates and collect pickup orders from the counter."
            />
            <dl className="mt-8 divide-y divide-ink-200 border-y border-ink-200">
              <div className="flex gap-4 py-4">
                <dt className="label-caps flex w-24 flex-none items-start gap-2 pt-0.5">
                  <MapPin size={17} className="mt-px flex-none text-primary-500" aria-hidden="true" />
                  Address
                </dt>
                <dd className="text-body text-ink-700">
                  {SITE.street}
                  <br />
                  {SITE.city} {SITE.pincode}
                </dd>
              </div>
              <div className="flex gap-4 py-4">
                <dt className="label-caps w-24 flex-none pt-0.5">Hours</dt>
                <dd className="text-body text-ink-700">
                  {SITE.hours.map(h => (
                    <span key={h.days} className="block">
                      {h.days}: {h.time}
                    </span>
                  ))}
                </dd>
              </div>
              <div className="flex gap-4 py-4">
                <dt className="label-caps w-24 flex-none pt-0.5">Delivery</dt>
                <dd className="text-body text-ink-700">
                  Flat ₹{SITE.deliveryCharge} anywhere in India. Free to collect from the counter.
                </dd>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-7">
            <Panel flush className="overflow-hidden">
              <iframe
                src={SITE.mapEmbed}
                title="Print Vatika location on Google Maps"
                className="block h-full min-h-[380px] w-full"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </Panel>
          </div>
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section className="border-t border-ink-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <SectionHead
            eyebrow="Before you order"
            title="Questions worth asking"
            align="center"
            className="[&>div]:mx-auto"
          />

          <div className="mt-10 divide-y divide-ink-200 border-y border-ink-200">
            {faqs.map(f => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6">
                  <h3 className="font-display text-body-l font-bold text-ink-950">{f.q}</h3>
                  <span
                    className="mt-1 flex h-5 w-5 flex-none items-center justify-center text-primary-500 transition-transform group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-body leading-relaxed text-ink-500">{f.a}</p>
              </details>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center gap-5 text-center">
            <p className="text-body text-ink-500">
              Still deciding? Start a job and configure it — nothing is charged until you approve.
            </p>
            <ButtonLink href="/catalog" size="lg" variant="solid">
              Open the catalog
              <ArrowRight size={16} aria-hidden="true" />
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
