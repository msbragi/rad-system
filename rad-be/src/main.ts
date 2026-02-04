import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { writeFileSync } from 'fs';
import helmet from 'helmet';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    const isDevelopment = configService.get('NODE_ENV') !== 'production';

    // Helmet with relaxed CSP for Swagger in 
    if (isDevelopment) {
        app.use(helmet({
            contentSecurityPolicy: false,
        }));
    } else {
        app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));
    }

    // CORS configuration
    const corsOrigins = configService.get<string>('CORS_ORIGINS', 'http://localhost:4200').split(',');
    const corsMethods = configService.get<string>('CORS_METHODS', 'GET,POST,PUT,DELETE,PATCH,OPTIONS').split(',');
    const corsHeaders = configService.get<string>('CORS_HEADERS', 'Content-Type,Authorization,Accept,Origin,X-Requested-With').split(',');
    const corsCredentials = configService.get<boolean>('CORS_CREDENTIALS', false);

    app.enableCors({
        origin: corsOrigins,
        methods: corsMethods,
        allowedHeaders: corsHeaders,
        credentials: corsCredentials,
    });

    // Swagger configuration
    const config = new DocumentBuilder()
        .setTitle('RAD System')
        .setVersion('1.0')
        .setDescription('📚 RAD System API Documentation')
        .addTag('RAD System Api', 'Rapid development infrastructure for nestjs and angular')
        .addTag('auth', 'RAD authentication management')
        .addTag('departments', 'RAD Departments')
        .addTag('configuration', 'RAD Configuration')
        .addTag('users', 'RAD users management')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'Authorization',
                in: 'header',
            },
            'jwt-auth',
        )
        .build();

    const document = SwaggerModule.createDocument(app, config);
    const swaggerOptions = {
        swaggerOptions: {
            defaultModelsExpandDepth: -1
        }
    }

    SwaggerModule.setup('api-docs/v1', app, document, swaggerOptions);

    if (configService.get('NODE_ENV') !== 'production') {
        try {
            writeFileSync('./rad-openapi3-spec.json', JSON.stringify(document, null, 2));
            console.log('✅ OpenAPI spec for RAG System written successfully');
        } catch (error) {
            console.warn('⚠️ Could not write OpenAPI spec file:', error.message);
        }
    }

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );

    const port = configService.get<number>('PORT', 3000);
    await app.listen(port, '0.0.0.0');

    console.log(`🚀 RAG System is running on: http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api-docs/v1`);
}
bootstrap();