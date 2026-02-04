import { Injectable } from '@nestjs/common';
import { LdapProvider } from './ldap.provider';
import { SsoProvider, SsoUserData } from './sso-provider.interface';

@Injectable()
export class SsoService {
  private readonly providers: SsoProvider[];

  constructor(
    private readonly ldapProvider: LdapProvider,
    // In futuro: altri provider via DI
  ) {
    this.providers = [];
    // Registra solo se abilitato
    if (this.ldapProvider.providerConfig().enabled) {
      this.providers.push(this.ldapProvider);
    }
    // In futuro: aggiungi qui altri provider se abilitati
  }

  /**
   * Tenta autenticazione SSO con tutti i provider registrati (in ordine).
   * @param identifier email o username
   * @param password password in chiaro
   * @returns SsoUserData se autenticazione SSO riuscita, null se nessun provider ha autenticato
   */
  async authenticate(identifier: string, password: string): Promise<SsoUserData | null> {
    for (const provider of this.providers) {
      const userData = await provider.authenticate(identifier, password);
      if (userData) {
        return userData;
      }
    }
    return null;
  }

  getChangePasswordUrls(ssoMask: number = 65535): { provider: string; url: string }[] {
    return this.providers
      .filter(p => p['ssoMask'] & ssoMask)
      .map(p => ({
        provider: p.providerName,
        url: p.getChangePasswordUrl()
      }))
      .filter(item => !!item.url); // Solo provider con URL valida
  }
}