import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { messages, system } = body || {};
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  const payload = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system || "You are Omnia Assistant. Classify user intent (hotels, cars, flights, tours, shops, finance) and return JSON with fields: intent, query, country, suggestions:[{title,url,reason}] based on provided affiliate URL patterns. Keep it short and safe." },
      ...(Array.isArray(messages) ? messages : []),
    ],
    temperature: 0.2,
    response_format: { type: "json_object" }
  };

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const err = await resp.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  return new NextResponse(content, {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
