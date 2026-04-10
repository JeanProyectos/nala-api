import { Body, Controller, Post } from '@nestjs/common';
import { DiagnosticsService } from './diagnostics.service';
import { VideoCallLogDto } from './dto/videocall-log.dto';

@Controller('diagnostics')
export class DiagnosticsController {
  constructor(private readonly diagnosticsService: DiagnosticsService) {}

  @Post('videocall-log')
  async saveVideoCallLog(@Body() payload: VideoCallLogDto) {
    const result = await this.diagnosticsService.saveVideoCallLog(payload);
    return {
      success: true,
      ...result,
    };
  }
}

