import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

const OUT_DIR = path.resolve(process.cwd(), "public");

type Job = { prompt: string; out: string; size: string };

const jobs: Job[] = [
  {
    size: "1440x768",
    out: path.join(OUT_DIR, "hero", "galaxy.jpg"),
    prompt:
      "Ultra premium cosmic galaxy background, deep space nebula in teal cyan and magenta, scattered stars, soft glowing aurora bands, dark elegant, high end e-commerce hero backdrop, photographic, subtle vignette, no text, no logos",
  },
  {
    size: "1024x1024",
    out: path.join(OUT_DIR, "products", "orion-runner.png"),
    prompt:
      "Premium product photograph of a futuristic running sneaker named Orion Runner, sleek low-top silhouette, white and silver upper with cyan neon accents, floating on a dark reflective obsidian surface, dramatic studio lighting with cyan rim light glow, soft galaxy bokeh background, ultra detailed, commercial advertising quality, no text, no logo, centered",
  },
  {
    size: "1024x1024",
    out: path.join(OUT_DIR, "products", "lunar-drift.png"),
    prompt:
      "Premium product photograph of a futuristic high-top sneaker named Lunar Drift, cream and off-white premium leather upper with lime green neon sole, floating on a dark reflective surface, dramatic studio lighting with lime rim light glow, soft lunar crater bokeh background, ultra detailed, commercial advertising quality, no text, no logo, centered",
  },
  {
    size: "1024x1024",
    out: path.join(OUT_DIR, "products", "solar-pulse.png"),
    prompt:
      "Premium product photograph of a high-performance technical sneaker named Solar Pulse, black knit upper with gold and amber neon accents, aggressive sole, floating on a dark reflective surface, dramatic studio lighting with warm golden rim light glow, soft solar flare bokeh background, ultra detailed, commercial advertising quality, no text, no logo, centered",
  },
  {
    size: "1024x1024",
    out: path.join(OUT_DIR, "products", "nebula-dunk.png"),
    prompt:
      "Premium product photograph of a chunky dunk-style sneaker named Nebula Dunk, deep purple and violet upper with magenta and cyan neon accents, thick sole, floating on a dark reflective surface, dramatic studio lighting with purple neon rim light glow, soft nebula cloud bokeh background, ultra detailed, commercial advertising quality, no text, no logo, centered",
  },
  {
    size: "1024x1024",
    out: path.join(OUT_DIR, "products", "void-classic.png"),
    prompt:
      "Premium product photograph of a classic skate sneaker named Void Classic, all black suede upper with hot pink neon accents and white sole, floating on a dark reflective surface, dramatic studio lighting with pink rim light glow, soft dark cosmic bokeh background, ultra detailed, commercial advertising quality, no text, no logo, centered",
  },
  {
    size: "1024x1024",
    out: path.join(OUT_DIR, "products", "meteor-air.png"),
    prompt:
      "Premium product photograph of an air-cushioned sneaker named Meteor Air, charcoal and orange gradient upper with fiery red neon accents, visible air bubble sole, floating on a dark reflective surface, dramatic studio lighting with orange rim light glow, soft meteor streak bokeh background, ultra detailed, commercial advertising quality, no text, no logo, centered",
  },
  {
    size: "1344x768",
    out: path.join(OUT_DIR, "hero", "lifestyle.jpg"),
    prompt:
      "Cinematic lifestyle photo of an astronaut wearing futuristic sneakers standing on a glowing alien planet surface, neon teal and magenta atmosphere, stars and nebula in sky, premium fashion editorial, ultra detailed, no text",
  },
];

async function run() {
  const zai = await ZAI.create();
  let ok = 0;
  let fail = 0;
  for (const job of jobs) {
    try {
      if (fs.existsSync(job.out)) {
        ok++;
        console.log(`[SKIP] ${path.basename(job.out)} (already exists)`);
        continue;
      }
      const t0 = Date.now();
      const res = await zai.images.generations.create({
        prompt: job.prompt,
        size: job.size as any,
      });
      const b64 = res.data?.[0]?.base64;
      if (!b64) throw new Error("no base64 in response");
      fs.mkdirSync(path.dirname(job.out), { recursive: true });
      fs.writeFileSync(job.out, Buffer.from(b64, "base64"));
      ok++;
      console.log(`[OK] ${path.basename(job.out)} (${Date.now() - t0}ms)`);
    } catch (e: any) {
      fail++;
      console.error(`[FAIL] ${path.basename(job.out)}: ${e?.message || e}`);
    }
  }
  console.log(`DONE ok=${ok} fail=${fail}`);
}

run().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
