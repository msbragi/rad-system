export enum ConfigKey {
  PROVIDER_CONFIG = 'PROVIDER_CONFIG',
  LDAP_CONFIG = 'LDAP_CONFIG',
  SSH_CONFIG = 'SSH_CONFIG',
  EMAIL_CONFIG = 'EMAIL_CONFIG',
  URLS_CONFIG = 'URLS_CONFIG',
  MISC_CONFIG = 'MISC_CONFIG'
}

export interface IConfig {
  key: ConfigKey | string;
  description?: string;
  isEnvValue: boolean;
  value: string | object;
}
