import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    /**
     * When true, skips the global unauthorized handler in axios interceptors.
     */
    skipAuthErrorHandling?: boolean;
  }

  export interface InternalAxiosRequestConfig {
    skipAuthErrorHandling?: boolean;
  }
}
