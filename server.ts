import 'dotenv/config';
import fs from 'fs';
import {createServer as createHttpServer} from 'http';
import express from 'express';
import type {Request, Response} from 'express';
import path from 'path';
import {fileURLToPath} from 'url';
import {GoogleGenAI, ThinkingLevel, Type} from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

const BUILTIN_PRESET_IDS = [
  'sofal-10',
  'sofal-15',
  'sofal-20',
  'feshari',
  'laftoon',
  'block-10',
  'block-15',
  'block-20',
];

interface ClientUserMaterialSummary {
  id: string;
  name: string;
  thicknessCm: number;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  app.use(express.json({limit: '128kb'}));

  // Direct installable Android APK download routes (supports both /apk/BannaSanj-v1.1.apk and /download/BannaSanj.apk)
  const serveApk = (_req: Request, res: Response) => {
    const candidates = [
      path.join(__dirname, 'public', 'apk', 'BannaSanj-v1.1.apk'),
      path.join(__dirname, 'dist', 'apk', 'BannaSanj-v1.1.apk'),
    ];
    const apkPath = candidates.find((p) => fs.existsSync(p));
    if (!apkPath) {
      res.status(404).type('text/plain').send('APK file not found');
      return;
    }
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="BannaSanj-v1.1.apk"');
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(apkPath);
  };
  app.get('/apk/BannaSanj-v1.1.apk', serveApk);
  app.get('/download/BannaSanj.apk', serveApk);

  // Server-side AI natural language parser ONLY for extracting dimensions & material preset (including user-defined materials).
  // Never performs material quantity calculations.
  app.post('/api/parse-wall', async (req: Request, res: Response) => {
    try {
      const rawText = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
      if (!rawText || rawText.length < 3 || rawText.length > 500) {
        res.status(400).json({
          parsed: false,
          error: 'لطفاً یک جمله کوتاه درباره ابعاد و مصالح دیوار بنویسید.',
        });
        return;
      }

      const rawUserMaterials: ClientUserMaterialSummary[] = Array.isArray(req.body?.userMaterials)
        ? req.body.userMaterials
            .filter(
              (m: {id?: unknown; name?: unknown}) =>
                typeof m?.id === 'string' && typeof m?.name === 'string'
            )
            .slice(0, 30)
            .map((m: {id: string; name: string; thicknessCm?: unknown}) => ({
              id: m.id,
              name: m.name,
              thicknessCm: typeof m.thicknessCm === 'number' ? m.thicknessCm : 15,
            }))
        : [];

      const validIds = new Set([
        ...BUILTIN_PRESET_IDS,
        ...rawUserMaterials.map((m) => m.id),
      ]);

      const userMaterialPromptLines =
        rawUserMaterials.length > 0
          ? `\nهمچنین کاربر این مصالح اختصاصی را تعریف کرده است؛ اگر در جمله به نام آن‌ها اشاره شد شناسه دقیق آن را برگردان:\n` +
            rawUserMaterials
              .map((m) => `  "${m.id}" (${m.name} — ضخامت ${m.thicknessCm} سانت)`)
              .join('\n')
          : '';

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          parsed: false,
          code: 'NO_API_KEY',
          error: 'سرویس تشخیص هوشمند در دسترس نیست.',
        });
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `جمله کاربر برای دیوارچینی: «${rawText}»`,
        config: {
          thinkingConfig: {thinkingLevel: ThinkingLevel.LOW},
          systemInstruction: `تو فقط استخراج‌کننده اطلاعات ابعاد دیوارچینی از متن فارسی هستی.
هرگز مقدار مصالح یا قیمت محاسبه نکن. فقط مقادیر زیر را اگر در جمله وجود دارد استخراج کن:
- lengthM: طول دیوار به متر (عدد مثبت، اگر ذکر نشده صفر بگذار)
- heightM: ارتفاع یا بلندی دیوار به متر (عدد مثبت، اگر ذکر نشده صفر بگذار)
- wallThicknessCm: ضخامت یا عرض دیوار به سانتی‌متر (مثلاً ۱۰، ۱۵، ۲۰، ۲۲، ۳۵؛ اگر ذکر نشده صفر بگذار)
- materialPresetId: یکی از شناسه‌های مصالح زیر اگر در جمله اشاره شده، وگرنه رشته خالی "":
  "sofal-10" (آجر سفال ۱۰ سانتی / تیغه ۱۰)
  "sofal-15" (آجر سفال ۱۵ سانتی / تیغه ۱۵)
  "sofal-20" (آجر سفال ۲۰ سانتی)
  "feshari" (آجر فشاری / آجر گری / آجر زرد یا قرمز سنتی)
  "laftoon" (آجر لفتون / ده‌سوراخ / بهمنی)
  "block-10" (بلوک سیمانی ۱۰ سانتی)
  "block-15" (بلوک سیمانی ۱۵ سانتی)
  "block-20" (بلوک سیمانی ۲۰ سانتی)${userMaterialPromptLines}
- openings: فهرست بازشوها (در یا پنجره) اگر کاربر ابعادش را به متر گفته باشد.
- parsed: فقط اگر حداقل طول یا ارتفاع یا نوع مصالح معتبر در متن بود true بگذار، در غیر این صورت false.
- summaryFa: توضیح خیلی کوتاه فارسی از چیزی که تشخیص دادی.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              parsed: {type: Type.BOOLEAN},
              lengthM: {type: Type.NUMBER},
              heightM: {type: Type.NUMBER},
              wallThicknessCm: {type: Type.NUMBER},
              materialPresetId: {type: Type.STRING},
              openings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: {type: Type.STRING},
                    widthM: {type: Type.NUMBER},
                    heightM: {type: Type.NUMBER},
                  },
                },
              },
              summaryFa: {type: Type.STRING},
            },
            required: [
              'parsed',
              'lengthM',
              'heightM',
              'wallThicknessCm',
              'materialPresetId',
              'summaryFa',
            ],
          },
        },
      });

      const rawJson = (response.text ?? '{}').trim();
      const data = JSON.parse(rawJson);

      const lengthM = typeof data.lengthM === 'number' && data.lengthM > 0 ? data.lengthM : null;
      const heightM = typeof data.heightM === 'number' && data.heightM > 0 ? data.heightM : null;
      const wallThicknessCm =
        typeof data.wallThicknessCm === 'number' && data.wallThicknessCm > 0
          ? data.wallThicknessCm
          : null;
      const materialPresetId =
        typeof data.materialPresetId === 'string' && validIds.has(data.materialPresetId)
          ? data.materialPresetId
          : null;

      const openings = Array.isArray(data.openings)
        ? data.openings
            .filter(
              (o: {widthM?: unknown; heightM?: unknown}) =>
                typeof o?.widthM === 'number' &&
                o.widthM > 0 &&
                typeof o?.heightM === 'number' &&
                o.heightM > 0
            )
            .map((o: {label?: unknown; widthM: number; heightM: number}) => ({
              label: typeof o.label === 'string' && o.label.trim() ? o.label.trim() : 'بازشو',
              widthM: o.widthM,
              heightM: o.heightM,
            }))
        : [];

      const hasUsefulData = Boolean(
        lengthM || heightM || materialPresetId || wallThicknessCm || openings.length > 0
      );

      res.json({
        parsed: Boolean(data.parsed && hasUsefulData),
        lengthM,
        heightM,
        wallThicknessCm,
        materialPresetId,
        openings,
        summaryFa: typeof data.summaryFa === 'string' ? data.summaryFa : '',
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in /api/parse-wall:', errMsg);
      res.status(500).json({
        parsed: false,
        error: 'خطا در تحلیل جمله. لطفاً ابعاد را دستی وارد کنید.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        allowedHosts: true,
        ws: {
          server: httpServer,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`BannaSanj server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
