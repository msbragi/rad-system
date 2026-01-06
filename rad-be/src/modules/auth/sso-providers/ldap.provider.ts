import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SsoProvider, SsoUserData } from './sso-provider.interface';
import { SsoProviderMask } from 'src/common/interfaces/sso-provider.enum';
import * as ldap from 'ldapjs';

interface InternalLdapConfig {
    enabled: boolean;
    server: string;
    baseDn: string;
    appUser: string;
    appPass: string;
    filter: string;
    directBind: boolean;
    changePasswordUrl: string;
    fieldMap: Record<string, string>;
}

@Injectable()
export class LdapProvider implements SsoProvider {
    readonly providerName = 'ldap';
    readonly ssoMask = SsoProviderMask.LDAP;
    private readonly logger = new Logger(LdapProvider.name);
    private readonly config: InternalLdapConfig;

    constructor(private readonly configService: ConfigService) {
        this.config = this.providerConfig();
    }

    getChangePasswordUrl(): string {
        return this.config.changePasswordUrl;
    }

    providerConfig(): InternalLdapConfig {
        const parseBool = (val?: string) => val === 'true' || val === '1';
        const mapStr = this.configService.get<string>('LDAP_FIELD_MAP', '');
        const fieldMap = mapStr.split(',').reduce((acc, pair) => {
            const [ldapField, dbField] = pair.split(':');
            if (ldapField && dbField) acc[ldapField.trim()] = dbField.trim();
            return acc;
        }, {} as Record<string, string>);

        return {
            enabled: parseBool(this.configService.get<string>('LDAP_AUTH')),
            directBind: parseBool(this.configService.get<string>('LDAP_DIRECT_BIND')),
            server: this.configService.get<string>('LDAP_SERVER', ''),
            baseDn: this.configService.get<string>('LDAP_BASE_DN', ''),
            appUser: this.configService.get<string>('LDAP_APP_USER', ''),
            appPass: this.configService.get<string>('LDAP_APP_PASS', ''),
            filter: this.configService.get<string>('LDAP_FILTER', ''),
            changePasswordUrl: this.configService.get<string>('LDAP_CHANGE_PASSWORD', '#'),
            fieldMap,
        };
    }

    async authenticate(identifier: string, password: string): Promise<SsoUserData | null> {
        if (!this.config.enabled) return null;
        if (this.config.directBind) {
            return this.directBind(identifier, password);
        } else {
            return this.searchAndBind(identifier, password);
        }
    }

    private async directBind(username: string, password: string): Promise<SsoUserData | null> {
        const client = ldap.createClient({ url: this.config.server });
        client.on('error', (err) => {
            this.logger.error(`LDAP client error: ${err.message}`);
        });
        return new Promise((resolve) => {
            client.bind(username, password, (err) => {
                if (err) {
                    this.logger.debug(`Direct bind failed for ${username}: ${err.message}`);
                    client.unbind();
                    return resolve(null);
                }
                client.unbind();
                resolve({
                    email: username,
                    username,
                    ssoMask: SsoProviderMask.LDAP,
                });
            });
        });
    }

    private async searchAndBind(username: string, password: string): Promise<SsoUserData | null> {
        const client = ldap.createClient({ url: this.config.server });
        client.on('error', (err) => {
            this.logger.error(`LDAP client error: ${err.message}`);
        });
        return new Promise((resolve) => {
            client.bind(this.config.appUser, this.config.appPass, (err) => {
                if (err) {
                    this.logger.debug(`App bind failed: ${err.message}`);
                    client.unbind();
                    return resolve(null);
                }
                const filter = this.config.filter.replace('{username}', username);
                client.search(this.config.baseDn, { filter, scope: 'sub' }, (err, res) => {
                    if (err) {
                        this.logger.debug(`LDAP search error: ${err.message}`);
                        client.unbind();
                        return resolve(null);
                    }
                    let userDn = null;
                    let userEntry = null;
                    res.on('searchEntry', (entry) => {
                        userDn = entry.object.dn;
                        userEntry = entry.object;
                    });
                    res.on('end', () => {
                        if (!userDn) {
                            client.unbind();
                            return resolve(null);
                        }
                        client.bind(userDn, password, (err) => {
                            if (err) {
                                this.logger.debug(`User bind failed for ${userDn}: ${err.message}`);
                                client.unbind();
                                return resolve(null);
                            }
                            client.unbind();
                            const mapped: SsoUserData = {
                                ssoMask: SsoProviderMask.LDAP,
                                email: ''
                            };
                            for (const [ldapField, dbField] of Object.entries(this.config.fieldMap)) {
                                mapped[dbField] = userEntry[ldapField];
                            }
                            if (!mapped.email) mapped.email = username;
                            resolve(mapped);
                        });
                    });
                });
            });
        });
    }
}