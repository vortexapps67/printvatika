import { Order } from '../types';

/**
 * Sends a WhatsApp notification to the printing press owner when a paid order comes in.
 * In development / local testing, this prints the WhatsApp notification format to the server console.
 * In production, it can make an HTTP post request to an approved provider API (e.g. Twilio, Meta, or Wati).
 */
export async function sendAdminOrderNotification(order: Order): Promise<boolean> {
  const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER || '919876543210';
  const whatsappApiToken = process.env.WHATSAPP_API_TOKEN;
  const whatsappApiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages';

  // Format specifications list
  const itemsText = order.items
    ?.map(item => {
      const optionsText = Object.entries(item.selected_options)
        .map(([key, val]) => `${key}: ${val}`)
        .join(', ');
      return `- ${item.product_name} x ${item.quantity}\n  Details: [${optionsText}]`;
    })
    .join('\n');

  const adminDashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://printvatika.vercel.app'}/admin/dashboard?order=${order.id}`;

  const messagePayload = `*🟢 NEW PRINT ORDER - Print Vatika*

*Order ID:* ${order.id}
*Customer:* ${order.customer_name}
*Phone:* ${order.customer_phone}
*Email:* ${order.customer_email}

*Fulfillment:* ${order.fulfillment_type.toUpperCase()}
${order.fulfillment_type === 'delivery' ? `*Address:* ${order.delivery_address}, ${order.delivery_city}, ${order.delivery_pincode}` : '*Pickup:* Customer will collect at store'}

*Items Ordered:*
${itemsText}

*Subtotal:* ₹${order.subtotal}
*Delivery Fee:* ₹${order.delivery_charge}
*Total Amount:* ₹${order.total_amount}
*Payment status:* ${order.payment_status} (Razorpay Verification OK)

*Action Required:* View order specifications and download files at:
${adminDashboardUrl}`;

  console.log('\n==================================================');
  console.log('📬 OUTGOING ADMIN WHATSAPP NOTIFICATION LOG');
  console.log(`To: ${adminPhone}`);
  console.log('--------------------------------------------------');
  console.log(messagePayload);
  console.log('==================================================\n');

  // If live credentials are set, trigger the external endpoint
  if (whatsappApiToken) {
    try {
      const response = await fetch(whatsappApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappApiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: adminPhone,
          type: 'text',
          text: {
            body: messagePayload
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('WhatsApp API Error Response:', errorText);
        return false;
      }
      
      console.log(`WhatsApp message sent successfully to admin ${adminPhone}`);
      return true;
    } catch (error) {
      console.error('Failed to dispatch WhatsApp API notification:', error);
      return false;
    }
  }

  // Fallback dev mode succeeds
  return true;
}

/**
 * Sends order tracking status update notification to the customer.
 */
export async function sendCustomerStatusNotification(order: Order, customNote?: string): Promise<boolean> {
  const whatsappApiToken = process.env.WHATSAPP_API_TOKEN;
  const whatsappApiUrl = process.env.WHATSAPP_API_URL;
  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/track?id=${order.id}&phone=${order.customer_phone}`;

  const messagePayload = `*🔔 ORDER STATUS UPDATE - Print Vatika*

Dear ${order.customer_name},

Your print order *${order.id}* has been updated:
*Current Status:* ${order.order_status}

${customNote ? `*Press Update:* _"${customNote}"_\n` : ''}
Track live printing progress or view order specifications at:
${trackingUrl}

Thank you for choosing Print Vatika!
📞 Contact: +91 99999 88888`;

  console.log('\n==================================================');
  console.log('📬 OUTGOING CUSTOMER WHATSAPP NOTIFICATION LOG');
  console.log(`To: ${order.customer_phone}`);
  console.log('--------------------------------------------------');
  console.log(messagePayload);
  console.log('==================================================\n');

  if (whatsappApiToken && whatsappApiUrl) {
    try {
      await fetch(whatsappApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappApiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: order.customer_phone,
          type: 'text',
          text: {
            body: messagePayload
          }
        })
      });
      return true;
    } catch (e) {
      console.error('Failed to notify customer on WhatsApp:', e);
      return false;
    }
  }

  return true;
}
