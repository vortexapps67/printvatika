/**
 * Single source of truth for everything about the shop that appears in more
 * than one place. The pickup address used to be duplicated (and out of date)
 * in both the cart and the order tracker; now both read from here.
 */

export const SITE = {
  name: 'Print Vatika',
  tagline: 'Commercial printing press, Saket Metro',

  street: 'F-298, Himmat Singh Marg, Near Saket Metro, Lado Sarai',
  city: 'New Delhi',
  region: 'Delhi',
  pincode: '110030',
  country: 'India',

  /** Full pickup address, one line, for compact UI. */
  pickupAddress:
    'F-298, Himmat Singh Marg, Near Saket Metro, Lado Sarai, New Delhi 110030',

  phoneRaw: '+919811427517',
  phoneDisplay: '+91 98114 27517',
  email: 'orders@printvatika.com',

  /** Mon-Sat. Online orders are taken around the clock. */
  hours: [
    { days: 'Monday – Saturday', time: '9:00 AM – 8:00 PM' },
    { days: 'Sunday', time: 'Closed' },
  ],

  /** Flat courier charge applied at checkout for home delivery. */
  deliveryCharge: 50,

  /** The map embed used on the contact section. */
  mapEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2309.6171148141198!2d77.19263710887732!3d28.524512375622653!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d1f42cbbc8423%3A0xdc29121a55f2f481!2sPrint%20Vatika!5e1!3m2!1sen!2sin!4v1787317523633!5m2!1sen!2sin',

  mapLink: 'https://maps.google.com/?q=Print+Vatika+Saket+Metro+New+Delhi',
} as const;

export const NAV_LINKS = [
  { href: '/catalog', label: 'Catalog' },
  { href: '/track', label: 'Track Order' },
] as const;