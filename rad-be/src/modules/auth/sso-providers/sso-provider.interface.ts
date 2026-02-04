import { SsoProviderMask } from "src/common/interfaces/sso-provider.enum";

export interface SsoUserData {
    email: string;
    username?: string;
    fullName?: string;
    departments?: string;
    avatar?: string;
    ssoMask: number; // es: 2 per LDAP, 4 per Google, ecc.
    [key: string]: any; // per eventuali campi custom futuri
}

export interface SsoProvider {
    /**
     * Tenta l'autenticazione con il provider SSO.
     * @param identifier email o username
     * @param password password in chiaro
     * @returns SsoUserData se autenticazione riuscita, null se fallita
     * @throws (opzionale) errori specifici del provider
     */
    authenticate(identifier: string, password: string): Promise<SsoUserData | null>;
    /**
     * Da chiamare nel costruttore per definire la configurazione
     */
    providerConfig(): any;
    /**
     * Restituisce url per cambio password sso
     */
    getChangePasswordUrl(): string;
    /**
     * Nome tecnico del provider (es: 'ldap', 'google', 'azure')
     */
    readonly providerName: string;
    readonly ssoMask: SsoProviderMask;
}