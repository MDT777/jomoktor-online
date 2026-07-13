import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildPdf } from "./pdf.ts";

// Генерация детских сказок: Gemini (текст+модератор+визуальный контроль) + Fal (иллюстрации).
// Фото ребёнка (если прислали) используется ТОЛЬКО транзитом для генерации (PuLID), в БД НЕ сохраняется.
// PDF-книжка собирается здесь же (pdf.ts) и уходит владелице в Telegram одним файлом.
// СЕКРЕТЫ задаются в Supabase → Edge Functions → Secrets (см. README).
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID") ?? "";
const FAL_KEY = Deno.env.get("FAL_KEY") ?? "";

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
const VISION_MODELS = ["gemini-2.0-flash", "gemini-2.5-flash"];

const SAFETY_SYSTEM_PROMPT = `Ты — генератор детских сказок для платформы JOMOK. Строго следуй правилам безопасности контента:

1. ЗАПРЕЩЕНО: алкоголь, табак, вейпы, наркотики, оружие, насилие, любые незаконные действия.
2. ЗАПРЕЩЕНО: по-настоящему страшные/пугающие персонажи, хоррор, неоправданная жестокость, смерть, увечья. Страхи (темнота, монстры) показывай только в смешном, нелепом, дружелюбном и безопасном ключе.
3. ЗАПРЕЩЕНО: буллинг, травля, унижение, дискриминация, абьюз между персонажами. Конфликты решаются через диалог, дружбу и взаимовыручку.
4. ЗАПРЕЩЕНО: сидение/игры на подоконниках, у открытых окон, на балконах, крышах и других опасных местах; игры с острыми/колющими/режущими предметами; приём таблеток без назначения врача (упоминать лекарства можно только в контексте "по назначению врача"); разговоры с незнакомцами и самостоятельные прогулки ребёнка далеко от дома без взрослых.
5. Тон повествования: позитивный, поддерживающий, экологичный, воспитательный.

Если запрос пользователя противоречит этим правилам — мягко скорректируй сюжет, сохранив исходную идею в безопасном виде, не сообщая пользователю технических деталей фильтрации.`;

const MODERATOR_PROMPT = `Ты — независимый ИИ-редактор безопасности детских сказок платформы JOMOK. Ничего не сочиняй. Строго проверь сказку:

А. БЕЗОПАСНОСТЬ (любое нарушение = провал): взрослые темы (алкоголь, табак, наркотики, оружие, насилие); хоррор/жестокость/смерть; буллинг/унижение; бытовые опасности (окна/балконы/крыши, острые предметы, таблетки не по назначению врача, разговоры с незнакомцами, уход ребёнка из дома без взрослых).
Б. КАЧЕСТВО (1-5): доброта; позитивный смысл/мораль; вдохновляет ли ребёнка.
В. ЕДИНСТВО ТЕМЫ: сюжет должен развиваться вокруг ОДНОЙ главной темы от завязки до развязки; если сюжет бросает заявленную тему и уходит в побочные линии — это NEEDS_REVISION.

Верни СТРОГО JSON без пояснений:
{"verdict":"APPROVED"|"NEEDS_REVISION"|"REJECTED","issues":["..."],"fix":"..."}

Правила: нарушение безопасности → REJECTED; безопасно, но качество ≤ 2 или сюжет ушёл от темы → NEEDS_REVISION; иначе APPROVED. Будь строгим, но не придирайся к безобидному.`;

const IMAGE_CHECK_PROMPT = (scene: string) => `Ты — контролёр качества иллюстраций детской книги. Строго проверь картинку:
1) АНАТОМИЯ: у людей и животных нет лишних или недостающих рук, ног, пальцев, глаз; лица не искажены; позы физически возможны.
2) БЕЗОПАСНОСТЬ: ничего пугающего, жестокого или неуместного для детей 3–8 лет.
3) АРТЕФАКТЫ: нет текста-абракадабры, «сломанных» объектов, сильных искажений.
4) СООТВЕТСТВИЕ СЦЕНЕ: изображение примерно соответствует описанию: "${scene}".
Верни СТРОГО JSON: {"ok":true|false,"reason":"кратко"}. Отклоняй только реальные дефекты, а не стилизацию.`;

const FALLBACK_RU = (name: string) =>
  `Жила-была на свете звёздочка, которая очень хотела подружиться с ребёнком по имени ${name}. Звёздочка каждую ночь заглядывала в окошко и желала добрых снов. Однажды она подарила ${name} волшебный сон, где добрый дракончик учился пускать мыльные пузыри, а единорог раскрашивал небо радугой. С тех пор ${name} знает: добрые друзья всегда рядом, даже если их не видно.`;

const FALLBACK_KY = (name: string) =>
  `Илгери-илгери асманда бир кичинекей жылдызча жашаптыр. Ал ${name} аттуу бала менен дос болгусу келчу. Бир күнү жылдызча ${name}ге сыйкырдуу түш белек кылды: боорукер дракончук көбүк учуруп, ак бирмүйуз асманды асан-үсөн менен боёп жатыптыр. Ошондон бери ${name} билет: жакшы достор ар дайым жаныңда.`;

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

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

async function sendTelegram(text: string) {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
      },
    );
    if (!res.ok) console.error("telegram failed:", await res.text());
  } catch (e) {
    console.error("telegram threw:", String(e));
  }
}

async function sendTelegramPhoto(url: string, caption: string) {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, photo: url, caption }),
      },
    );
    if (!res.ok) console.error("telegram photo failed:", await res.text());
  } catch (e) {
    console.error("telegram photo threw:", String(e));
  }
}

async function sendTelegramDocument(bytes: Uint8Array, filename: string, caption: string): Promise<boolean> {
  try {
    const form = new FormData();
    form.append("chat_id", TELEGRAM_CHAT_ID);
    if (caption) form.append("caption", caption);
    form.append("document", new Blob([bytes], { type: "application/pdf" }), filename);
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`,
      { method: "POST", body: form },
    );
    if (!res.ok) { console.error("telegram doc failed:", await res.text()); return false; }
    return true;
  } catch (e) {
    console.error("telegram doc threw:", String(e));
    return false;
  }
}

const IMG_STYLE =
  "Children's book illustration, Pixar-style 3D render, warm colors, soft golden lighting, cute friendly characters, kind and safe for children, high quality, detailed. ";

// Без фото — flux/schnell (дёшево). С фото ребёнка — flux-pulid (перенос лица в Pixar-стиль).
async function generateImage(prompt: string, refImage: string | null): Promise<string | null> {
  const endpoint = refImage ? "https://fal.run/fal-ai/flux-pulid" : "https://fal.run/fal-ai/flux/schnell";
  const body: Record<string, unknown> = refImage
    ? {
        prompt: IMG_STYLE + prompt,
        reference_image_url: refImage,
        image_size: "landscape_4_3",
        num_images: 1,
        negative_prompt: "ugly, deformed, scary, extra limbs, bad anatomy, text",
      }
    : {
        prompt: IMG_STYLE + prompt,
        image_size: "landscape_4_3",
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      };
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error("fal failed:", endpoint, res.status, await res.text());
      // если фото-модель недоступна — пробуем обычную без референса
      if (refImage) return await generateImage(prompt, null);
      return null;
    }
    const data = await res.json();
    return data?.images?.[0]?.url ?? null;
  } catch (e) {
    console.error("fal threw:", String(e));
    if (refImage) return await generateImage(prompt, null);
    return null;
  }
}

// ИИ-модерация картинки: Gemini смотрит на брак (анатомия, артефакты, соответствие сцене).
// При сбое самой проверки картинку НЕ блокируем.
async function moderateImage(url: string, scene: string): Promise<{ ok: boolean; reason: string }> {
  try {
    const imgRes = await fetch(url);
    if (!imgRes.ok) return { ok: true, reason: "img fetch failed" };
    const b64 = toBase64(new Uint8Array(await imgRes.arrayBuffer()));
    for (const model of VISION_MODELS) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                role: "user",
                parts: [
                  { text: IMAGE_CHECK_PROMPT(scene.slice(0, 300)) },
                  { inline_data: { mime_type: "image/jpeg", data: b64 } },
                ],
              }],
              generationConfig: { temperature: 0, maxOutputTokens: 300, responseMimeType: "application/json" },
            }),
          },
        );
        if (!res.ok) { console.error("vision failed:", model, res.status); continue; }
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
        const parsed = parseJsonLoose(text);
        if (parsed && typeof parsed.ok === "boolean") {
          return { ok: parsed.ok as boolean, reason: String(parsed.reason ?? "") };
        }
      } catch (e) {
        console.error("vision threw:", String(e));
      }
    }
    return { ok: true, reason: "check unavailable" };
  } catch {
    return { ok: true, reason: "check error" };
  }
}

async function callGemini(
  system: string,
  user: string,
  jsonMode: boolean,
): Promise<string> {
  let lastErr = "";
  for (const model of MODELS) {
    try {
      const generationConfig: Record<string, unknown> = {
        temperature: 0.9,
        maxOutputTokens: 8192,
        ...(jsonMode ? { responseMimeType: "application/json" } : {}),
      };
      if (model.startsWith("gemini-2.5")) {
        generationConfig.thinkingConfig = { thinkingBudget: 0 };
      }
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: user }] }],
            generationConfig,
          }),
        },
      );
      if (!res.ok) {
        lastErr = `${model}: ${res.status} ${await res.text()}`;
        continue;
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? "")
        .join("") ?? "";
      if (text.trim()) return text;
      lastErr = `${model}: empty response`;
    } catch (e) {
      lastErr = `${model}: ${String(e)}`;
    }
  }
  throw new Error(lastErr || "all models failed");
}

function parseJsonLoose(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function extractJsonString(text: string, key: string): string | null {
  const keyIdx = text.indexOf(`"${key}"`);
  if (keyIdx < 0) return null;
  let i = text.indexOf(":", keyIdx);
  if (i < 0) return null;
  i++;
  while (i < text.length && text[i] !== '"') i++;
  if (i >= text.length) return null;
  i++;
  let out = "";
  while (i < text.length) {
    const c = text[i];
    if (c === "\\") {
      const n = text[i + 1];
      if (n === "n") out += "\n";
      else if (n === "t") out += "\t";
      else if (n === "r") out += "";
      else if (n === '"') out += '"';
      else if (n === "\\") out += "\\";
      else if (n === "u") {
        out += String.fromCharCode(parseInt(text.slice(i + 2, i + 6), 16));
        i += 4;
      } else out += n ?? "";
      i += 2;
    } else if (c === '"') {
      break;
    } else {
      out += c;
      i++;
    }
  }
  return out.trim() || null;
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
    const {
      parentName = "",
      contact = "",
      childName = "малыш",
      childAge = "",
      interests = "",
      favoriteToy = "",
      genre = "",
      theme = "",
      language = "ru",
      childPhoto = "",
    } = payload ?? {};

    if (!GEMINI_API_KEY) {
      return json({ ok: false, code: "no_api_key" }, 200);
    }

    // Фото ребёнка: data-URI или http-URL; используется только для генерации, НЕ сохраняется.
    const refImage =
      typeof childPhoto === "string" && (childPhoto.startsWith("data:image") || childPhoto.startsWith("http"))
        ? childPhoto
        : null;

    const mainTheme = String(theme || interests || genre || "доброта и дружба").trim();

    const langName = language === "ky" ? "кыргызском" : "русском";
    const genPrompt =
      `Напиши добрую детскую сказку на ${langName} языке.\n` +
      `Главный герой: ребёнок по имени ${childName}` +
      (childAge ? `, возраст ${childAge}` : "") + `.\n` +
      `ГЛАВНАЯ ТЕМА СКАЗКИ (одна-единственная): ${mainTheme}. Если здесь перечислено несколько тем — выбери ПЕРВУЮ и строй весь сюжет только на ней.\n` +
      (favoriteToy
        ? `Любимая игрушка: ${favoriteToy} — добрый говорящий спутник героя ВНУТРИ главной темы (не отдельная сюжетная линия).\n`
        : "") +
      (genre ? `Жанр (задаёт тон повествования): ${genre}.\n` : "") +
      (interests && theme
        ? `Прочие интересы ребёнка (можно упомянуть мимоходом, НЕ делать из них сюжет): ${interests}.\n`
        : "") +
      `\nКОМПОЗИЦИЯ (СТРОГО — классическая детская сказка из трёх элементов):\n1) Зачин (присказка) — 1–2 абзаца.\n2) Основная часть по этапам сюжета: экспозиция (знакомство с героем и его миром), завязка, развитие действия (2–3 испытания), кульминация.\n3) Концовка — счастливая развязка и ясная добрая мораль.\n\nЕДИНСТВО ТЕМЫ (САМОЕ ВАЖНОЕ ПРАВИЛО): весь сюжет от завязки до развязки развивается вокруг главной темы «${mainTheme}». Каждое испытание, кульминация и мораль связаны именно с этой темой. КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО бросать тему после завязки, уводить сюжет в побочные линии или смешивать несколько тем в одну кучу.\n\nОбъём (СТРОГО): НЕ МЕНЕЕ 1200 слов, 14–18 развёрнутых абзацев, живые диалоги, описания мест и чувств героя. Если черновик короче — расширяй описания и диалоги ВНУТРИ главной темы.\nЯзык простой и образный, по возрасту ребёнка.\n\nИЛЛЮСТРАЦИИ: дополнительно верни массив illustrations из 4 промптов на АНГЛИЙСКОМ языке для картинок: [начало/обложка; середина; кульминация; финал]. Герой на картинках — ребёнок азиатской (центральноазиатской/кыргызской) внешности в СОВРЕМЕННОЙ повседневной одежде (футболка, джинсы, кроссовки, толстовка) — пиши например "a cute 6-year-old Central Asian (Kyrgyz) boy with dark hair, wearing a blue t-shirt, jeans and sneakers". В КАЖДОМ из 4 промптов повторяй ЭТО ОПИСАНИЕ ГЕРОЯ ДОСЛОВНО, плюс конкретная сцена по главной теме, без текста на картинке.\n` +
      `Ответ верни СТРОГО в JSON: {"title":"название","story":"текст с абзацами через \\n\\n","illustrations":["p1","p2","p3","p4"]}`;

    let title = "";
    let story = "";
    let illustrations: string[] = [];
    let status = "approved";
    let attempts = 1;
    let moderation: Record<string, unknown> | null = null;

    const generate = async (extraFix: string) => {
      const raw = await callGemini(
        SAFETY_SYSTEM_PROMPT,
        genPrompt + (extraFix ? `\n\nВАЖНО — исправь замечания редактора: ${extraFix}` : ""),
        true,
      );
      const parsed = parseJsonLoose(raw);
      if (parsed && typeof parsed.story === "string" && parsed.story.trim()) {
        const ills = Array.isArray(parsed.illustrations)
          ? (parsed.illustrations as unknown[]).map(String).filter(Boolean).slice(0, 4)
          : [];
        return {
          title: String(parsed.title ?? "").trim(),
          story: String(parsed.story).trim(),
          illustrations: ills,
        };
      }
      const extractedStory = extractJsonString(raw, "story");
      if (extractedStory) {
        return {
          title: extractJsonString(raw, "title") ?? "",
          story: extractedStory,
          illustrations: [] as string[],
        };
      }
      return { title: "", story: raw.trim(), illustrations: [] as string[] };
    };

    const moderate = async (taleText: string) => {
      try {
        const raw = await callGemini(
          MODERATOR_PROMPT,
          `Главная тема этой сказки: «${mainTheme}».\n\nПроверь эту сказку:\n\n${taleText}`,
          true,
        );
        return parseJsonLoose(raw);
      } catch (e) {
        console.error("moderator failed:", String(e));
        return null;
      }
    };

    const first = await generate("");
    title = first.title;
    story = first.story;
    illustrations = first.illustrations;
    moderation = await moderate(story);

    if (moderation && moderation.verdict && moderation.verdict !== "APPROVED") {
      attempts = 2;
      const fix = String(moderation.fix ?? (moderation.issues as string[])?.join("; ") ?? "");
      try {
        const second = await generate(fix);
        const check2 = await moderate(second.story);
        if (!check2 || check2.verdict === "APPROVED") {
          title = second.title || title;
          story = second.story;
          illustrations = second.illustrations.length ? second.illustrations : illustrations;
          moderation = check2 ?? moderation;
          status = "approved";
        } else {
          story = language === "ky" ? FALLBACK_KY(childName) : FALLBACK_RU(childName);
          title = language === "ky" ? `${childName} жана жылдызча` : `${childName} и звёздочка`;
          illustrations = [];
          moderation = check2;
          status = "fallback";
        }
      } catch (e) {
        console.error("regeneration failed:", String(e));
        story = language === "ky" ? FALLBACK_KY(childName) : FALLBACK_RU(childName);
        title = language === "ky" ? `${childName} жана жылдызча` : `${childName} и звёздочка`;
        illustrations = [];
        status = "fallback";
      }
    }

    if (!title) {
      title = language === "ky" ? `${childName} жөнүндө жомок` : `Сказка про ${childName}`;
    }

    // Иллюстрации: генерация (с фото — PuLID) + ИИ-модерация каждой картинки + 1 ретрай, брак отсеивается
    const imageUrls: string[] = [];
    let rejectedImages = 0;
    for (const p of illustrations) {
      let url = await generateImage(p, refImage);
      if (!url) continue;
      let check = await moderateImage(url, p);
      if (!check.ok) {
        console.error("image rejected:", check.reason);
        const retry = await generateImage(p, refImage);
        if (retry) {
          const check2 = await moderateImage(retry, p);
          if (check2.ok) {
            url = retry;
          } else {
            console.error("retry rejected:", check2.reason);
            rejectedImages++;
            url = "";
          }
        } else {
          rejectedImages++;
          url = "";
        }
      }
      if (url) imageUrls.push(url);
    }

    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await supabase.from("tales").insert({
        parent_name: parentName || null,
        contact: contact || null,
        child_name: childName,
        child_age: childAge || null,
        interests: interests || null,
        favorite_toy: favoriteToy || null,
        genre: genre || null,
        theme: theme || null,
        language,
        status,
        title,
        text: story,
        moderation: moderation ?? null,
        attempts,
        image_urls: imageUrls.length ? imageUrls : null,
      });
    } catch (dbErr) {
      console.error("tales insert failed:", String(dbErr));
    }

    const verdict = String(moderation?.verdict ?? "нет данных");
    const header =
      `\u{1F4D6} Сказка на проверку\n` +
      `\u{1F916} ИИ-модерация текста: ${verdict}` +
      (status === "fallback" ? " (ЗАПАСНАЯ сказка!)" : "") +
      ` · попыток: ${attempts}\n` +
      `\u{1F3AF} Тема: ${mainTheme}\n` +
      `\u{1F5BC} Иллюстраций: ${imageUrls.length}` +
      (rejectedImages ? ` · отбраковано ИИ: ${rejectedImages}` : "") +
      (refImage ? ` · \u{1F4F7} по фото ребёнка` : "") + `\n` +
      `\u{1F464} ${parentName || "-"} · \u{1F4E7} ${contact || "-"}\n` +
      `\u{1F9D2} ${childName} (${childAge || "-"}) · ${language.toUpperCase()}\n\n` +
      `\u{00AB}${title}\u{00BB}`;
    await sendTelegram(header);

    let pdfSent = false;
    let pdfBytes: Uint8Array | null = null;
    try {
      pdfBytes = await buildPdf({ title, story, images: imageUrls, childName, language });
    } catch (e) {
      console.error("pdf build failed:", String(e));
    }
    if (pdfBytes) {
      pdfSent = await sendTelegramDocument(pdfBytes, "jomoktor-skazka.pdf", `\u{1F4D6} PDF-книжка: \u{00AB}${title}\u{00BB}`);
    }
    if (!pdfSent) {
      for (let i = 0; i < story.length; i += 3500) {
        await sendTelegram(story.slice(i, i + 3500));
      }
      for (let i = 0; i < imageUrls.length; i++) {
        await sendTelegramPhoto(imageUrls[i], `Иллюстрация ${i + 1}`);
      }
    }

    return json({ ok: true, title, status, images: imageUrls.length, rejectedImages, pdfSent, personalized: !!refImage });
  } catch (err) {
    console.error("generate-tale error:", String(err));
    return json({ ok: false, error: String(err) }, 500);
  }
});
