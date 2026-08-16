import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getSupabaseClient } from '../config/supabase.config';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

@Injectable()
export class ScreenshotStoreService {
  private readonly logger = new Logger(ScreenshotStoreService.name);

  constructor(private configService: ConfigService) {}

  async upload(
    file: Express.Multer.File,
    studentId: string,
    questionId: string,
  ): Promise<string> {
    if (!file) throw new BadRequestException('Screenshot file is required');
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype))
      throw new BadRequestException('Screenshot must be PNG, JPEG, or WebP');
    if (file.size > MAX_FILE_SIZE_BYTES)
      throw new BadRequestException('Screenshot must be under 5MB');

    const ext = file.mimetype.split('/')[1];
    const fileName = `${studentId}/${questionId}/${Date.now()}.${ext}`;
    const bucket = this.configService.get<string>(
      'SCREENSHOT_BUCKET',
      'solve-screenshots',
    );

    const supabase = getSupabaseClient(this.configService);

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      this.logger.error('Supabase Storage upload failed', error);
      throw new BadRequestException('Screenshot upload failed. Please try again.');
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    this.logger.log(`Screenshot uploaded: ${data.publicUrl}`);
    return data.publicUrl;
  }
}
