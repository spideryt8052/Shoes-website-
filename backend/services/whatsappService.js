/**
 * Automated WhatsApp Dispatch Service
 * Supports 1-Click Background PDF Bill & App Link Dispatch
 * 
 * Configurable via .env:
 * - Meta WhatsApp Cloud API: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN
 * - UltraMsg Gateway: ULTRAMSG_INSTANCE_ID, ULTRAMSG_TOKEN
 * - Generic Gateway: WHATSAPP_GATEWAY_URL, WHATSAPP_GATEWAY_TOKEN
 */

const StoreSettings = require('../models/StoreSettings');

// Format phone number to international E.164 (without plus)
const formatInternationalPhone = (phone) => {
  if (!phone) return '';
  let clean = String(phone).replace(/\D/g, '');
  if (clean.length === 10) {
    return '91' + clean;
  }
  if (clean.length === 11 && clean.startsWith('0')) {
    return '91' + clean.substring(1);
  }
  if (clean.length === 12 && clean.startsWith('91')) {
    return clean;
  }
  return clean;
};

const getBillTextAndLinks = (sale, settings) => {
  const storeName = settings?.shopName || 'NEW MB SHOES';
  const storeAddress = settings?.address || 'D.N. Singh Road, Shah Market (Near Titan World), Bhagalpur';
  const helpline = settings?.contactNumber || '+91 94312 14500';

  const appUrl = 'https://shoes-website-yaseenbrp25-6387.vercel.app';
  const pdfDownloadUrl = `https://shoes-website-yaseenbrp25-6387.vercel.app/api/sales/invoice/${sale.invoiceNumber}/pdf`;

  const dateStr = new Date(sale.saleDate || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = new Date(sale.saleDate || Date.now()).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const customerName = sale.customerName && sale.customerName !== 'Walk-in Customer'
    ? sale.customerName
    : 'Valued Customer';

  const captionText = `🏪 *${storeName.toUpperCase()}*
📍 _${storeAddress}_
📞 Helpline: ${helpline}
───────────────────────
🧾 *TAX INVOICE & DIGITAL RECEIPT*
Invoice: *#${sale.invoiceNumber}*
Date: ${dateStr} | Time: ${timeStr}
Customer: *${customerName}*
Paid Amount: *₹${Number(sale.totalAmount).toLocaleString('en-IN')}* (${sale.paymentMethod || 'UPI / Cash'})
───────────────────────
Dear *${customerName}*,
Aapka official PDF Tax Invoice bill generate ho gaya hai:

📄 *DOWNLOAD OFFICIAL PDF BILL*:
${pdfDownloadUrl}

🛍️ *OUR SHOE STORE WEBSITE & APP*:
${appUrl}
(Naye branded joote aur fresh footwear dekhne ke liye app link open karein)
───────────────────────
🛡️ *7-DAY SIZE EXCHANGE POLICY*:
• Fit/size exchange is available within 7 days across our Bhagalpur branches with this PDF bill.

✨ *Thank you for shopping at ${storeName.toUpperCase()}!*`;

  return { captionText, appUrl, pdfDownloadUrl };
};

/**
 * Send WhatsApp Bill in Background (Zero Cashier Interaction)
 */
exports.dispatchWhatsAppBill = async (sale) => {
  const targetPhone = formatInternationalPhone(sale.customerPhone);
  if (!targetPhone) {
    return {
      success: false,
      message: 'Customer phone number is missing or invalid.',
    };
  }

  const settings = await StoreSettings.findOne();
  const { captionText, pdfDownloadUrl } = getBillTextAndLinks(sale, settings);

  // Method 1: Meta WhatsApp Cloud API (Official)
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const metaToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;

  if (metaPhoneId && metaToken) {
    try {
      const response = await fetch(`https://graph.facebook.com/v19.0/${metaPhoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: targetPhone,
          type: 'document',
          document: {
            link: pdfDownloadUrl,
            filename: `Invoice-${sale.invoiceNumber}.pdf`,
            caption: captionText,
          },
        }),
      });

      const data = await response.json();
      if (response.ok && data.messages && data.messages.length > 0) {
        console.log(`[WhatsApp Cloud API]: PDF Bill sent successfully to ${targetPhone}`);
        return {
          success: true,
          mode: 'cloud_api',
          provider: 'Meta WhatsApp Cloud API',
          messageId: data.messages[0].id,
          message: `PDF Bill successfully sent to +${targetPhone} via Meta Cloud API!`,
        };
      } else {
        console.error('[WhatsApp Cloud API Error]:', data);
      }
    } catch (err) {
      console.error('[WhatsApp Cloud API Exception]:', err.message);
    }
  }

  // Method 2: UltraMsg Gateway (No-code / Fast 1-Click WhatsApp instance)
  const ultraInstance = (process.env.ULTRAMSG_INSTANCE_ID || '').trim();
  const ultraToken = (process.env.ULTRAMSG_TOKEN || '').trim();

  if (ultraInstance && ultraToken) {
    try {
      const response = await fetch(`https://api.ultramsg.com/${ultraInstance}/messages/document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: ultraToken,
          to: targetPhone,
          document: pdfDownloadUrl,
          filename: `Invoice-${sale.invoiceNumber}.pdf`,
          caption: captionText,
        }),
      });

      const data = await response.json();
      if (data.sent === 'true' || data.id) {
        console.log(`[UltraMsg API]: PDF Bill sent successfully to ${targetPhone}`);
        return {
          success: true,
          mode: 'gateway',
          provider: 'UltraMsg',
          messageId: data.id,
          message: `PDF Bill successfully sent to +${targetPhone} via UltraMsg Gateway!`,
        };
      } else {
        console.error('[UltraMsg Error Response]:', data);
        // If not connected yet or document error, try text chat fallback
        if (data.error && data.error.includes('not connected')) {
          return {
            success: false,
            mode: 'qr_not_scanned',
            error: data.error,
            targetPhone,
            captionText,
            waMeLink: `https://wa.me/${targetPhone}?text=${encodeURIComponent(captionText)}`,
            message: 'UltraMsg me WhatsApp link nahi hai. Kripya UltraMsg dashboard par jaakar QR Code scan karein.',
          };
        }

        // Try text message fallback via UltraMsg
        try {
          const chatRes = await fetch(`https://api.ultramsg.com/${ultraInstance}/messages/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              token: ultraToken,
              to: targetPhone,
              body: captionText,
            }),
          });
          const chatData = await chatRes.json();
          if (chatData.sent === 'true' || chatData.id) {
            return {
              success: true,
              mode: 'gateway_text',
              provider: 'UltraMsg',
              messageId: chatData.id,
              message: `Bill message with PDF & App links sent to +${targetPhone} via UltraMsg!`,
            };
          }
        } catch (chatErr) {
          console.error('[UltraMsg Chat Fallback Error]:', chatErr.message);
        }
      }
    } catch (err) {
      console.error('[UltraMsg Exception]:', err.message);
    }
  }
          messageId: data.id,
          message: `PDF Bill successfully sent to +${targetPhone} via UltraMsg Gateway!`,
        };
      }
    } catch (err) {
      console.error('[UltraMsg Exception]:', err.message);
    }
  }

  // Method 3: Generic Webhook / Gateway
  const genericGateway = process.env.WHATSAPP_GATEWAY_URL;
  if (genericGateway) {
    try {
      const response = await fetch(genericGateway, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WHATSAPP_GATEWAY_TOKEN || ''}`,
        },
        body: JSON.stringify({
          phone: targetPhone,
          pdfUrl: pdfDownloadUrl,
          filename: `Invoice-${sale.invoiceNumber}.pdf`,
          text: captionText,
          invoiceNumber: sale.invoiceNumber,
        }),
      });
      if (response.ok) {
        return {
          success: true,
          mode: 'gateway',
          provider: 'Custom Gateway',
          message: `PDF Bill successfully sent to +${targetPhone}!`,
        };
      }
    } catch (err) {
      console.error('[Generic Gateway Exception]:', err.message);
    }
  }

  // Fallback: If no background API is configured, return the deep link parameters
  // Uses https://wa.me/91XXXXXXXXXX which opens DIRECTLY to that number (NO retyping needed!)
  const waMeLink = `https://wa.me/${targetPhone}?text=${encodeURIComponent(captionText)}`;

  return {
    success: false,
    mode: 'direct_link',
    targetPhone,
    captionText,
    waMeLink,
    message:
      'Background WhatsApp API key not configured in .env. Click link to send directly to customer chat without typing number.',
  };
};

exports.formatInternationalPhone = formatInternationalPhone;
exports.getBillTextAndLinks = getBillTextAndLinks;

