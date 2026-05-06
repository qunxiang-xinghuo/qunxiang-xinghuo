import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";
import multer from "multer";
import path from "path";
import { writeFile } from "fs/promises";
import { Readable } from "stream";

// Multer 配置：内存存储，限制 2MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("请上传有效的图片文件"));
      return;
    }
    cb(null, true);
  },
});

/**
 * 将 NextRequest 适配为 multer 可用的 Node.js stream
 */
class FakeRequest extends Readable {
  constructor(
    public headers: Record<string, string>,
    public method: string,
    public url: string,
    buffer: Buffer
  ) {
    super();
    this.push(buffer);
    this.push(null);
  }
  _read() {}
}

/**
 * POST /api/users/avatar
 * 使用 Multer 处理文件上传，保存到 public/avatars/
 */
/**
 * POST /api/users/avatar
 * 使用 Multer 处理文件上传，保存到 public/avatars/
 * v7.0-fix6: 改用 getToken，App Router 中 getServerSession 不可靠
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.id as string | undefined) || (token?.sub as string | undefined);

    if (!userId) {
      return NextResponse.json(apiError("UNAUTHORIZED", "请先登录"), { status: 401 });
    }

    // 读取原始 body buffer
    const buffer = Buffer.from(await req.arrayBuffer());
    const headers = Object.fromEntries(req.headers.entries());

    // 创建假请求对象供 multer 处理
    const fakeReq = new FakeRequest(headers, req.method || "POST", req.url || "/", buffer);

    // 运行 multer 中间件
    const fileInfo: any = await new Promise((resolve, reject) => {
      upload.single("image")(fakeReq as any, {} as any, (err: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve((fakeReq as any).file);
      });
    });

    if (!fileInfo || !fileInfo.buffer) {
      return NextResponse.json(apiError("BAD_REQUEST", "未找到上传的文件"), { status: 400 });
    }

    // 生成唯一文件名
    const ext = path.extname(fileInfo.originalname) || ".jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const avatarsDir = path.join(process.cwd(), "public", "avatars");
    const filepath = path.join(avatarsDir, filename);

    // v7.0-test11: 确保目录存在
    await import('fs/promises').then(fs => fs.mkdir(avatarsDir, { recursive: true }));

    // 写入文件系统
    await writeFile(filepath, fileInfo.buffer);

    // 数据库更新为相对路径
    const imageUrl = `/avatars/${filename}`;
    const updated = await db.user.update({
      where: { id: userId },
      data: { image: imageUrl },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });

    return NextResponse.json(apiResponse({
      user: updated,
      imageUrl,
    }));
  } catch (error: any) {
    console.error("[Update Avatar API] Error:", error);
    if (error.message?.includes("File too large")) {
      return NextResponse.json(apiError("BAD_REQUEST", "图片大小不能超过 2MB"), { status: 400 });
    }
    if (error.message?.includes("请上传有效的图片文件")) {
      return NextResponse.json(apiError("BAD_REQUEST", error.message), { status: 400 });
    }
    return NextResponse.json(apiError("SERVER_ERROR", "头像上传失败"), { status: 500 });
  }
}
