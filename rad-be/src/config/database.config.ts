import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (config: ConfigService): TypeOrmModuleOptions => {
    const dbType = config.get('DB_TYPE', 'mariadb');

    // Common configuration
    const commonConfig = {
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        //synchronize: config.get('NODE_ENV', 'development') === 'development',
        synchronize: false, // Disable auto-sync always
        logging: config.get('NODE_ENV', 'development') === 'development',
    };

    switch (dbType.toLowerCase()) {
        case 'mysql':
        case 'mariadb':
            const type = dbType.toLowerCase() === 'mysql' ? 'mysql' : 'mariadb';
            return {
                type: type,
                host: config.get('MYSQL_HOST', 'localhost'),
                port: config.get('MYSQL_PORT', 3306),
                username: config.get('MYSQL_USERNAME', 'rag_user'),
                password: config.get('MYSQL_PASSWORD', 'rag_password'),
                database: config.get('MYSQL_DATABASE', 'rag_db'),
                charset: config.get('MYSQL_CHARSET', 'utf8mb4'),
                timezone: config.get('MYSQL_TIMEZONE', '+00:00'),
                ssl: config.get('NODE_ENV', 'development') === 'production',
                ...commonConfig,
            };
        case 'pgsql':
        case 'postgres':
        case 'postgresql':
            return {
                type: 'postgres',
                host: config.get('PGSQL_HOST', 'localhost'),
                port: config.get('PGSQL_PORT', 5432),
                username: config.get('PGSQL_USERNAME', 'rag_user'),
                password: config.get('PGSQL_PASSWORD', 'rag_password'),
                database: config.get('PGSQL_DATABASE', 'rag_db'),
                schema: config.get('PGSQL_SCHEMA', 'rag_schema'),
                ssl: config.get('NODE_ENV', 'development') === 'production',
                ...commonConfig,
            }
        case 'sqlite':
        default:
            throw new Error(`Unsupported database type: ${dbType}. Supported types: sqlite, mysql, postgres`);
    }
};