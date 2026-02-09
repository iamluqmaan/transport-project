
export async function sendWhatsApp(to: string, templateName: string, parameters: any[]) {
    if (!to) {
        console.warn("WhatsApp Service: Missing 'to' number");
        return;
    }

    // Format phone number: Remove leading 0, add 234 if missing
    let validPhone = to.trim().replace(/\s+/g, '');
    if (validPhone.startsWith('0')) {
        validPhone = '234' + validPhone.substring(1);
    } else if (validPhone.startsWith('+')) {
        validPhone = validPhone.substring(1);
    }

    console.log(`[WhatsApp Service] Sending '${templateName}' to ${validPhone}`);

    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (accessToken && phoneNumberId) {
        try {
            // This is a generic implementation for Meta's Cloud API
            // For template messages (standard for business initiated)
            const data = {
                messaging_product: "whatsapp",
                to: validPhone,
                type: "template",
                template: {
                    name: templateName,
                    language: {
                        code: "en_US"
                    },
                    components: [
                        {
                            type: "body",
                            parameters: parameters
                        }
                    ]
                }
            };

            const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            if (!response.ok) {
                console.error("[WhatsApp Service] API Error:", result);
            } else {
                console.log("[WhatsApp Service] Sent Successfully:", result.messages?.[0]?.id);
            }
        } catch (error) {
            console.error("[WhatsApp Service] Network Error:", error);
        }
    } else {
        console.log("[WhatsApp Service] Mock Send (Missing Keys).");
        console.log(`To: ${validPhone}, Template: ${templateName}, Params:`, parameters);
    }
}

export async function sendWhatsAppText(to: string, message: string) {
     // For free-form text (requires user to have initiated conversation recently window or utility template)
     // Fallback to console for now
     console.log(`[WhatsApp Service] Text to ${to}: ${message}`);
}
