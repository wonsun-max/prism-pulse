import { AdMob, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';

export class AdManager {
  private static isInitialized: boolean = false;

  /**
   * Initialize AdMob SDK.
   * Required before showing any ads.
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // @ts-ignore - Only run if Capacitor is present
      if (!!window.Capacitor) {
        await AdMob.initialize({});
        this.isInitialized = true;
        console.log('[AdMob] Initialized Native SDK');
      }
    } catch (e) {
      console.error('[AdMob] Initialization failed', e);
    }
  }

  /**
   * Display the adaptive banner at the bottom.
   * Automatically falls back to a CSS mock if running in a web environment.
   */
  static async showBanner(): Promise<void> {
    if (!this.isInitialized) await this.initialize();

    const adId = import.meta.env.VITE_ADMOB_BANNER_ID;
    
    // Check environment
    // @ts-ignore
    const isNative = !!window.Capacitor;

    if (!isNative || !adId || adId.includes('ca-app-pub-XXXXXXXXXXXXXXXX')) {
      // PROD LOGIC: If ID is missing or we are in web, show the sleek integrated promo
      const banner = document.getElementById('ad-banner-mock');
      if (banner) banner.style.display = 'flex';
      return;
    }

    try {
      const mockBanner = document.getElementById('ad-banner-mock');
      if (mockBanner) mockBanner.style.display = 'none';

      await AdMob.showBanner({
        adId: adId,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: false // FINAL PROD SETTING
      });
    } catch (e) {
      console.error('[AdMob] Native Banner error, using fallback', e);
      const banner = document.getElementById('ad-banner-mock');
      if (banner) banner.style.display = 'flex';
    }
  }

  static async hideBanner(): Promise<void> {
    try {
      // @ts-ignore
      if (this.isInitialized && !!window.Capacitor) {
        await AdMob.hideBanner();
      }
      const banner = document.getElementById('ad-banner-mock');
      if (banner) banner.style.display = 'none';
    } catch (e) {
      console.error('[AdMob] Failed to hide banner', e);
    }
  }
}