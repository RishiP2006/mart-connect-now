/**
 * Email service utility for sending order confirmation emails
 * Supports Resend and SendGrid email services
 */

interface OrderEmailData {
  to: string;
  customerName: string;
  orderItems: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalPrice: number;
  deliveryAddress: string;
  paymentMethod: string;
  orderId?: string;
}

/**
 * Send order confirmation email using Resend
 */
export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.warn('VITE_RESEND_API_KEY not configured. Email will not be sent.');
    return false;
  }

  try {
    // Import Resend dynamically to avoid issues if not installed
    const { Resend } = await import('resend');
    const resend = new Resend(resendApiKey);

    const emailHtml = generateOrderConfirmationEmail(data);

    const result = await resend.emails.send({
      from: 'Mart Connect <onboarding@resend.dev>', // Update with your verified domain
      to: data.to,
      subject: `Order Confirmation - Order #${data.orderId || 'N/A'}`,
      html: emailHtml,
    });

    if (result.error) {
      console.error('Error sending email via Resend:', result.error);
      return false;
    }

    console.log('Order confirmation email sent successfully:', result.data);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Generate HTML email template for order confirmation
 */
function generateOrderConfirmationEmail(data: OrderEmailData): string {
  const itemsHtml = data.orderItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Order Confirmed!</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hi ${data.customerName},</p>
          
          <p>Thank you for your order! We're excited to get your items to you.</p>
          
          <h2 style="color: #667eea; margin-top: 30px;">Order Details</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #667eea; color: white;">
                <th style="padding: 12px; text-align: left;">Product</th>
                <th style="padding: 12px; text-align: center;">Quantity</th>
                <th style="padding: 12px; text-align: right;">Price</th>
                <th style="padding: 12px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; border-top: 2px solid #667eea;">Total:</td>
                <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 1.2em; color: #667eea; border-top: 2px solid #667eea;">$${data.totalPrice.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">Delivery Information</h3>
            <p><strong>Address:</strong> ${data.deliveryAddress}</p>
            <p><strong>Payment Method:</strong> ${data.paymentMethod === 'offline' ? 'Cash on Delivery' : 'Online Payment'}</p>
          </div>
          
          <p style="margin-top: 30px;">We'll send you updates on your order status. You can also check your order history in your dashboard.</p>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>Mart Connect Team</strong>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Alternative: Send email using SendGrid (if Resend is not available)
 */
export async function sendOrderConfirmationEmailSendGrid(data: OrderEmailData): Promise<boolean> {
  const sendgridApiKey = import.meta.env.VITE_SENDGRID_API_KEY;
  
  if (!sendgridApiKey) {
    console.warn('VITE_SENDGRID_API_KEY not configured. Email will not be sent.');
    return false;
  }

  try {
    const emailHtml = generateOrderConfirmationEmail(data);

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: data.to, name: data.customerName }],
            subject: `Order Confirmation - Order #${data.orderId || 'N/A'}`,
          },
        ],
        from: {
          email: 'noreply@martconnect.com', // Update with your verified sender
          name: 'Mart Connect',
        },
        content: [
          {
            type: 'text/html',
            value: emailHtml,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error sending email via SendGrid:', errorText);
      return false;
    }

    console.log('Order confirmation email sent successfully via SendGrid');
    return true;
  } catch (error) {
    console.error('Error sending email via SendGrid:', error);
    return false;
  }
}

