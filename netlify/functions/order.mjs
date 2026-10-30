export default async (request) => {
  if (request.method !== "POST") {
    return Response.json({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  const allowedOrigin = process.env.SITE_ORIGIN;
  const origin = request.headers.get("origin");
  if (allowedOrigin && origin && origin !== allowedOrigin) {
    return Response.json({ ok: false, error: "Origin not allowed" }, { status: 403 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error("Missing Telegram environment variables");
    return Response.json({ ok: false, error: "Сервер ще не налаштований. Спробуйте пізніше." }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (text.length < 10 || text.length > 3500 || !text.startsWith("Нове замовлення DICTIX PARFUMS")) {
    return Response.json({ ok: false, error: "Некоректні дані замовлення." }, { status: 400 });
  }

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text })
    });
    const telegramResult = await telegramResponse.json();
    if (!telegramResponse.ok || !telegramResult.ok) {
      console.error("Telegram sendMessage failed", telegramResult?.description || telegramResponse.status);
      return Response.json({ ok: false, error: "Telegram не прийняв замовлення. Спробуйте ще раз." }, { status: 502 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Order function error", error);
    return Response.json({ ok: false, error: "Помилка з’єднання. Спробуйте ще раз." }, { status: 502 });
  }
};
