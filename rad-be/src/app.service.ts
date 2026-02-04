import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getApiDocs(): { message: string; docsUrl: string } {
    const port = this.configService.get('PORT', 3000);
    const docsUrl = `/api-docs/v1`;
    
    return {
      message: 'Welcome to RAD System API',
      docsUrl: docsUrl
    };
  }
}