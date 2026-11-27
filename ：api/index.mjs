export default {
  async fetch(request) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);
    const rawPath = url.searchParams.get("__path") || "";
    url.searchParams.delete("__path");
    const cleanPath = rawPath.replace(/^\/+/, "");
    const cleanSearch = url.searchParams.toString();

    const targetUrl =
      "https://index-translate.bilibili.com/" +
      cleanPath +
      (cleanSearch ? "?" + cleanSearch : "");

    const headers = new Headers();
    headers.set("User-Agent", "Index-Translate-Client/1.0");

    const contentType = request.headers.get("Content-Type");
    if (contentType) {
      headers.set("Content-Type", contentType);
    }

    let body = undefined;
    if (request.method !== "GET" && request.method !== "HEAD") {
      const rawBody = await request.text();
      const isJson =
        contentType &&
        contentType.indexOf("application/json") !== -1;

      if (rawBody && isJson) {
        try {
          const json = JSON.parse(rawBody);
          if (!json.chat_template_kwargs) {
            json.chat_template_kwargs = {
              enable_thinking: false,
            };
          }
          if (json.temperature === undefined) {
            json.temperature = 0.0;
          }
          body = JSON.stringify(json);
        } catch (err) {
          body = rawBody;
        }
      } else {
        body = rawBody;
      }
    }

    const upstreamResp = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: body,
    });

    const respHeaders = new Headers(upstreamResp.headers);
    respHeaders.delete("content-encoding");
    respHeaders.delete("content-length");
    for (const entry of Object.entries(corsHeaders)) {
      respHeaders.set(entry[0], entry[1]);
    }

    return new Response(upstreamResp.body, {
      status: upstreamResp.status,
      statusText: upstreamResp.statusText,
      headers: respHeaders,
    });
  },
};
