// src/types/pageProps.ts
export interface PageProps {
    params?: { [key: string]: string | string[] | undefined }
    searchParams?: Record<string, string | string[] | undefined>
  }
  