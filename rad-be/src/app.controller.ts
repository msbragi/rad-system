import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@ApiTags('RAD System Api')
@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get API documentation URL' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the API documentation URL',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        docsUrl: { type: 'string' }
      }
    }
  })
  getApiDocs() {
    return this.appService.getApiDocs();
  }
}