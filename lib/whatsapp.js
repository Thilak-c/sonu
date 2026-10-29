// WhatsApp Mock Notification Engine for Sonu Shoe
// Simulates WhatsApp transactional messaging for e-commerce orders

export async function sendMockWhatsAppMessage({
  phone = '8008439762',
  recipientName = 'Customer',
  template = 'ORDER_CONFIRMED',
  orderId = '',
  courierName = 'Delhivery Surface',
  awbCode = '',
  totalAmount = 13995,
}) {
  const timestamp = new Date();
  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  let messageText = '';

  switch (template) {
    case 'ORDER_CONFIRMED':
      messageText = `👟 *Order Confirmed!* Hi ${recipientName}, thanks for choosing Sonu Shoe. Your order *#${orderId}* (₹${Number(totalAmount).toLocaleString('en-IN')}) is confirmed and being prepared. Track updates anytime.`;
      break;

    case 'READY_TO_SHIP':
      messageText = `📦 *Packed & Ready!* Hi ${recipientName}, your Sonu Shoe order *#${orderId}* is boxed. Shipped via *${courierName}* (AWB: \`${awbCode || 'Pending'}\`).`;
      break;

    case 'PICKUP_SCHEDULED':
      messageText = `🚚 *Pickup Scheduled!* Your courier partner (${courierName}) has scheduled pickup for order *#${orderId}*.`;
      break;

    case 'IN_TRANSIT':
      messageText = `⚡ *In Transit!* Your order *#${orderId}* is on its way via ${courierName}. AWB: ${awbCode}. Expected delivery within 2-3 business days.`;
      break;

    case 'DELIVERED':
      messageText = `🎉 *Delivered!* Your Sonu Shoes for order *#${orderId}* have arrived. For the long way home — enjoy every stride! Need an exchange? Reply to this message.`;
      break;

    default:
      messageText = `ℹ️ *Sonu Shoe Update:* Update for order *#${orderId}*. Status: ${template}.`;
  }

  // Simulated gateway log output
  console.log(`[MOCK WHATSAPP GATEWAY] 💬 Outgoing message to +91 ${cleanPhone}:`);
  console.log(`   Template: [${template}]`);
  console.log(`   Message:  "${messageText}"`);

  return {
    success: true,
    isMock: true,
    sentAt: timestamp,
    phone: `+91 ${cleanPhone}`,
    template,
    messageText,
    gateway: 'lite-wa-simulated',
    status: 'DELIVERED',
  };
}

