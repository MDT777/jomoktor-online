import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Заявка с сайта → таблица leads + Telegram-уведомление владельцу.
// СЕКРЕТЫ задаются в Supabase → Edge Functions → Secrets (см. README).
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  try {
    const payload = await req.json().catch(() => ({}));
    const { name, contact, childName, childAge, interests, favoriteToy, genre, theme } =
      payload ?? {};

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: insertError } = await supabase.from("leads").insert({
      name: name ?? null,
      contact: contact ?? null,
      child_name: childName ?? null,
      child_age: childAge ?? null,
      interests: interests ?? null,
      favorite_toy: favoriteToy ?? null,
      genre: genre ?? null,
      theme: theme ?? null,
    });

    if (insertError) {
      console.error("DB insert failed:", insertError.message);
      return json({ ok: false, error: insertError.message }, 500);
    }

    // Telegram-уведомление. Его сбой НЕ должен ломать запрос —
    // заявка уже надёжно сохранена в базе.
    try {
      const text =
        `\u{1F195} Новая заявка JOMOKTOR\n\n` +
        `\u{1F464} Имя: ${name ?? "-"}\n` +
        `\u{1F4E7} Email: ${contact ?? "-"}\n` +
        `\u{1F9D2} Ребёнок: ${childName ?? "-"} (${childAge ?? "-"})\n` +
        `\u{2B50} Интересы: ${interests ?? "-"}\n` +
        `\u{1F9F8} Любимая игрушка: ${favoriteToy ?? "-"}\n` +
        `\u{1F3AD} Жанр: ${genre ?? "-"}\n` +
        `\u{1F4D6} Пожелания: ${theme ?? "-"}`;

      const tgRes = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
        },
      );
      if (!tgRes.ok) {
        console.error("Telegram notify failed:", await tgRes.text());
      }
    } catch (tgErr) {
      console.error("Telegram notify threw:", String(tgErr));
    }

    return json({ ok: true }, 200);
  } catch (err) {
    console.error("Handler error:", String(err));
    return json({ ok: false, error: String(err) }, 500);
  }
});
