import type { Config } from "@netlify/functions";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { adOwnerEmail, adOwnerName, reporterName, adText, productImageUrl } =
      await req.json();

    if (!adOwnerEmail) {
      return new Response("Missing adOwnerEmail", { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: "Playground Eats Alerts <noreply@playgroundeats.com>",
      to: [adOwnerEmail],
      subject: "🪦 Your Ad Got Reported (RIP) 🪦",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626;">Bad News, ${adOwnerName || "Friend"}.</h1>
          
          <p style="font-size: 16px; line-height: 1.6;">
            We regret to inform you that your banner ad has been <strong>disabled</strong> for the next 48 hours.
          </p>
          
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fca5a5 100%); padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #92400e; font-weight: 600;">YOUR AD:</p>
            ${
              productImageUrl
                ? `<div style="text-align: center; margin: 16px 0;"><img src="${productImageUrl}" alt="Product" style="max-width: 200px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" /></div>`
                : ""
            }
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #1f2937;">"${
              adText || "Your masterpiece"
            }"</p>
            <p style="margin: 12px 0 0 0; font-size: 14px; color: #dc2626; font-weight: 600;">STATUS: 💀 DISABLED</p>
          </div>

          <h3 style="color: #1f2937;">What happened?</h3>
          <p style="font-size: 16px; line-height: 1.6;">
            <strong>${
              reporterName || "Someone"
            }</strong> decided your ad wasn't their cup of tea (or snack of choice) and paid 75 PG Coins to yeet it into the shadow realm for 48 hours.
          </p>

          <p style="font-size: 16px; line-height: 1.6;">
            Was it too spicy? Too bland? Too... olive-based? We may never know. But ${
              reporterName || "Someone"
            } has spoken (with their wallet).
          </p>

          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              <strong>⏰ Your ad will return:</strong> In 48 hours, like a phoenix rising from the ashes (but less dramatic).
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          
          <p style="font-size: 14px; color: #9ca3af;">
            <em>— The PG Eats Management Team</em><br/>
            <span style="font-size: 12px;">Bringing you snack democracy, one vote at a time.</span>
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(JSON.stringify({ error }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};

export const config: Config = {
  path: "/api/send-ad-disabled-email",
};
