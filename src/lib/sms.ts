export async function sendSMS(to: string, message: string) {
    if (!to || !message) {
        console.warn("SMS Service: Missing 'to' or 'message'");
        return;
    }

    // Format phone number: Remove leading 0, add 234 if missing (assuming Nigeria context)
    let validPhone = to.trim().replace(/\s+/g, '');
    if (validPhone.startsWith('0')) {
        validPhone = '234' + validPhone.substring(1);
    } else if (validPhone.startsWith('+')) {
        validPhone = validPhone.substring(1);
    }

    // Log for "Dev" mode or if no API key
    console.log(`[SMS Service] Sending to ${validPhone}: "${message}"`);

    // Termii Implementation (Example)
    const apiKey = process.env.TERMII_API_KEY;
    const senderId = process.env.TERMII_SENDER_ID || "TransportNG"; // Must be approved by Termii

    if (apiKey) {
        try {
            const data = {
                to: validPhone,
                from: senderId,
                sms: message,
                type: "plain",
                api_key: apiKey,
                channel: "dnd", // 'dnd' covers most numbers in Nigeria, 'generic' for intl
            };

            const response = await fetch("https://api.ng.termii.com/api/sms/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            if (!response.ok) {
                console.error("[SMS Service] Provider Error:", result);
            } else {
                console.log("[SMS Service] Sent Successfully:", result.message_id);
            }
        } catch (error) {
            console.error("[SMS Service] Network Error:", error);
        }
    } else {
        console.warn("[SMS Service] No API Key found. Message logged only.");
    }
}
